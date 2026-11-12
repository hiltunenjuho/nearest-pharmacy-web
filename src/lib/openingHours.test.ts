import { describe, expect, it } from 'vitest';
import { getOpeningHoursForToday } from './openingHours';

describe('current opening hours', () => {
  it('evaluates a standard OpenStreetMap weekday schedule for today', () => {
    const hours = 'Mo-Fr 09:00-18:00; Sa 10:00-14:00; Su off';

    expect(getOpeningHoursForToday(hours, new Date(2026, 10, 9))).toBe('09:00-18:00');
    expect(getOpeningHoursForToday(hours, new Date(2026, 10, 14))).toBe('10:00-14:00');
    expect(getOpeningHoursForToday(hours, new Date(2026, 10, 15))).toBe('Closed today');
  });

  it('supports 24/7 and does not guess when holiday rules require local-calendar data', () => {
    expect(getOpeningHoursForToday('24/7')).toBe('Open 24 hours');
    expect(getOpeningHoursForToday('Mo-Fr 09:00-18:00; PH off', new Date(2026, 10, 9))).toBeNull();
  });

  it('does not apply a different weekday rule to today', () => {
    expect(getOpeningHoursForToday('Mo 09:00-17:00', new Date(2026, 10, 10))).toBeNull();
  });
});
