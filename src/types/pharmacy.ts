export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  todayHours: string | null;
  openingHours: string[];
  openNow?: boolean | null;
  nextOpenTime?: string | null;
  nextCloseTime?: string | null;
  phoneNumber?: string;
};
