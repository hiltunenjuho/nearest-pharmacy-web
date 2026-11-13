export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  todayHours: string | null;
  openingHours: string[];
  phoneNumber?: string;
  mapsUrl: string;
};
