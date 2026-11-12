import { describe, expect, it } from 'vitest';
import { getOpeningHoursForToday } from './openingHours';

describe('current opening hours', () => {
  it('selects today from Google weekday descriptions regardless of array order', () => {
    const hours = [
      'Tuesday: 9:00 AM – 6:00 PM',
      'Monday: 9:00 AM – 5:00 PM',
      'Wednesday: 9:00 AM – 6:00 PM',
    ];

    expect(getOpeningHoursForToday(hours, new Date(2026, 10, 9))).toBe('Monday: 9:00 AM – 5:00 PM');
  });

  it('does not substitute another day when today is absent', () => {
    expect(getOpeningHoursForToday(['Monday: 9:00 AM – 5:00 PM'], new Date(2026, 10, 10))).toBeNull();
  });
});
