import { describe, expect, it } from 'vitest';
import { getCurrentOpenStatus, getOpeningCountdown } from './openingCountdown';

const now = Date.parse('2026-11-13T20:00:00.000Z');

describe('getOpeningCountdown', () => {
  it('counts down to the next close time while the pharmacy is open', () => {
    expect(getOpeningCountdown({
      openNow: true,
      nextOpenTime: null,
      nextCloseTime: '2026-11-14T00:24:30.000Z',
    }, now)).toEqual({ isOpen: true, duration: '4h 25min' });
  });

  it('counts down to the next opening time while the pharmacy is closed', () => {
    expect(getOpeningCountdown({
      openNow: false,
      nextOpenTime: '2026-11-14T02:43:00.000Z',
      nextCloseTime: null,
    }, now)).toEqual({ isOpen: false, duration: '6h 43min' });
  });

  it('updates cached open status and countdowns when the next opening time passes', () => {
    const pharmacy = {
      openNow: false,
      nextOpenTime: '2026-11-13T19:59:00.000Z',
      nextCloseTime: '2026-11-13T21:15:00.000Z',
    };

    expect(getCurrentOpenStatus(pharmacy, now)).toBe(true);
    expect(getOpeningCountdown(pharmacy, now)).toEqual({ isOpen: true, duration: '1h 15min' });
  });

  it('updates cached open status when the next closing time passes', () => {
    expect(getCurrentOpenStatus({
      openNow: true,
      nextOpenTime: null,
      nextCloseTime: '2026-11-13T19:59:00.000Z',
    }, now)).toBe(false);
  });

  it('omits a countdown when the opening status or upcoming boundary is unavailable', () => {
    expect(getOpeningCountdown({ openNow: null, nextOpenTime: null, nextCloseTime: null }, now)).toBeNull();
    expect(getOpeningCountdown({ openNow: true, nextOpenTime: null, nextCloseTime: null }, now)).toBeNull();
    expect(getOpeningCountdown({
      openNow: true,
      nextOpenTime: null,
      nextCloseTime: '2026-11-13T19:59:00.000Z',
    }, now)).toBeNull();
  });
});
