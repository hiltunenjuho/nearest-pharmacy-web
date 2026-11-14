import type { Pharmacy } from '../types/pharmacy';

export type OpeningCountdown = {
  isOpen: boolean;
  duration: string;
};

type OpeningTimes = Pick<Pharmacy, 'openNow' | 'nextOpenTime' | 'nextCloseTime'>;

export function getCurrentOpenStatus(
  pharmacy: OpeningTimes,
  now = Date.now(),
): boolean | null | undefined {
  const boundaries = [
    { value: pharmacy.nextOpenTime, isOpen: true },
    { value: pharmacy.nextCloseTime, isOpen: false },
  ]
    .map(({ value, isOpen }) => ({
      time: value ? Date.parse(value) : Number.NaN,
      isOpen,
    }))
    .filter(({ time }) => Number.isFinite(time) && time <= now)
    .sort((a, b) => a.time - b.time);

  return boundaries.length > 0
    ? boundaries[boundaries.length - 1].isOpen
    : pharmacy.openNow;
}

export function getOpeningCountdown(
  pharmacy: OpeningTimes,
  now = Date.now(),
): OpeningCountdown | null {
  const isOpen = getCurrentOpenStatus(pharmacy, now);
  if (typeof isOpen !== 'boolean') return null;

  const boundary = isOpen ? pharmacy.nextCloseTime : pharmacy.nextOpenTime;
  if (!boundary) return null;

  const boundaryTime = Date.parse(boundary);
  const minutesRemaining = Math.ceil((boundaryTime - now) / 60_000);
  if (!Number.isFinite(minutesRemaining) || minutesRemaining < 1) return null;

  const hours = Math.floor(minutesRemaining / 60);
  const minutes = minutesRemaining % 60;
  const duration = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  return { isOpen, duration };
}
