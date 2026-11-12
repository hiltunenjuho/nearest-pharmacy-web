import { useState } from 'react';
import { searchNearbyPharmacies } from './lib/googlePlaces';
import { formatDistance, getDistanceKm, type Coordinates } from './lib/location';
import { getDirectionsUrl } from './lib/mapsUrls';
import { getOpeningHoursForToday } from './lib/openingHours';
import { getPhoneUrl } from './lib/phoneUrl';
import type { Pharmacy } from './types/pharmacy';

function App() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = pharmacies.find((item) => item.id === selectedId) ?? pharmacies[0];

  const handleLocate = async () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported in this browser.');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10_000,
        });
      });
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserLocation(location);

      const results = await searchNearbyPharmacies(location);
      setPharmacies(results);
      setSelectedId(results[0]?.id ?? null);
      if (results.length === 0) {
        setErrorMessage('No pharmacies were found within 50 km of your location.');
      }
    } catch (error) {
      setPharmacies([]);
      setSelectedId(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not load nearby pharmacies. Check your connection and try again.',
      );
    } finally {
      setIsSearching(false);
    }
  };

  const heroDistance =
    userLocation && selected ? getDistanceKm(userLocation, { lat: selected.lat, lng: selected.lng }) : null;
  const todayHours = selected ? getOpeningHoursForToday(selected.currentWeekHours) : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-heading">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
          <div>
            <div className="eyebrow">Juho Hiltunen</div>
            <h1>Pharmacy Finder</h1>
          </div>
        </div>
        <button className="primary-button" onClick={handleLocate} disabled={isSearching}>
          {isSearching ? 'Finding nearby pharmacies...' : 'Find nearby pharmacies'}
        </button>
      </header>

      <p className="subtitle">Live pharmacy results near you, sorted by distance.</p>

      {errorMessage ? <p className="notice">{errorMessage}</p> : null}

      <main className="content-grid">
        <section className="panel list-panel">
          <div className="panel-header">
            <h2>Nearest pharmacies</h2>
            <span>{pharmacies.length} of up to 10</span>
          </div>

          <div className="pharmacy-list">
            {pharmacies.map((pharmacy) => {
              const distance = userLocation
                ? getDistanceKm(userLocation, { lat: pharmacy.lat, lng: pharmacy.lng })
                : null;
              const active = pharmacy.id === selected?.id;

              return (
                <button
                  key={pharmacy.id}
                  type="button"
                  className={`pharmacy-card ${active ? 'active' : ''}`}
                  onClick={() => setSelectedId(pharmacy.id)}
                >
                  <div className="card-row">
                    <div>
                      <strong>{pharmacy.name}</strong>
                      <p>{pharmacy.address || 'Address not provided'}</p>
                    </div>
                    {distance !== null ? <span>{formatDistance(distance)}</span> : null}
                  </div>
                  <small>{getOpeningHoursForToday(pharmacy.currentWeekHours) ?? 'Hours unavailable'}</small>
                </button>
              );
            })}
            {!isSearching && pharmacies.length === 0 ? (
              <p className="empty-state">Find your location to load nearby pharmacies from Google Maps.</p>
            ) : null}
          </div>
        </section>

        <aside className="panel detail-panel">
          {selected ? (
            <>
              <div className="badge-row">
                {heroDistance !== null ? <span className="pill muted">{formatDistance(heroDistance)}</span> : null}
              </div>

              <h2>{selected.name}</h2>
              <p className="address">{selected.address || 'Address not provided'}</p>

              <div className="meta-grid">
                <div>
                  <label>OPEN TODAY</label>
                  <strong>{todayHours ?? 'Hours unavailable'}</strong>
                </div>
                <div>
                  <label>Phone</label>
                  {selected.phoneNumber && getPhoneUrl(selected.phoneNumber)
                    ? <a href={getPhoneUrl(selected.phoneNumber)}>{selected.phoneNumber}</a>
                    : <strong>Not provided</strong>}
                </div>
              </div>

              {selected.currentWeekHours.length > 0 ? (
                <details className="hours-details">
                  <summary>This week’s hours</summary>
                  <ul>
                    {selected.currentWeekHours.map((hours) => <li key={hours}>{hours}</li>)}
                  </ul>
                </details>
              ) : null}

              <div className="attribution" translate="no">
                Pharmacy information from <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>
              </div>

              <div className="cta-row">
                <a href={getDirectionsUrl(selected)} target="_blank" rel="noreferrer">Get directions</a>
                {selected.mapsUrl ? <a href={selected.mapsUrl} target="_blank" rel="noreferrer">View in Google Maps</a> : null}
                {selected.phoneNumber && getPhoneUrl(selected.phoneNumber)
                  ? <a href={getPhoneUrl(selected.phoneNumber)} title={selected.phoneNumber}>Call pharmacy</a>
                  : null}
              </div>
            </>
          ) : <p className="empty-state">Your nearest pharmacy results will appear here.</p>}
        </aside>
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <strong>Pharmacy Finder</strong>
          <span>Built by Juho Hiltunen · © {new Date().getFullYear()}</span>
          <span>Your location is used for this search and is not saved by this app.</span>
        </div>
        <nav className="footer-links" aria-label="Juho Hiltunen links">
          <a href="https://hiltunenjuho.github.io/" target="_blank" rel="noopener noreferrer">Portfolio</a>
          <a href="https://github.com/hiltunenjuho" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/hiltunenjuho/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://github.com/hiltunenjuho/nearest-pharmacy-web" target="_blank" rel="noopener noreferrer">Web repository</a>
          <a href="https://github.com/hiltunenjuho/nearest-pharmacy-ios" target="_blank" rel="noopener noreferrer">iOS repository</a>
          <a href="https://github.com/hiltunenjuho/nearest-pharmacy-web/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>
        </nav>
      </footer>
    </div>
  );
}

export default App;
