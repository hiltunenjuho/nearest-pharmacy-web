import { useEffect, useState } from 'react';
import { searchNearbyPharmacies } from './lib/openStreetMap';
import { formatDistance, getDistanceKm, type Coordinates } from './lib/location';
import { getDirectionsUrl } from './lib/mapsUrls';
import { getOpeningHoursForToday } from './lib/openingHours';
import { getPhoneUrl } from './lib/phoneUrl';
import type { Pharmacy } from './types/pharmacy';

type AppearanceMode = 'system' | 'light' | 'dark';
type Language = 'en' | 'fi';

const messages = {
  en: {
    theme: 'Theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    switchLanguage: 'Switch language to Finnish',
    openInfo: 'About this app',
    close: 'Close',
    findNearby: 'Find nearby pharmacies',
    searching: 'Finding nearby pharmacies...',
    subtitle: 'Find up to 10 of the closest pharmacies within 50 km of your location.',
    nearest: 'Nearest pharmacies',
    resultCount: (count: number) => `${count} of up to 10`,
    findLocation: 'Find your location to load nearby pharmacies from OpenStreetMap.',
    noResults: 'No pharmacies were found within 50 km. Coverage depends on OpenStreetMap data in your area.',
    noSelection: 'Your nearest pharmacy results will appear here.',
    addressMissing: 'Address not provided',
    unnamedPharmacy: 'Pharmacy',
    hoursUnavailable: 'Hours unavailable',
    openToday: 'OPEN TODAY',
    phone: 'Phone',
    notProvided: 'Not provided',
    fullSchedule: 'Full opening-hours schedule',
    dataNote: 'Community-maintained data may be incomplete or omit local holiday exceptions. Confirm before travelling.',
    directions: 'Get directions',
    viewOnOSM: 'View on OpenStreetMap',
    callPharmacy: 'Call pharmacy',
    dataAttribution: 'Pharmacy data ©',
    footerBuilt: (year: number) => `Built by Juho Hiltunen · © ${year}`,
    footerPrivacy: 'Your location is sent to OpenStreetMap to find nearby results; the app does not save it.',
    linksLabel: 'Juho Hiltunen links',
    infoTitle: 'About Pharmacy Finder',
    infoIntro: 'Pharmacy Finder helps you find nearby pharmacies wherever you are.',
    infoSearchTitle: 'How it works',
    infoSearch: 'With your permission, the app uses your current location to search OpenStreetMap for pharmacies within 50 km. It shows up to the 10 closest mapped results, sorted by straight-line distance.',
    infoDataTitle: 'About the information',
    infoData: 'Pharmacy details come from community-maintained OpenStreetMap data. Addresses, phone numbers, and opening hours may be missing or out of date. Opening hours may not include local holiday exceptions, so please confirm directly before travelling.',
    infoPrivacyTitle: 'Your location and availability',
    infoPrivacy: 'Your coordinates are sent to a public Overpass service to perform the search. This app does not save your location or results. Public services and map coverage can vary, so fewer than 10 results may be found.',
    infoSource: 'Pharmacy data © OpenStreetMap contributors.',
    open24Hours: 'Open 24 hours',
    closedToday: 'Closed today',
    serviceUnavailable: 'The free pharmacy search service is temporarily unavailable. Please try again later.',
    httpError: (status: string) => `The pharmacy search service returned an error (HTTP ${status}). Please try again later.`,
    locationUnsupported: 'Location is not supported in this browser.',
    locationDenied: 'Location permission was denied. Allow location access to find nearby pharmacies.',
    locationUnavailable: 'Your location could not be determined. Check your device location settings and try again.',
    locationTimeout: 'Finding your location timed out. Please try again.',
    searchFailed: 'Could not load nearby pharmacies. Check your connection and try again.',
    errorUnknown: 'An unexpected error occurred. Please try again.',
  },
  fi: {
    theme: 'Teema',
    system: 'Järjestelmä',
    light: 'Vaalea',
    dark: 'Tumma',
    switchLanguage: 'Vaihda kieleksi englanti',
    openInfo: 'Tietoa sovelluksesta',
    close: 'Sulje',
    findNearby: 'Etsi lähellä olevat apteekit',
    searching: 'Etsitään lähellä olevia apteekkeja...',
    subtitle: 'Löydä enintään 10 lähintä apteekkia 50 km säteellä sijainnistasi.',
    nearest: 'Lähimmät apteekit',
    resultCount: (count: number) => `${count} / enintään 10`,
    findLocation: 'Hae lähellä olevat apteekit OpenStreetMapista paikantamalla ensin.',
    noResults: '50 km säteeltä ei löytynyt apteekkeja. Tulosten määrä riippuu alueen OpenStreetMap-karttatiedoista.',
    noSelection: 'Lähimmät apteekit näkyvät tässä haun jälkeen.',
    addressMissing: 'Osoitetta ei ole saatavilla',
    unnamedPharmacy: 'Apteekki',
    hoursUnavailable: 'Aukioloaikoja ei ole saatavilla',
    openToday: 'AVOINNA TÄNÄÄN',
    phone: 'Puhelin',
    notProvided: 'Ei ilmoitettu',
    fullSchedule: 'Koko aukioloaikataulu',
    dataNote: 'Yhteisön ylläpitämät tiedot voivat olla puutteellisia tai poiketa paikallisista pyhäpäivistä. Varmista tiedot ennen matkaa.',
    directions: 'Reittiohjeet',
    viewOnOSM: 'Näytä OpenStreetMapissa',
    callPharmacy: 'Soita apteekkiin',
    dataAttribution: 'Apteekkitiedot ©',
    footerBuilt: (year: number) => `Tekijä Juho Hiltunen · © ${year}`,
    footerPrivacy: 'Sijainti lähetetään OpenStreetMapiin lähitulosten hakua varten. Sovellus ei tallenna sitä.',
    linksLabel: 'Juho Hiltusen linkit',
    infoTitle: 'Tietoa Pharmacy Finderistä',
    infoIntro: 'Pharmacy Finder auttaa löytämään lähellä olevia apteekkeja missä päin maailmaa tahansa.',
    infoSearchTitle: 'Näin se toimii',
    infoSearch: 'Luvallasi sovellus käyttää nykyistä sijaintiasi ja hakee OpenStreetMapista apteekkeja enintään 50 km säteeltä. Näet enintään 10 lähintä kartalle merkittyä apteekkia linnuntie-etäisyyden mukaan järjestettynä.',
    infoDataTitle: 'Tietojen luotettavuus',
    infoData: 'Apteekkitiedot ovat OpenStreetMap-yhteisön ylläpitämiä. Osoitteita, puhelinnumeroita tai aukioloaikoja voi puuttua tai ne voivat olla vanhentuneita. Aukioloajoissa ei välttämättä näy paikallisia pyhäpäiväpoikkeuksia, joten varmista tiedot apteekista ennen matkaa.',
    infoPrivacyTitle: 'Sijainti ja palvelun saatavuus',
    infoPrivacy: 'Koordinaatit lähetetään julkiseen Overpass-palveluun haun tekemiseksi. Sovellus ei tallenna sijaintiasi tai hakutuloksia. Julkisten palvelujen saatavuus ja karttatietojen kattavuus vaihtelevat, joten tuloksia voi löytyä alle 10.',
    infoSource: 'Apteekkitiedot © OpenStreetMapin avustajat.',
    meters: 'm päässä',
    kilometers: 'km päässä',
    open24Hours: 'Avoinna ympäri vuorokauden',
    closedToday: 'Suljettu tänään',
    serviceUnavailable: 'Maksuton apteekkihakupalvelu ei ole juuri nyt käytettävissä. Yritä myöhemmin uudelleen.',
    httpError: (status: string) => `Apteekkihakupalvelu palautti virheen (HTTP ${status}). Yritä myöhemmin uudelleen.`,
    locationUnsupported: 'Sijainnin määritys ei ole tuettu tässä selaimessa.',
    locationDenied: 'Sijainnin käyttö estettiin. Salli sijainnin käyttö lähellä olevien apteekkien hakemiseksi.',
    locationUnavailable: 'Sijaintia ei voitu määrittää. Tarkista laitteen sijaintiasetukset ja yritä uudelleen.',
    locationTimeout: 'Sijainnin määritys aikakatkaistiin. Yritä uudelleen.',
    searchFailed: 'Lähellä olevien apteekkien haku epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.',
    errorUnknown: 'Tapahtui odottamaton virhe. Yritä uudelleen.',
  },
} as const;

function getSystemLanguage(): Language {
  return navigator.language.toLowerCase().startsWith('fi') ? 'fi' : 'en';
}

function getErrorMessage(error: unknown, copy: (typeof messages)[Language]): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (code === 1) return copy.locationDenied;
    if (code === 2) return copy.locationUnavailable;
    if (code === 3) return copy.locationTimeout;
  }

  if (error instanceof Error) {
    const httpStatus = error.message.match(/HTTP (\d+)/)?.[1];
    if (httpStatus) return copy.httpError(httpStatus);
    if (error.message.includes('OpenStreetMap search is temporarily unavailable')) {
      return copy.serviceUnavailable;
    }
    if (error.message.includes('OpenStreetMap')) return copy.searchFailed;
  }

  return copy.errorUnknown;
}

function App() {
  const [appearance, setAppearance] = useState<AppearanceMode>('system');
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem('pharmacyFinder.language');
    return savedLanguage === 'fi' || savedLanguage === 'en' ? savedLanguage : getSystemLanguage();
  });
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = pharmacies.find((item) => item.id === selectedId) ?? pharmacies[0];
  const copy = messages[language];

  useEffect(() => {
    if (appearance === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = appearance;
    }
  }, [appearance]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('pharmacyFinder.language', language);
  }, [language]);

  useEffect(() => {
    if (!isInfoOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsInfoOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInfoOpen]);

  const handleLocate = async () => {
    if (!navigator.geolocation) {
      setErrorMessage(copy.locationUnsupported);
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
      if (results.length === 0) setErrorMessage(copy.noResults);
    } catch (error) {
      setPharmacies([]);
      setSelectedId(null);
      setErrorMessage(getErrorMessage(error, copy));
    } finally {
      setIsSearching(false);
    }
  };

  const formatTodayHours = (hours?: string) => {
    const todayHours = getOpeningHoursForToday(hours);
    if (todayHours === 'Open 24 hours') return copy.open24Hours;
    if (todayHours === 'Closed today') return copy.closedToday;
    return todayHours ?? copy.hoursUnavailable;
  };

  const heroDistance =
    userLocation && selected ? getDistanceKm(userLocation, { lat: selected.lat, lng: selected.lng }) : null;

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
        <div className="header-actions">
          <button
            className="utility-button"
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'fi' : 'en')}
            aria-label={copy.switchLanguage}
          >
            {language === 'en' ? 'FI' : 'EN'}
          </button>
          <button
            className="utility-button info-button"
            type="button"
            onClick={() => setIsInfoOpen(true)}
            aria-label={copy.openInfo}
          >
            <span aria-hidden="true">i</span>
          </button>
          <label className="theme-control">
            <span>{copy.theme}</span>
            <select value={appearance} onChange={(event) => setAppearance(event.target.value as AppearanceMode)}>
              <option value="system">{copy.system}</option>
              <option value="light">{copy.light}</option>
              <option value="dark">{copy.dark}</option>
            </select>
          </label>
          <button className="primary-button" onClick={handleLocate} disabled={isSearching}>
            {isSearching ? copy.searching : copy.findNearby}
          </button>
        </div>
      </header>

      <p className="subtitle">{copy.subtitle}</p>

      {errorMessage ? <p className="notice" role="status">{errorMessage}</p> : null}

      <main className="content-grid">
        <section className="panel list-panel">
          <div className="panel-header">
            <h2>{copy.nearest}</h2>
            <span>{copy.resultCount(pharmacies.length)}</span>
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
                      <strong>{pharmacy.name === 'Pharmacy' ? copy.unnamedPharmacy : pharmacy.name}</strong>
                      <p>{pharmacy.address || copy.addressMissing}</p>
                    </div>
                    {distance !== null ? <span>{formatDistance(distance)}</span> : null}
                  </div>
                  <small>{formatTodayHours(pharmacy.openingHours)}</small>
                </button>
              );
            })}
            {!isSearching && pharmacies.length === 0 ? (
              <p className="empty-state">{copy.findLocation}</p>
            ) : null}
          </div>
        </section>

        <aside className="panel detail-panel">
          {selected ? (
            <>
              <div className="badge-row">
                {heroDistance !== null ? <span className="pill muted">{formatDistance(heroDistance)}</span> : null}
              </div>

              <h2>{selected.name === 'Pharmacy' ? copy.unnamedPharmacy : selected.name}</h2>
              <p className="address">{selected.address || copy.addressMissing}</p>

              <div className="meta-grid">
                <div>
                  <label>{copy.openToday}</label>
                  <strong>{formatTodayHours(selected.openingHours)}</strong>
                </div>
                <div>
                  <label>{copy.phone}</label>
                  {selected.phoneNumber && getPhoneUrl(selected.phoneNumber)
                    ? <a href={getPhoneUrl(selected.phoneNumber)}>{selected.phoneNumber}</a>
                    : <strong>{copy.notProvided}</strong>}
                </div>
              </div>

              {selected.openingHours ? (
                <details className="hours-details">
                  <summary>{copy.fullSchedule}</summary>
                  <p>{selected.openingHours}</p>
                </details>
              ) : null}
              <p className="data-note">{copy.dataNote}</p>

              <div className="attribution" translate="no">
                {copy.dataAttribution}{' '}
                <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>
              </div>

              <div className="cta-row">
                <a href={getDirectionsUrl(selected)} target="_blank" rel="noreferrer">{copy.directions}</a>
                <a href={selected.osmUrl} target="_blank" rel="noreferrer">{copy.viewOnOSM}</a>
                {selected.phoneNumber && getPhoneUrl(selected.phoneNumber)
                  ? <a href={getPhoneUrl(selected.phoneNumber)} title={selected.phoneNumber}>{copy.callPharmacy}</a>
                  : null}
              </div>
            </>
          ) : <p className="empty-state">{copy.noSelection}</p>}
        </aside>
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <strong>Pharmacy Finder</strong>
          <span>{copy.footerBuilt(new Date().getFullYear())}</span>
          <span>{copy.footerPrivacy}</span>
        </div>
        <nav className="footer-links" aria-label={copy.linksLabel}>
          <a href="https://hiltunenjuho.github.io/" target="_blank" rel="noopener noreferrer">Portfolio</a>
          <a href="https://github.com/hiltunenjuho" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/hiltunenjuho/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://github.com/hiltunenjuho/nearest-pharmacy-web" target="_blank" rel="noopener noreferrer">{language === 'fi' ? 'Web-projekti' : 'Web repository'}</a>
          <a href="https://github.com/hiltunenjuho/nearest-pharmacy-ios" target="_blank" rel="noopener noreferrer">{language === 'fi' ? 'iOS-projekti' : 'iOS repository'}</a>
          <a href="https://github.com/hiltunenjuho/nearest-pharmacy-web/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">{language === 'fi' ? 'MIT-lisenssi' : 'MIT License'}</a>
        </nav>
      </footer>

      {isInfoOpen ? (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsInfoOpen(false);
        }}>
          <section className="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title" onKeyDown={(event) => {
            if (event.key === 'Escape') setIsInfoOpen(false);
          }}>
            <button className="dialog-close" type="button" autoFocus onClick={() => setIsInfoOpen(false)} aria-label={copy.close}>
              ×
            </button>
            <h2 id="info-title">{copy.infoTitle}</h2>
            <p>{copy.infoIntro}</p>
            <h3>{copy.infoSearchTitle}</h3>
            <p>{copy.infoSearch}</p>
            <h3>{copy.infoDataTitle}</h3>
            <p>{copy.infoData}</p>
            <h3>{copy.infoPrivacyTitle}</h3>
            <p>{copy.infoPrivacy}</p>
            <p className="info-attribution">
              {copy.infoSource}{' '}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
