import { getDistanceKm, type Coordinates } from './location';
import { isPharmacy } from './pharmacySearch';
import type { Pharmacy } from '../types/pharmacy';

const SESSION_SEARCH_KEY = 'pharmacyFinder.searchResults';
const SAME_SEARCH_AREA_RADIUS_KM = 1;
type SearchLanguage = 'en' | 'fi';
type PharmacySessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type SessionPharmacySearch = {
  pharmacies: Pharmacy[];
  origin: Coordinates | null;
  language: SearchLanguage | null;
};

function isCoordinates(value: unknown): value is Coordinates {
  if (typeof value !== 'object' || value === null) return false;
  const coordinates = value as Record<string, unknown>;
  return typeof coordinates.lat === 'number' &&
    Number.isFinite(coordinates.lat) &&
    coordinates.lat >= -90 &&
    coordinates.lat <= 90 &&
    typeof coordinates.lng === 'number' &&
    Number.isFinite(coordinates.lng) &&
    coordinates.lng >= -180 &&
    coordinates.lng <= 180;
}

function isSearchLanguage(value: unknown): value is SearchLanguage {
  return value === 'en' || value === 'fi';
}

export function loadSessionPharmacySearch(
  storage: PharmacySessionStorage = window.sessionStorage,
): SessionPharmacySearch | null {
  const savedSearch = storage.getItem(SESSION_SEARCH_KEY);
  if (savedSearch === null) return null;

  let parsedSearch: unknown;
  try {
    parsedSearch = JSON.parse(savedSearch);
  } catch (error) {
    console.warn('Discarding malformed Pharmacy Finder session results.', error);
    storage.removeItem(SESSION_SEARCH_KEY);
    return null;
  }

  if (Array.isArray(parsedSearch) && parsedSearch.every(isPharmacy)) {
    return { pharmacies: parsedSearch, origin: null, language: null };
  }

  if (typeof parsedSearch === 'object' && parsedSearch !== null && !Array.isArray(parsedSearch)) {
    const search = parsedSearch as Record<string, unknown>;
    if (
      Array.isArray(search.pharmacies) &&
      search.pharmacies.every(isPharmacy) &&
      (search.origin === null || isCoordinates(search.origin)) &&
      (search.language === null || isSearchLanguage(search.language))
    ) {
      return {
        pharmacies: search.pharmacies,
        origin: search.origin,
        language: search.language,
      };
    }
  }

  console.warn('Discarding invalid Pharmacy Finder session results.');
  storage.removeItem(SESSION_SEARCH_KEY);
  return null;
}

export function saveSessionPharmacySearch(
  search: SessionPharmacySearch,
  storage: PharmacySessionStorage = window.sessionStorage,
) {
  storage.setItem(SESSION_SEARCH_KEY, JSON.stringify(search));
}

export function clearSessionPharmacySearch(
  storage: PharmacySessionStorage = window.sessionStorage,
) {
  storage.removeItem(SESSION_SEARCH_KEY);
}

export function isSameSearchArea(previous: Coordinates, current: Coordinates) {
  return getDistanceKm(previous, current) <= SAME_SEARCH_AREA_RADIUS_KM;
}
