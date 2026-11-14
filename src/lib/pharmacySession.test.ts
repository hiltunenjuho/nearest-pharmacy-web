import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearSessionPharmacySearch,
  isSameSearchArea,
  loadSessionPharmacySearch,
  saveSessionPharmacySearch,
} from './pharmacySession';
import type { Pharmacy } from '../types/pharmacy';

const sessionResultsKey = 'pharmacyFinder.searchResults';

function createStorage(initialEntries: Record<string, string> = {}) {
  const values = new Map(Object.entries(initialEntries));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

const pharmacy: Pharmacy = {
  id: 'pharmacy-1',
  name: 'Test Pharmacy',
  address: 'Example Street 1',
  lat: 60,
  lng: 24,
  todayHours: '09.00–17.00',
  openingHours: ['maanantai: 09.00–17.00'],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Pharmacy Finder session results', () => {
  it('restores results and their search area after a page reload', () => {
    const storage = createStorage();
    const search = {
      pharmacies: [pharmacy],
      origin: { lat: 60.17, lng: 24.94 },
      language: 'fi' as const,
    };
    saveSessionPharmacySearch(search, storage);

    expect(loadSessionPharmacySearch(storage)).toEqual(search);
  });

  it('discards malformed session data and warns', () => {
    const storage = createStorage({ [sessionResultsKey]: '{invalid json' });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(loadSessionPharmacySearch(storage)).toBeNull();
    expect(storage.getItem(sessionResultsKey)).toBeNull();
    expect(warning).toHaveBeenCalledOnce();
  });

  it('discards session data that does not contain pharmacies', () => {
    const storage = createStorage({ [sessionResultsKey]: JSON.stringify([{ name: 'Invalid' }]) });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(loadSessionPharmacySearch(storage)).toBeNull();
    expect(storage.getItem(sessionResultsKey)).toBeNull();
  });

  it('loads previous list-only session data without assuming its search location', () => {
    const storage = createStorage();

    storage.setItem(sessionResultsKey, JSON.stringify([pharmacy]));

    expect(loadSessionPharmacySearch(storage)).toEqual({
      pharmacies: [pharmacy],
      origin: null,
      language: null,
    });
  });

  it('retains a successful empty search so the same area is not searched again', () => {
    const storage = createStorage();
    const search = {
      pharmacies: [],
      origin: { lat: 60.17, lng: 24.94 },
      language: 'en' as const,
    };

    saveSessionPharmacySearch(search, storage);

    expect(loadSessionPharmacySearch(storage)).toEqual(search);
  });

  it('clears cached results when a new search fails', () => {
    const storage = createStorage();
    saveSessionPharmacySearch({
      pharmacies: [pharmacy],
      origin: { lat: 60.17, lng: 24.94 },
      language: 'en',
    }, storage);

    clearSessionPharmacySearch(storage);

    expect(loadSessionPharmacySearch(storage)).toBeNull();
  });

  it('treats coordinates within one kilometre as the same search area', () => {
    expect(isSameSearchArea(
      { lat: 60, lng: 24 },
      { lat: 60, lng: 24.005 },
    )).toBe(true);
    expect(isSameSearchArea(
      { lat: 60, lng: 24 },
      { lat: 60, lng: 24.02 },
    )).toBe(false);
  });
});
