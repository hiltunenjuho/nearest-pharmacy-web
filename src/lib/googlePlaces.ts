import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { getNearest, type Coordinates } from './location';
import type { Pharmacy } from '../types/pharmacy';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const SEARCH_RADIUS_METERS = 50_000;
const RESULT_LIMIT = 10;

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | undefined;

function getPlacesLibrary() {
  if (!API_KEY) {
    throw new Error('Google Maps is not configured. Add VITE_GOOGLE_MAPS_API_KEY to your environment.');
  }

  if (!placesLibraryPromise) {
    setOptions({ key: API_KEY, v: 'weekly', language: 'en', region: 'FI' });
    placesLibraryPromise = importLibrary('places') as Promise<google.maps.PlacesLibrary>;
  }

  return placesLibraryPromise;
}

export async function searchNearbyPharmacies(origin: Coordinates): Promise<Pharmacy[]> {
  const { Place, SearchNearbyRankPreference } = await getPlacesLibrary();
  const { places } = await Place.searchNearby({
    fields: [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'currentOpeningHours',
      'nationalPhoneNumber',
      'googleMapsURI',
    ],
    includedPrimaryTypes: ['pharmacy'],
    locationRestriction: {
      center: origin,
      radius: SEARCH_RADIUS_METERS,
    },
    maxResultCount: 10,
    rankPreference: SearchNearbyRankPreference.DISTANCE,
  });

  const results: Pharmacy[] = [];
  for (const place of places) {
    if (!place.id || !place.displayName || !place.location) {
      continue;
    }

    results.push({
      id: place.id,
      name: place.displayName,
      address: place.formattedAddress ?? '',
      lat: place.location.lat(),
      lng: place.location.lng(),
      currentWeekHours: place.currentOpeningHours?.weekdayDescriptions ?? [],
      phoneNumber: place.nationalPhoneNumber ?? undefined,
      mapsUrl: place.googleMapsURI ?? undefined,
    });
  }

  return getNearest(results, origin, RESULT_LIMIT);
}
