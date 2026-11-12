import { describe, expect, it } from 'vitest';
import { getDistanceKm, getNearest, sortByDistance, type Coordinates } from './location';

type MockPharmacy = Coordinates & { id: string; area: string };

function mockPharmacy(id: string, area: string, lat: number, lng: number): MockPharmacy {
  return { id, area, lat, lng };
}

describe('nearby pharmacy ranking', () => {
  it('sorts nearest places first for Helsinki-area mock locations', () => {
    const pharmacies = [
      mockPharmacy('helsinki', 'Helsinki', 60.1699, 24.9384),
      mockPharmacy('espoo', 'Espoo', 60.205, 24.6564),
      mockPharmacy('vantaa', 'Vantaa', 60.2932, 25.0378),
      mockPharmacy('kauniainen', 'Kauniainen', 60.2129, 24.7272),
    ];

    const nearest = sortByDistance(pharmacies, { lat: 60.205, lng: 24.6564 });

    expect(nearest[0].area).toBe('Espoo');
    expect(nearest.map(({ id }) => id)).toHaveLength(4);
  });

  it('returns no more than the ten closest results in ascending distance order', () => {
    const pharmacies = Array.from({ length: 14 }, (_, index) =>
      mockPharmacy(`pharmacy-${index}`, 'Helsinki', 60.17 + index / 100, 24.94),
    );

    const nearest = getNearest(pharmacies, { lat: 60.17, lng: 24.94 });

    expect(nearest).toHaveLength(10);
    expect(nearest[0].id).toBe('pharmacy-0');
    expect(nearest[9].id).toBe('pharmacy-9');
  });

  it('calculates realistic distances for nearby coordinates', () => {
    const distance = getDistanceKm({ lat: 60.1699, lng: 24.9384 }, { lat: 60.1631, lng: 24.9399 });
    expect(distance).toBeGreaterThan(0.3);
    expect(distance).toBeLessThan(2);
  });

  it('uses the same distance sorting globally for New York, Tokyo, and Sydney', () => {
    const pharmacies = [
      mockPharmacy('new-york', 'New York', 40.7128, -74.006),
      mockPharmacy('tokyo', 'Tokyo', 35.6762, 139.6503),
      mockPharmacy('sydney', 'Sydney', -33.8688, 151.2093),
    ];

    expect(sortByDistance(pharmacies, { lat: 35.68, lng: 139.65 })[0].area).toBe('Tokyo');
    expect(sortByDistance(pharmacies, { lat: -33.87, lng: 151.21 })[0].area).toBe('Sydney');
    expect(sortByDistance(pharmacies, { lat: 40.71, lng: -74.01 })[0].area).toBe('New York');
  });
});
