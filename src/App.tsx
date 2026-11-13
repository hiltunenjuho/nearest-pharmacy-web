import { useEffect, useState } from 'react';
import { searchNearbyPharmacies } from './lib/pharmacySearch';
import { formatDistance, getDistanceKm, type Coordinates } from './lib/location';
import { getDirectionsUrl } from './lib/mapsUrls';
import { getPhoneUrl } from './lib/phoneUrl';
import type { Pharmacy } from './types/pharmacy';

type Theme = 'light' | 'dark';
type Language = 'en' | 'fi';
type InfoPage = 'about' | 'nerds';

const messages = {
  en: {
    languageControl: 'Language',
    themeControl: 'Toggle light or dark theme',
    switchLanguage: 'Switch language to Finnish',
    openInfo: 'About this app',
    close: 'Close',
    findNearby: 'Find nearby pharmacies',
    searching: 'Finding nearby pharmacies...',
    subtitle: 'Find up to 10 of the closest pharmacies within 50 km of your location.',
    nearest: 'Nearest pharmacies',
    resultCount: (count: number) => `${count} of up to 10`,
    findLocation: 'Use your location to search Google Maps for nearby pharmacies.',
    noResults: 'No pharmacies were found within 50 km.',
    noSelection: 'Your nearest pharmacy results will appear here.',
    addressMissing: 'Address not provided',
    unnamedPharmacy: 'Pharmacy',
    hoursUnavailable: 'Hours unavailable',
    openToday: 'OPEN TODAY',
    phone: 'Phone',
    notProvided: 'Not provided',
    fullSchedule: 'Full opening-hours schedule',
    dataNote: 'Google Maps details may be incomplete or out of date. Confirm opening hours before travelling.',
    directions: 'Get directions',
    viewOnGoogle: 'View on Google Maps',
    callPharmacy: 'Call pharmacy',
    dataAttribution: 'Pharmacy information provided by',
    footerBuilt: (year: number) => `Built by Juho Hiltunen · © ${year}`,
    footerPrivacy: 'Your coordinates are sent through Cloudflare to Google Maps for the search. The app does not save them.',
    linksLabel: 'Juho Hiltunen links',
    infoTitle: 'About Pharmacy Finder',
    infoIntro: 'Pharmacy Finder helps you find nearby pharmacies wherever you are.',
    infoPortfolio: 'This is an independent software developer portfolio project and is not affiliated with any organization.',
    infoSearchTitle: 'How it works',
    infoSearch: 'With your permission, the app sends your current location through a Cloudflare Worker to Google Places Nearby Search. It searches within 50 km and shows up to the 10 closest pharmacies.',
    infoDataTitle: 'About the information',
    infoData: 'Pharmacy names, addresses, phone numbers, and current opening hours come from Google Maps. Details may be missing or out of date, so confirm directly before travelling.',
    infoPrivacyTitle: 'Your location and availability',
    infoPrivacy: 'The app does not save your location or search results. Cloudflare relays the coordinates to Google Maps to perform the search. The free Maps Demo Key has daily limits, so the search may pause temporarily when its limit is reached.',
    infoSource: 'Pharmacy information provided by',
    infoForNerds: 'Info for nerds',
    infoBack: 'Back to overview',
    infoTechnicalTitle: 'How it is built',
    infoTechnical: 'This project has two apps. The web app uses React, TypeScript, Vite, and CSS. The iOS app uses SwiftUI, Core Location, and URLSession. Both call Google Places API (New) through a Cloudflare Worker. The Google Maps Demo Key stays in a Cloudflare Secret; the Worker validates requests and rate-limits searches.',
    demoDailyLimit: 'The Google Maps Demo Key daily limit has been reached. Please try again tomorrow.',
    rateLimited: 'Too many searches in a short time. Please wait a moment and try again.',
    open24Hours: 'Open 24 hours',
    closedToday: 'Closed today',
    serviceUnavailable: 'The pharmacy search service is temporarily unavailable. Please try again later.',
    httpError: (status: string) => `The pharmacy search service returned an error (HTTP ${status}). Please try again later.`,
    locationUnsupported: 'Location is not supported in this browser.',
    locationDenied: 'Location permission was denied. Allow location access to find nearby pharmacies.',
    locationUnavailable: 'Your location could not be determined. Check your device location settings and try again.',
    locationTimeout: 'Finding your location timed out. Please try again.',
    searchFailed: 'Could not load nearby pharmacies. Check your connection and try again.',
    errorUnknown: 'An unexpected error occurred. Please try again.',
  },
  fi: {
    languageControl: 'Kieli',
    themeControl: 'Vaihda vaalean ja tumman teeman välillä',
    switchLanguage: 'Vaihda kieleksi englanti',
    openInfo: 'Tietoa sovelluksesta',
    close: 'Sulje',
    findNearby: 'Etsi lähellä olevat apteekit',
    searching: 'Etsitään lähellä olevia apteekkeja...',
    subtitle: 'Löydä enintään 10 lähintä apteekkia 50 km säteellä sijainnistasi.',
    nearest: 'Lähimmät apteekit',
    resultCount: (count: number) => `${count} / enintään 10`,
    findLocation: 'Paikanna itsesi hakeaksesi lähellä olevat apteekit Google Mapsista.',
    noResults: '50 km säteeltä ei löytynyt apteekkeja.',
    noSelection: 'Lähimmät apteekit näkyvät tässä haun jälkeen.',
    addressMissing: 'Osoitetta ei ole saatavilla',
    unnamedPharmacy: 'Apteekki',
    hoursUnavailable: 'Aukioloaikoja ei ole saatavilla',
    openToday: 'AVOINNA TÄNÄÄN',
    phone: 'Puhelin',
    notProvided: 'Ei ilmoitettu',
    fullSchedule: 'Koko aukioloaikataulu',
    dataNote: 'Google Mapsin tiedot voivat olla puutteellisia tai vanhentuneita. Varmista aukioloajat ennen matkaa.',
    directions: 'Reittiohjeet',
    viewOnGoogle: 'Näytä Google Mapsissa',
    callPharmacy: 'Soita apteekkiin',
    dataAttribution: 'Apteekkitiedot tarjoaa',
    footerBuilt: (year: number) => `Tekijä Juho Hiltunen · © ${year}`,
    footerPrivacy: 'Koordinaatit välitetään Cloudflaren kautta Google Mapsiin hakua varten. Sovellus ei tallenna niitä.',
    linksLabel: 'Juho Hiltusen linkit',
    infoTitle: 'Tietoa Pharmacy Finderistä',
    infoIntro: 'Pharmacy Finder auttaa löytämään lähellä olevia apteekkeja missä päin maailmaa tahansa.',
    infoPortfolio: 'Tämä on itsenäinen ohjelmistokehittäjän portfolio-projekti, eikä se ole sidoksissa mihinkään organisaatioon.',
    infoSearchTitle: 'Näin se toimii',
    infoSearch: 'Luvallasi sovellus lähettää nykyisen sijaintisi Cloudflare Worker -palvelun kautta Google Places Nearby Searchiin. Haku kattaa enintään 50 km säteen ja näyttää enintään 10 lähintä apteekkia.',
    infoDataTitle: 'Tietojen luotettavuus',
    infoData: 'Apteekkien nimet, osoitteet, puhelinnumerot ja ajantasaiset aukioloajat tulevat Google Mapsista. Tiedot voivat puuttua tai olla vanhentuneita, joten varmista ne apteekista ennen matkaa.',
    infoPrivacyTitle: 'Sijainti ja palvelun saatavuus',
    infoPrivacy: 'Sovellus ei tallenna sijaintiasi tai hakutuloksia. Cloudflare välittää koordinaatit Google Mapsiin hakua varten. Maksuttomalla Google Maps Demo Keyllä on päiväkiintiö, joten haku voi keskeytyä tilapäisesti kiintiön täyttyessä.',
    infoSource: 'Apteekkitiedot tarjoaa',
    infoForNerds: 'Nörttitietoa',
    infoBack: 'Takaisin yleiskatsaukseen',
    infoTechnicalTitle: 'Tekninen toteutus',
    infoTechnical: 'Projektissa on kaksi sovellusta. Web-sovellus käyttää Reactia, TypeScriptiä, Viteä ja CSS:ää. iOS-sovellus käyttää SwiftUI:ta, Core Locationia ja URLSessionia. Molemmat kutsuvat Google Places API (New) -rajapintaa Cloudflare Worker -palvelun kautta. Google Maps Demo Key on Cloudflare Secretissä; Worker validoi pyynnöt ja rajoittaa hakunopeutta.',
    demoDailyLimit: 'Google Maps Demo Keyn päiväkohtainen kiintiö on täynnä. Yritä uudelleen huomenna.',
    rateLimited: 'Hakuja on tehty liian nopeasti. Odota hetki ja yritä uudelleen.',
    meters: 'm päässä',
    kilometers: 'km päässä',
    open24Hours: 'Avoinna ympäri vuorokauden',
    closedToday: 'Suljettu tänään',
    serviceUnavailable: 'Apteekkihakupalvelu ei ole juuri nyt käytettävissä. Yritä myöhemmin uudelleen.',
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
  // Finnish is the only supported locale besides English, so other system languages use English.
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
    if (error.message === 'GOOGLE_DEMO_DAILY_LIMIT') return copy.demoDailyLimit;
    if (error.message === 'PHARMACY_SEARCH_RATE_LIMITED') return copy.rateLimited;
    if (error.message.includes('Pharmacy search service is not configured')) return copy.serviceUnavailable;
    const httpStatus = error.message.match(/HTTP (\d+)/)?.[1];
    if (httpStatus) return copy.httpError(httpStatus);
    return copy.searchFailed;
  }

  return copy.errorUnknown;
}

function App() {
  const [themeOverride, setThemeOverride] = useState<Theme | null>(() => {
    const savedTheme = window.localStorage.getItem('pharmacyFinder.appearance');
    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem('pharmacyFinder.language');
    return savedLanguage === 'fi' || savedLanguage === 'en' ? savedLanguage : getSystemLanguage();
  });
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoPage, setInfoPage] = useState<InfoPage>('about');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = pharmacies.find((item) => item.id === selectedId) ?? pharmacies[0];
  const copy = messages[language];
  const effectiveTheme = themeOverride ?? (systemPrefersDark ? 'dark' : 'light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (themeOverride === null) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.dataset.theme = themeOverride;
    }
  }, [themeOverride]);

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

      const results = await searchNearbyPharmacies(location, language);
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

  const formatTodayHours = (hours?: string | null) => {
    return hours?.trim() || copy.hoursUnavailable;
  };

  const handleThemeToggle = () => {
    const nextTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    // Apply the fade only for this change; the stored preference still overrides system appearance.
    document.documentElement.classList.add('theme-transition');
    window.setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
    window.localStorage.setItem('pharmacyFinder.appearance', nextTheme);
    setThemeOverride(nextTheme);
  };

  const heroDistance =
    userLocation && selected ? getDistanceKm(userLocation, { lat: selected.lat, lng: selected.lng }) : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-heading">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}pharmacy-logo.svg`} alt="" />
          <div>
            <div className="eyebrow">Juho Hiltunen</div>
            <h1>Pharmacy Finder</h1>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleLocate}
            disabled={isSearching}
          >
            {isSearching ? copy.searching : copy.findNearby}
          </button>
          <div className="header-controls">
            <button
              className={`language-toggle ${language === 'fi' ? 'is-finnish' : ''}`}
              type="button"
              role="switch"
              aria-checked={language === 'fi'}
              aria-label={copy.languageControl}
              onClick={() => setLanguage(language === 'en' ? 'fi' : 'en')}
            >
              <span>EN</span>
              <span>FI</span>
              <span className="toggle-thumb" aria-hidden="true" />
            </button>
            <button
              className="utility-button info-button"
              type="button"
              onClick={() => {
                setInfoPage('about');
                setIsInfoOpen(true);
              }}
              aria-label={copy.openInfo}
            >
              <span aria-hidden="true">i</span>
            </button>
            <button
              className={`theme-toggle ${effectiveTheme === 'dark' ? 'is-dark' : ''}`}
              type="button"
              role="switch"
              aria-checked={effectiveTheme === 'dark'}
              aria-label={copy.themeControl}
              onClick={handleThemeToggle}
            >
              <svg className="theme-icon sun-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
              </svg>
              <svg className="theme-icon moon-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
              </svg>
              <span className="toggle-thumb" aria-hidden="true" />
            </button>
          </div>
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
                  <small>{formatTodayHours(pharmacy.todayHours)}</small>
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
                  <strong>{formatTodayHours(selected.todayHours)}</strong>
                </div>
                <div>
                  <label>{copy.phone}</label>
                  {selected.phoneNumber && getPhoneUrl(selected.phoneNumber)
                    ? <a href={getPhoneUrl(selected.phoneNumber)}>{selected.phoneNumber}</a>
                    : <strong>{copy.notProvided}</strong>}
                </div>
              </div>

              {selected.openingHours.length > 0 ? (
                <details className="hours-details">
                  <summary>{copy.fullSchedule}</summary>
                  <ul>
                    {selected.openingHours.map((day) => <li key={day}>{day}</li>)}
                  </ul>
                </details>
              ) : null}
              <p className="data-note">{copy.dataNote}</p>

              <div className="attribution" translate="no">
                {copy.dataAttribution}{' '}
                <a href="https://maps.google.com/" target="_blank" rel="noreferrer">Google Maps</a>
              </div>

              <div className="cta-row">
                <a href={getDirectionsUrl(selected)} target="_blank" rel="noreferrer">{copy.directions}</a>
                <a href={selected.mapsUrl} target="_blank" rel="noreferrer">{copy.viewOnGoogle}</a>
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
            {infoPage === 'about' ? (
              <>
                <h2 id="info-title">{copy.infoTitle}</h2>
                <p>{copy.infoIntro}</p>
                <p className="portfolio-note">{copy.infoPortfolio}</p>
                <h3>{copy.infoSearchTitle}</h3>
                <p>{copy.infoSearch}</p>
                <h3>{copy.infoDataTitle}</h3>
                <p>{copy.infoData}</p>
                <h3>{copy.infoPrivacyTitle}</h3>
                <p>{copy.infoPrivacy}</p>
                <p className="info-attribution" translate="no">
                  {copy.infoSource}{' '}
                  <a href="https://maps.google.com/" target="_blank" rel="noreferrer">Google Maps</a>
                </p>
                <button className="info-next-button" type="button" onClick={() => setInfoPage('nerds')}>
                  {copy.infoForNerds}
                </button>
              </>
            ) : (
              <>
                <button className="info-back-button" type="button" onClick={() => setInfoPage('about')}>
                  ← {copy.infoBack}
                </button>
                <h2 id="info-title">{copy.infoTechnicalTitle}</h2>
                <p>{copy.infoTechnical}</p>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
