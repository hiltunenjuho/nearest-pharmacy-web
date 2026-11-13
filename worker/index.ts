const PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';
// Request only fields rendered by the clients to keep provider responses focused.
const PLACES_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.nationalPhoneNumber',
  'places.utcOffsetMinutes',
  'places.currentOpeningHours.weekdayDescriptions',
].join(',');
const SEARCH_RADIUS_METERS = 50_000;
const RESULT_LIMIT = 10;
const MAX_BODY_BYTES = 2_048;

type Language = 'en' | 'fi';

type SearchInput = {
  lat: number;
  lng: number;
  language: Language;
};

type RateLimiter = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

export type Env = {
  GOOGLE_MAPS_DEMO_KEY: string;
  SEARCH_LIMITER: RateLimiter;
  ALLOWED_ORIGINS: string;
};

function formatHoursDescription(description: string, language: Language) {
  if (language !== 'fi') return description;

  return description.replace(
    /\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*([ap])\.?m\.?/gi,
    (_match, rawHour: string, minutes: string | undefined, period: string) => {
      let hour = Number(rawHour) % 12;
      if (period.toLowerCase() === 'p') hour += 12;
      return `${String(hour).padStart(2, '0')}.${minutes ?? '00'}`;
    },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseSearchInput(value: unknown): SearchInput | null {
  if (!isRecord(value)) return null;

  const { lat, lng, language } = value;
  if (
    typeof lat !== 'number' ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    typeof lng !== 'number' ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180 ||
    (language !== 'en' && language !== 'fi')
  ) {
    return null;
  }

  return { lat, lng, language };
}

function getAllowedOrigins(env: Env) {
  return new Set(env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean));
}

function createHeaders(origin: string | null, env: Env) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  });
  if (origin && getAllowedOrigins(env).has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Max-Age', '86400');
  }
  return headers;
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
  env: Env,
  additionalHeaders?: HeadersInit,
) {
  const headers = createHeaders(origin, env);
  new Headers(additionalHeaders).forEach((value, key) => headers.set(key, value));
  return new Response(JSON.stringify(body), { status, headers });
}

export function getTodayHours(
  descriptions: string[] | undefined,
  offsetMinutes: number | undefined,
  language: Language,
  now = new Date(),
) {
  if (!descriptions?.length || typeof offsetMinutes !== 'number' || !Number.isFinite(offsetMinutes)) {
    return null;
  }

  // Google weekday labels use the pharmacy's local time, not the Worker or user's timezone.
  const localDay = new Date(now.getTime() + offsetMinutes * 60_000).getUTCDay();
  const referenceDate = new Date(Date.UTC(2023, 0, 1 + localDay));
  const locale = language === 'fi' ? 'fi-FI' : 'en-US';
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' })
    .format(referenceDate)
    .toLocaleLowerCase(locale);
  const prefix = `${weekday}:`;
  const description = descriptions.find((entry) => entry.toLocaleLowerCase(locale).startsWith(prefix));
  return description ? formatHoursDescription(description.slice(prefix.length).trim(), language) || null : null;
}

function toPharmacy(value: unknown, language: Language) {
  if (!isRecord(value)) return null;

  const location = isRecord(value.location) ? value.location : null;
  const displayName = isRecord(value.displayName) ? value.displayName : null;
  const currentOpeningHours = isRecord(value.currentOpeningHours) ? value.currentOpeningHours : null;
  const id = value.id;
  const lat = location?.latitude;
  const lng = location?.longitude;
  if (
    typeof id !== 'string' ||
    typeof lat !== 'number' ||
    !Number.isFinite(lat) ||
    typeof lng !== 'number' ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  const descriptions = currentOpeningHours?.weekdayDescriptions;
  const openingHours = Array.isArray(descriptions)
    ? descriptions
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => formatHoursDescription(entry, language))
    : [];
  const utcOffsetMinutes = value.utcOffsetMinutes;
  const phoneNumber = value.nationalPhoneNumber;
  const address = value.formattedAddress;
  const name = typeof displayName?.text === 'string' ? displayName.text.trim() || 'Pharmacy' : 'Pharmacy';

  return {
    id,
    name,
    address: typeof address === 'string' ? address : '',
    lat,
    lng,
    todayHours: getTodayHours(
      openingHours,
      typeof utcOffsetMinutes === 'number' ? utcOffsetMinutes : undefined,
      language,
    ),
    openingHours,
    phoneNumber: typeof phoneNumber === 'string' ? phoneNumber : undefined,
  };
}

async function readJson(request: Request): Promise<unknown | null> {
  const contentLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return null;

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function isQuotaError(response: Response, body: unknown) {
  if (response.status === 429) return true;
  if (!isRecord(body) || !isRecord(body.error)) return false;
  const status = body.error.status;
  const message = body.error.message;
  return status === 'RESOURCE_EXHAUSTED' ||
    (typeof message === 'string' && /quota|daily limit|resource exhausted/i.test(message));
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);

  if (url.pathname !== '/api/pharmacies/search') {
    return jsonResponse({ error: 'not_found' }, 404, origin, env);
  }
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: 'origin_not_allowed' }, 403, origin, env);
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: createHeaders(origin, env) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, origin, env, { Allow: 'POST, OPTIONS' });
  }

  const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const rateLimit = await env.SEARCH_LIMITER.limit({ key: clientIp });
  if (!rateLimit.success) {
    return jsonResponse({ error: 'rate_limited' }, 429, origin, env);
  }

  if (!env.GOOGLE_MAPS_DEMO_KEY) {
    return jsonResponse({ error: 'service_not_configured' }, 503, origin, env);
  }

  const input = parseSearchInput(await readJson(request));
  if (!input) {
    return jsonResponse({ error: 'invalid_request' }, 400, origin, env);
  }

  let googleResponse: Response;
  try {
    googleResponse = await fetch(PLACES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_MAPS_DEMO_KEY,
        'X-Goog-FieldMask': PLACES_FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: ['pharmacy'],
        maxResultCount: RESULT_LIMIT,
        rankPreference: 'DISTANCE',
        languageCode: input.language,
        locationRestriction: {
          circle: {
            center: { latitude: input.lat, longitude: input.lng },
            radius: SEARCH_RADIUS_METERS,
          },
        },
      }),
    });
  } catch {
    return jsonResponse({ error: 'provider_unavailable' }, 502, origin, env);
  }

  if (!googleResponse.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await googleResponse.json();
    } catch {
      errorBody = null;
    }
    return isQuotaError(googleResponse, errorBody)
      ? jsonResponse({ error: 'demo_daily_limit' }, 503, origin, env)
      : jsonResponse({ error: 'provider_error', status: googleResponse.status }, 502, origin, env);
  }

  let payload: unknown;
  try {
    payload = await googleResponse.json();
  } catch {
    return jsonResponse({ error: 'invalid_provider_response' }, 502, origin, env);
  }
  if (!isRecord(payload) || (payload.places !== undefined && !Array.isArray(payload.places))) {
    return jsonResponse({ error: 'invalid_provider_response' }, 502, origin, env);
  }

  const places = Array.isArray(payload.places) ? payload.places : [];
  const pharmacies = places
    .map((place) => toPharmacy(place, input.language))
    .filter((place): place is NonNullable<typeof place> => place !== null);
  return jsonResponse({ pharmacies }, 200, origin, env);
}

export default { fetch: handleRequest };
