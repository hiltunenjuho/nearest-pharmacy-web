# Pharmacy Finder Web

A global nearest-pharmacy finder built by Juho Hiltunen with React, TypeScript, and Vite.

## Features

- Uses browser geolocation to search around the user's current position anywhere in the world
- Fetches up to 10 pharmacies from OpenStreetMap via public Overpass API instances
- Searches within a maximum radius of 50 km and returns up to the 10 closest results
- Sorts results by straight-line distance and displays mapped addresses, contact details, and today's hours when available
- Provides map directions and OpenStreetMap links
- Includes System, Light, and Dark appearance options; System follows the operating-system preference
- Includes an English/Finnish language toggle, initially using the browser's system language
- Provides an in-app information panel describing the search, data quality, and location privacy

The app requires no Google Maps API key, account, or billing configuration. Overpass instances are public community services and do not guarantee uptime. OpenStreetMap coverage and mapped details vary by area; fewer than 10 results may be returned. Opening-hours information is community-maintained and may omit holidays or be out of date. Confirm details before travelling.

The app sends the coordinates needed to perform the pharmacy search to an Overpass service. It does not persist location or results. Pharmacy data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [ODbL](https://opendatacommons.org/licenses/odbl/).

## Run locally

```bash
npm install
npm run dev
```

No API key or `.env` file is required.

## Build and test

```bash
npm run build
npm test
```

## Demo

[Open Pharmacy Finder](https://hiltunenjuho.github.io/nearest-pharmacy-web/)

## License and author

Application code is available under the [MIT License](./LICENSE); OpenStreetMap data remains under the ODbL.

- [Portfolio](https://hiltunenjuho.github.io/)
- [GitHub](https://github.com/hiltunenjuho)
- [LinkedIn](https://www.linkedin.com/in/hiltunenjuho/)
- [Web repository](https://github.com/hiltunenjuho/nearest-pharmacy-web)

## GitHub Pages

The included Actions workflow builds and deploys the static app without secrets or provider-specific configuration.
