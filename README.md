# Pharmacy Finder Web

A personal nearest-pharmacy experience built and branded by Juho Hiltunen.

## What it does

- Requests the user's location and searches Google Places Nearby Search for pharmacies
- Displays up to 10 results, sorted by straight-line distance
- Shows returned address, Google Places current opening hours (today’s hours where available), phone number, and Google Maps links
- Uses no hardcoded pharmacy directory or fabricated business details

## Brand direction

- Dark neutral base: `#1F1F1F`
- Accent: pharmacy green (`#5AD38A`)
- App title: `Pharmacy Finder | Juho Hiltunen`
- Favicon: minimalist green medical cross

## Run locally

```bash
npm install
```

Create `.env.local` using `.env.example` and set a Google Maps Platform API key:

```env
VITE_GOOGLE_MAPS_API_KEY=your_restricted_key
```

Enable Maps JavaScript API and Places API (New) in a Google Cloud project with billing. Restrict the browser key to those APIs and the exact local/demo HTTP referrers; browser keys are visible to users and must never be treated as secrets.

Then start the app:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Demo

https://hiltunenjuho.github.io/nearest-pharmacy-web/

## License

This project is released under the [MIT License](./LICENSE).
The license applies to this project's code; Google Maps content is subject to Google Maps Platform terms.

## Author

- [Portfolio](https://hiltunenjuho.github.io/)
- [GitHub](https://github.com/hiltunenjuho)
- [LinkedIn](https://www.linkedin.com/in/hiltunenjuho/)
- [Web repository](https://github.com/hiltunenjuho/nearest-pharmacy-web)

## GitHub Pages configuration

Add a repository Actions secret named `GOOGLE_MAPS_API_KEY`. The deploy workflow injects it at build time as `VITE_GOOGLE_MAPS_API_KEY`. Restrict this key to Maps JavaScript API and Places API (New), and to the exact GitHub Pages and local development referrers. Until the secret and Google Cloud API setup are in place, the app displays a configuration error instead of fake fallback data.

Google Maps Platform usage can incur charges. The search requests only the fields used by the app; review current Google Maps Platform pricing and quotas before enabling public use. Results are fetched on demand and are not persisted.
