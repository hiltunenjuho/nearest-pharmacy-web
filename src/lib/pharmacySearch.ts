import type { Coordinates } from './location';
import type { Pharmacy } from '../types/pharmacy';

type SearchResponse = {
  pharmacies?: unknown;
  error?: string;
};

// This endpoint is public configuration; only the Google key stays in the Worker.
const DEFAULT_WORKER_ENDPOINT =
  'https://pharmacy-finder-api.juho-m-hiltunen.workers.dev/api/pharmacies/search';

function isPharmacy(value: unknown): value is Pharmacy {
  if (typeof value !== 'object' || value === null) return false;
  const pharmacy = value as Record<string, unknown>;
  return typeof pharmacy.id === 'string' &&
    typeof pharmacy.name === 'string' &&
    typeof pharmacy.address === 'string' &&
    typeof pharmacy.lat === 'number' &&
    typeof pharmacy.lng === 'number' &&
    typeof pharmacy.mapsUrl === 'string' &&
    (pharmacy.todayHours === null || typeof pharmacy.todayHours === 'string') &&
    Array.isArray(pharmacy.openingHours) &&
    pharmacy.openingHours.every((entry) => typeof entry === 'string') &&
    (pharmacy.phoneNumber === undefined || typeof pharmacy.phoneNumber === 'string');
}

function getEndpoint() {
  const configuredEndpoint = import.meta.env.VITE_PHARMACY_API_URL?.trim();
  if (configuredEndpoint) return configuredEndpoint;
  return import.meta.env.DEV ? '/api/pharmacies/search' : DEFAULT_WORKER_ENDPOINT;
}

export async function searchNearbyPharmacies(origin: Coordinates, language: 'en' | 'fi'): Promise<Pharmacy[]> {
  const response = await fetch(getEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...origin, language }),
  });
  let payload: SearchResponse;
  try {
    payload = await response.json() as SearchResponse;
  } catch {
    throw new Error(`Pharmacy search returned an invalid response (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    if (payload.error === 'demo_daily_limit') {
      throw new Error('GOOGLE_DEMO_DAILY_LIMIT');
    }
    if (payload.error === 'rate_limited') {
      throw new Error('PHARMACY_SEARCH_RATE_LIMITED');
    }
    if (payload.error === 'service_not_configured') {
      throw new Error('Pharmacy search service is not configured.');
    }
    throw new Error(`Pharmacy search failed (HTTP ${response.status}).`);
  }
  if (!Array.isArray(payload.pharmacies) || !payload.pharmacies.every(isPharmacy)) {
    throw new Error('Pharmacy search returned an invalid response.');
  }
  return payload.pharmacies;
}
