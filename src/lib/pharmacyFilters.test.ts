import { describe, expect, it } from 'vitest';
import { filterPharmacies } from './pharmacyFilters';
import type { Pharmacy } from '../types/pharmacy';

const pharmacies: Pharmacy[] = [
  {
    id: 'open',
    name: 'Open',
    address: '',
    lat: 60,
    lng: 24,
    todayHours: null,
    openingHours: [],
    openNow: true,
    nextOpenTime: null,
  },
  {
    id: 'later',
    name: 'Later',
    address: '',
    lat: 60.1,
    lng: 24,
    todayHours: null,
    openingHours: [],
    openNow: false,
    nextOpenTime: '2025-01-06T10:00:00.000Z',
  },
  {
    id: 'unknown-opening-time',
    name: 'Unknown opening time',
    address: '',
    lat: 60,
    lng: 24,
    todayHours: null,
    openingHours: [],
    openNow: false,
    nextOpenTime: null,
  },
  {
    id: 'nearest',
    name: 'Nearest',
    address: '',
    lat: 60.01,
    lng: 24,
    todayHours: null,
    openingHours: [],
    openNow: false,
    nextOpenTime: '2025-01-06T09:00:00.000Z',
  },
  {
    id: 'same-time-farther',
    name: 'Same time, farther',
    address: '',
    lat: 60.1,
    lng: 24,
    todayHours: null,
    openingHours: [],
    openNow: false,
    nextOpenTime: '2025-01-06T09:00:00.000Z',
  },
  {
    id: 'unknown',
    name: 'Unknown',
    address: '',
    lat: 60,
    lng: 24,
    todayHours: null,
    openingHours: [],
    openNow: null,
    nextOpenTime: null,
  },
];

describe('filterPharmacies', () => {
  const beforeNextOpening = Date.parse('2025-01-06T08:00:00.000Z');

  it('keeps all results in their original order and includes only confirmed-open pharmacies', () => {
    expect(filterPharmacies(pharmacies, 'all', null, beforeNextOpening)).toEqual(pharmacies);
    expect(filterPharmacies(pharmacies, 'openNow', null, beforeNextOpening).map(({ id }) => id)).toEqual(['open']);
  });

  it('orders closed pharmacies by next opening, then by distance, with unknown times last', () => {
    expect(
      filterPharmacies(pharmacies, 'opensEarliest', { lat: 60, lng: 24 }, beforeNextOpening)
        .map(({ id }) => id),
    ).toEqual(['nearest', 'same-time-farther', 'later', 'unknown-opening-time']);
  });

  it('moves a pharmacy into the open filter once its cached opening time passes', () => {
    const pharmacy: Pharmacy = {
      id: 'opened',
      name: 'Opened',
      address: '',
      lat: 60,
      lng: 24,
      todayHours: null,
      openingHours: [],
      openNow: false,
      nextOpenTime: '2025-01-06T09:00:00.000Z',
      nextCloseTime: '2025-01-06T17:00:00.000Z',
    };

    expect(filterPharmacies([pharmacy], 'openNow', null, beforeNextOpening)).toEqual([]);
    expect(filterPharmacies(
      [pharmacy],
      'openNow',
      null,
      Date.parse('2025-01-06T09:00:00.000Z'),
    )).toEqual([pharmacy]);
  });
});
