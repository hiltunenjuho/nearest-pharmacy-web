import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchNearbyPharmacies } from './pharmacySearch';

const workerErrors: Array<[string, number, string]> = [
  ['demo_daily_limit', 503, 'GOOGLE_DEMO_DAILY_LIMIT'],
  ['rate_limited', 429, 'PHARMACY_SEARCH_RATE_LIMITED'],
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('searchNearbyPharmacies', () => {
  it('returns normalized pharmacy results from the Worker', async () => {
    vi.stubEnv('VITE_PHARMACY_API_URL', 'https://api.example/api/pharmacies/search');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      pharmacies: [{
        id: 'place-123',
        name: 'Pharmacy',
        address: 'Street 1',
        lat: 60,
        lng: 24,
        todayHours: null,
        openingHours: [],
        openNow: false,
        nextOpenTime: '2025-01-06T09:00:00.000Z',
        nextCloseTime: null,
      }],
    }), { status: 200 })));

    await expect(searchNearbyPharmacies({ lat: 60, lng: 24 }, 'en')).resolves.toMatchObject([
      { id: 'place-123', name: 'Pharmacy' },
    ]);
  });

  it('accepts existing Worker responses without opening-status fields', async () => {
    vi.stubEnv('VITE_PHARMACY_API_URL', 'https://api.example/api/pharmacies/search');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      pharmacies: [{
        id: 'place-legacy',
        name: 'Pharmacy',
        address: 'Street 1',
        lat: 60,
        lng: 24,
        todayHours: null,
        openingHours: [],
      }],
    }), { status: 200 })));

    await expect(searchNearbyPharmacies({ lat: 60, lng: 24 }, 'en')).resolves.toMatchObject([
      { id: 'place-legacy', name: 'Pharmacy' },
    ]);
  });

  it('uses the deployed Worker endpoint for production builds without an override', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_PHARMACY_API_URL', '');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ pharmacies: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchNearbyPharmacies({ lat: 60, lng: 24 }, 'en')).resolves.toEqual([]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://pharmacy-finder-api.juho-m-hiltunen.workers.dev/api/pharmacies/search',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it.each(workerErrors)('translates Worker error %s into a recognizable client error', async (code, status, expectedError) => {
    vi.stubEnv('VITE_PHARMACY_API_URL', 'https://api.example/api/pharmacies/search');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: code }), { status })));

    await expect(searchNearbyPharmacies({ lat: 60, lng: 24 }, 'en')).rejects.toThrow(expectedError);
  });
});
