import { useEffect, useMemo, useState } from 'react';
import { PHARMACIES } from './data/pharmacies';

type Coordinates = {
  lat: number;
  lng: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(from: Coordinates, to: Coordinates) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

function App() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(PHARMACIES[0].id);

  const pharmacies = useMemo(() => {
    if (!userLocation) {
      return PHARMACIES;
    }

    return [...PHARMACIES].sort(
      (a, b) =>
        getDistanceKm(userLocation, { lat: a.lat, lng: a.lng }) -
        getDistanceKm(userLocation, { lat: b.lat, lng: b.lng }),
    );
  }, [userLocation]);

  const selected = pharmacies.find((item) => item.id === selectedId) ?? pharmacies[0];

  useEffect(() => {
    if (!selected && pharmacies.length > 0) {
      setSelectedId(pharmacies[0].id);
    }
  }, [pharmacies, selected]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setLocationError('Location access was denied. Showing the best available matches in Helsinki.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const heroDistance =
    userLocation && selected ? getDistanceKm(userLocation, { lat: selected.lat, lng: selected.lng }) : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">Treat Health</div>
          <h1>Closest pharmacy</h1>
        </div>
        <button className="primary-button" onClick={handleLocate} disabled={isLocating}>
          {isLocating ? 'Finding your location...' : 'Use my location'}
        </button>
      </header>

      {locationError ? <p className="notice">{locationError}</p> : null}

      <main className="content-grid">
        <section className="panel list-panel">
          <div className="panel-header">
            <h2>Recommended options</h2>
            <span>{pharmacies.length} nearby</span>
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
                      <p>{pharmacy.address}</p>
                    </div>
                    {distance !== null ? <span>{formatDistance(distance)}</span> : null}
                  </div>
                  <small>{pharmacy.hours}</small>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="panel detail-panel">
          {selected ? (
            <>
              <div className="badge-row">
                <span className="pill">Open now</span>
                {heroDistance !== null ? <span className="pill muted">{formatDistance(heroDistance)}</span> : null}
              </div>

              <h2>{selected.name}</h2>
              <p className="address">{selected.address}</p>

              <div className="meta-grid">
                <div>
                  <label>Opening hours</label>
                  <strong>{selected.hours}</strong>
                </div>
                <div>
                  <label>Travel time</label>
                  <strong>{heroDistance !== null ? `${Math.max(3, Math.round(heroDistance * 6))} min` : 'Use location'}</strong>
                </div>
              </div>

              <div className="services-wrap">
                {selected.services.map((service) => (
                  <span key={service} className="service-tag">
                    {service}
                  </span>
                ))}
              </div>

              <div className="cta-row">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.address)}`} target="_blank" rel="noreferrer">
                  Get directions
                </a>
                <button type="button">Call pharmacy</button>
              </div>
            </>
          ) : null}
        </aside>
      </main>
    </div>
  );
}

export default App;
