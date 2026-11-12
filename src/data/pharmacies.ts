export type Pharmacy = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  hours: string;
  services: string[];
};

export const PHARMACIES: Pharmacy[] = [
  {
    id: 'apteekki-1',
    name: 'Kallion Apteekki',
    address: 'Kallionkatu 7, Helsinki',
    lat: 60.1828,
    lng: 24.9582,
    hours: 'Auki 08:00–22:00',
    services: ['Päivystys', 'Sairauslomat', 'Vaccinations'],
  },
  {
    id: 'apteekki-2',
    name: 'Munkkiniemen APT',
    address: 'Munkkiniemenkatu 18, Helsinki',
    lat: 60.2053,
    lng: 24.8766,
    hours: 'Auki 09:00–20:00',
    services: ['Lääkärin ohjeet', 'Aikataulutettu neuvonta'],
  },
  {
    id: 'apteekki-3',
    name: 'Punavuoren Lääke',
    address: 'Purokatu 8, Helsinki',
    lat: 60.1631,
    lng: 24.9399,
    hours: 'Auki 08:30–21:30',
    services: ['Vauva- ja perhepalvelut', 'Vastaanotto'],
  },
  {
    id: 'apteekki-4',
    name: 'Haaga Apteekki',
    address: 'Haaga WEG 21, Helsinki',
    lat: 60.2194,
    lng: 24.8758,
    hours: 'Auki 07:30–21:00',
    services: ['Nopea kuormitus', 'Raskausajan neuvonta'],
  },
  {
    id: 'apteekki-5',
    name: 'LähiLääke Malmi',
    address: 'Malmin kauppatie 18, Helsinki',
    lat: 60.2566,
    lng: 25.0064,
    hours: 'Auki 09:00–22:00',
    services: ['Säännöllinen toimitus', 'Avoinna myöhään'],
  },
  {
    id: 'apteekki-6',
    name: 'Kamppi Apteekki',
    address: 'Mannerheimintie 7, Helsinki',
    lat: 60.1698,
    lng: 24.9384,
    hours: 'Auki 08:00–20:00',
    services: ['Kaupunkikeskus', 'Lääkevalikoima'],
  },
  {
    id: 'apteekki-7',
    name: 'Itäkeskuksen Terveysapteekki',
    address: 'Itäkeskuksen kauppakeskus, Helsinki',
    lat: 60.2119,
    lng: 25.0808,
    hours: 'Auki 09:00–21:00',
    services: ['Nopea palvelu', 'Raskauden testit'],
  },
  {
    id: 'apteekki-8',
    name: 'Sörnäisten Apteekki',
    address: 'Kauppakatu 3, Helsinki',
    lat: 60.1898,
    lng: 24.9649,
    hours: 'Auki 08:00–20:30',
    services: ['Lähitapiola', 'Monipuolinen palvelu'],
  },
];
