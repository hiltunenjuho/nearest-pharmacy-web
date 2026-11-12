import { getNearest, type Coordinates } from './location';
import type { Pharmacy } from '../types/pharmacy';

const RESULT_LIMIT = 10;
const SEARCH_RADIUS_METERS = 50_000;
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function buildQuery(origin: Coordinates, radius: number) {
  return [
    '[out:json][timeout:25];',
    '(',
    `nwr["amenity"="pharmacy"](around:${radius},${origin.lat},${origin.lng});`,
    `nwr["healthcare"="pharmacy"](around:${radius},${origin.lat},${origin.lng});`,
    ');',
    'out center tags;',
  ].join('');
}

function toPharmacy(element: OverpassElement): Pharmacy | null {
  const location = element.lat !== undefined && element.lon !== undefined
    ? { lat: element.lat, lng: element.lon }
    : element.center
      ? { lat: element.center.lat, lng: element.center.lon }
      : null;
  if (!location) {
    return null;
  }

  const tags = element.tags ?? {};
  const name = tags.name ?? tags['name:en'] ?? tags['name:local'] ?? 'Pharmacy';
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const locality = tags['addr:city'] ?? tags['addr:town'] ?? tags['addr:village'] ?? tags['addr:suburb'];
  const address = [street, tags['addr:postcode'], locality].filter(Boolean).join(', ');

  return {
    id: `${element.type}/${element.id}`,
    name,
    address,
    lat: location.lat,
    lng: location.lng,
    openingHours: tags.opening_hours,
    phoneNumber: tags.phone ?? tags['contact:phone'],
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
}

async function fetchFromEndpoint(endpoint: string, query: string, signal: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ data: query }),
    signal,
  });
  if (!response.ok) {
    throw new Error(`OpenStreetMap search failed (HTTP ${response.status}).`);
  }

  const payload: { elements?: OverpassElement[] } = await response.json();
  if (!Array.isArray(payload.elements)) {
    throw new Error('OpenStreetMap returned an invalid pharmacy search response.');
  }
  return payload.elements;
}

export async function searchNearbyPharmacies(origin: Coordinates): Promise<Pharmacy[]> {
  const errors: string[] = [];
  const found = new Map<string, Pharmacy>();

  const query = buildQuery(origin, SEARCH_RADIUS_METERS);
  let response: OverpassElement[] | undefined;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      response = await fetchFromEndpoint(endpoint, query, controller.signal);
      break;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown OpenStreetMap error.');
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (!response) {
    throw new Error(`Free OpenStreetMap search is temporarily unavailable. Please try again later. ${errors.join(' ')}`);
  }

  for (const element of response) {
    const pharmacy = toPharmacy(element);
    if (pharmacy) {
      found.set(pharmacy.id, pharmacy);
    }
  }

  return getNearest([...found.values()], origin, RESULT_LIMIT);
}
