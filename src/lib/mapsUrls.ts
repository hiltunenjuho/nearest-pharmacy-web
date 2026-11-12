import type { Pharmacy } from '../types/pharmacy';

export function getDirectionsUrl(pharmacy: Pick<Pharmacy, 'lat' | 'lng'>) {
  const query = new URLSearchParams({
    api: '1',
    destination: `${pharmacy.lat},${pharmacy.lng}`,
  });

  return `https://www.google.com/maps/dir/?${query.toString()}`;
}
