import { getDistanceKm, type Coordinates } from './location';
import { getCurrentOpenStatus } from './openingCountdown';
import type { Pharmacy } from '../types/pharmacy';

export type PharmacyFilter = 'all' | 'openNow' | 'opensEarliest';

function getOpeningTimestamp(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

export function filterPharmacies(
  pharmacies: Pharmacy[],
  filter: PharmacyFilter,
  origin: Coordinates | null,
  now = Date.now(),
): Pharmacy[] {
  if (filter === 'all') return pharmacies;
  if (filter === 'openNow') {
    return pharmacies.filter((pharmacy) => getCurrentOpenStatus(pharmacy, now) === true);
  }

  return pharmacies
    .filter((pharmacy) => getCurrentOpenStatus(pharmacy, now) === false)
    .sort((a, b) => {
      const aOpening = getOpeningTimestamp(a.nextOpenTime);
      const bOpening = getOpeningTimestamp(b.nextOpenTime);
      if (aOpening !== bOpening) return aOpening < bOpening ? -1 : 1;

      if (origin) {
        const aDistance = getDistanceKm(origin, { lat: a.lat, lng: a.lng });
        const bDistance = getDistanceKm(origin, { lat: b.lat, lng: b.lng });
        if (aDistance !== bDistance) return aDistance - bDistance;
      }

      return 0;
    });
}
