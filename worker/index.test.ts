import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTodayHours, handleRequest, parseSearchInput, type Env } from './index';

const origins = 'https://hiltunenjuho.github.io,http://localhost:3000';

function createEnv(allowed = true): Env {
  return {
    GOOGLE_MAPS_DEMO_KEY: 'test-demo-key',
    ALLOWED_ORIGINS: origins,
    SEARCH_LIMITER: {
      limit: vi.fn().mockResolvedValue({ success: allowed }),
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('getTodayHours', () => {
  it('uses the pharmacy local weekday rather than the browser or worker timezone', () => {
    expect(getTodayHours(
      ['sunnuntai: Suljettu', 'maanantai: 9.00–17.00'],
      120,
      'fi',
      new Date('2025-01-05T22:00:00.000Z'),
    )).toBe('9.00–17.00');
  });

  it('uses 24-hour time for Finnish and keeps AM/PM for English', () => {
    const descriptions = ['maanantai: 9:00 AM–5:30 PM'];
    const monday = new Date('2025-01-06T10:00:00.000Z');

    expect(getTodayHours(descriptions, 0, 'fi', monday)).toBe('09.00–17.30');
    expect(getTodayHours(['monday: 9:00 AM–5:30 PM'], 0, 'en', monday)).toBe('9:00 AM–5:30 PM');
    expect(getTodayHours(['maanantai: 12:00 AM–12:00 PM'], 0, 'fi', monday)).toBe('00.00–12.00');
  });
});

describe('parseSearchInput', () => {
  it('accepts supported languages and valid global coordinates', () => {
    expect(parseSearchInput({ lat: 60.17, lng: 24.94, language: 'fi' })).toEqual({
      lat: 60.17,
      lng: 24.94,
      language: 'fi',
    });
    expect(parseSearchInput({ lat: -90, lng: 180, language: 'en' })).not.toBeNull();
  });

  it('rejects invalid coordinates and languages', () => {
    expect(parseSearchInput({ lat: 91, lng: 24, language: 'en' })).toBeNull();
    expect(parseSearchInput({ lat: 60, lng: Number.NaN, language: 'fi' })).toBeNull();
    expect(parseSearchInput({ lat: 60, lng: 24, language: 'sv' })).toBeNull();
  });
});

describe('Cloudflare Places Worker', () => {
  it('applies the 50 km, 10-result pharmacy search and returns normalized live hours', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-05T22:00:00.000Z'));
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      places: [{
        id: 'place-123',
        displayName: { text: 'Apteekki' },
        formattedAddress: 'Katu 1, Helsinki',
        location: { latitude: 60.17, longitude: 24.94 },
        nationalPhoneNumber: '+358 9 123 456',
        utcOffsetMinutes: 120,
        currentOpeningHours: {
          weekdayDescriptions: [
            'sunnuntai: Suljettu',
            'maanantai: 9:00 AM–5:00 PM',
            'tiistai: 9.00–17.00',
            'keskiviikko: 9.00–17.00',
            'torstai: 9.00–17.00',
            'perjantai: 9.00–17.00',
            'lauantai: 10.00–14.00',
          ],
        },
      }],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('https://api.example/api/pharmacies/search', {
      method: 'POST',
      headers: {
        Origin: 'https://hiltunenjuho.github.io',
        'CF-Connecting-IP': '192.0.2.1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lat: 60.17, lng: 24.94, language: 'fi' }),
    });

    const response = await handleRequest(request, createEnv());
    const body = await response.json() as { pharmacies: Array<Record<string, unknown>> };
    const [googleUrl, googleOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    const googleBody = JSON.parse(String(googleOptions.body));

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://hiltunenjuho.github.io');
    expect(body.pharmacies[0]).toMatchObject({
      id: 'place-123',
      todayHours: '09.00–17.00',
    });
    expect(body.pharmacies[0]).not.toHaveProperty('mapsUrl');
    expect(body.pharmacies[0].openingHours).toContain('maanantai: 09.00–17.00');
    expect(googleUrl).toBe('https://places.googleapis.com/v1/places:searchNearby');
    expect(googleOptions.headers).toMatchObject({
      'X-Goog-Api-Key': 'test-demo-key',
    });
    expect(googleBody).toMatchObject({
      includedTypes: ['pharmacy'],
      maxResultCount: 10,
      rankPreference: 'DISTANCE',
      locationRestriction: {
        circle: {
          center: { latitude: 60.17, longitude: 24.94 },
          radius: 50_000,
        },
      },
    });
  });

  it('rejects unapproved browser origins before reaching Google', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('https://api.example/api/pharmacies/search', {
      method: 'POST',
      headers: { Origin: 'https://attacker.example' },
      body: '{}',
    });

    const response = await handleRequest(request, createEnv());
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stops rate-limited callers before using the Demo Key', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('https://api.example/api/pharmacies/search', {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '192.0.2.2', 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 60, lng: 24, language: 'en' }),
    });

    const response = await handleRequest(request, createEnv(false));
    expect(response.status).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports the Demo Key daily quota without exposing upstream details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { status: 'RESOURCE_EXHAUSTED', message: 'Daily quota exceeded' },
    }), { status: 429 })));
    const request = new Request('https://api.example/api/pharmacies/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: 60, lng: 24, language: 'en' }),
    });

    const response = await handleRequest(request, createEnv());
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'demo_daily_limit' });
  });
});
