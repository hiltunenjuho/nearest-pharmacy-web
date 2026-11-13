import type { Pharmacy } from '../types/pharmacy';

export type OpeningCountdown = {
  isOpen: boolean;
  duration: string;
};

type OpeningTimes = Pick<Pharmacy, 'openNow' | 'nextOpenTime' | 'nextCloseTime'>;

export function getOpeningCountdown(
  pharmacy: OpeningTimes,
  now = Date.now(),
): OpeningCountdown | null {
  if (typeof pharmacy.openNow !== 'boolean') return null;

  const boundary = pharmacy.openNow ? pharmacy.nextCloseTime : pharmacy.nextOpenTime;
  if (!boundary) return null;

  const boundaryTime = Date.parse(boundary);
  const minutesRemaining = Math.ceil((boundaryTime - now) / 60_000);
  if (!Number.isFinite(minutesRemaining) || minutesRemaining < 1) return null;

  const hours = Math.floor(minutesRemaining / 60);
  const minutes = minutesRemaining % 60;
  const duration = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  return { isOpen: pharmacy.openNow, duration };
}
