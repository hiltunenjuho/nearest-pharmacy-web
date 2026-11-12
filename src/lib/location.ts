export type Coordinates = {
  lat: number;
  lng: number;
};

export function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function getDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function sortByDistance<T extends Coordinates>(items: T[], origin: Coordinates) {
  return [...items].sort(
    (a, b) => getDistanceKm(origin, a) - getDistanceKm(origin, b),
  );
}

export function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}
