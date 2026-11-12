import type { Pharmacy } from '../types/pharmacy';

export function getDirectionsUrl(pharmacy: Pick<Pharmacy, 'id' | 'lat' | 'lng'>) {
  const query = new URLSearchParams({
    api: '1',
    destination: `${pharmacy.lat},${pharmacy.lng}`,
    destination_place_id: pharmacy.id,
  });

  return `https://www.google.com/maps/dir/?${query.toString()}`;
}
