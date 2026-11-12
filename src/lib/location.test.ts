import { describe, expect, it } from 'vitest';
import { PHARMACIES } from '../data/pharmacies';
import { getDistanceKm, sortByDistance } from './location';

describe('pharmacy geolocation logic', () => {
  it('ranks the closest central Helsinki pharmacy first', () => {
    const nearest = sortByDistance(PHARMACIES, { lat: 60.1699, lng: 24.9384 })[0];
    expect(nearest.name).toBe('Kamppi Apteekki');
  });

  it('keeps regional matching correct in Espoo', () => {
    const nearest = sortByDistance(PHARMACIES, { lat: 60.205, lng: 24.6564 })[0];
    expect(nearest.city).toBe('Espoo');
    expect(nearest.name).toBe('Espoon Keskus Apteekki');
  });

  it('works for Vantaa and Kauniainen mock locations', () => {
    const vantaaNearest = sortByDistance(PHARMACIES, { lat: 60.2932, lng: 25.0378 })[0];
    const kauniainenNearest = sortByDistance(PHARMACIES, { lat: 60.2129, lng: 24.7272 })[0];

    expect(vantaaNearest.city).toBe('Vantaa');
    expect(kauniainenNearest.city).toBe('Kauniainen');
  });

  it('calculates realistic distances for nearby locations', () => {
    const distance = getDistanceKm({ lat: 60.1699, lng: 24.9384 }, { lat: 60.1631, lng: 24.9399 });
    expect(distance).toBeGreaterThan(0.3);
    expect(distance).toBeLessThan(2);
  });
});
