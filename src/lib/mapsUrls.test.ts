import { describe, expect, it } from 'vitest';
import { getDirectionsUrl } from './mapsUrls';

describe('Google Maps directions links', () => {
  it('targets the exact pharmacy coordinates without a provider place ID', () => {
    const url = new URL(getDirectionsUrl({
      lat: 60.2617,
      lng: 24.8443,
    }));

    expect(url.pathname).toBe('/maps/dir/');
    expect(url.searchParams.get('api')).toBe('1');
    expect(url.searchParams.get('destination')).toBe('60.2617,24.8443');
    expect(url.searchParams.has('destination_place_id')).toBe(false);
  });
});
