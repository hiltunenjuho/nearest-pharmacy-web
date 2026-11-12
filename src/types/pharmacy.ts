export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  currentWeekHours: string[];
  phoneNumber?: string;
  mapsUrl?: string;
};
