import { useEffect, useRef, useState } from 'react';
import { searchNearbyPharmacies } from './lib/pharmacySearch';
import {
  clearSessionPharmacySearch,
  isSameSearchArea,
  loadSessionPharmacySearch,
  saveSessionPharmacySearch,
} from './lib/pharmacySession';
import { formatDistance, getDistanceKm, type Coordinates } from './lib/location';
import { getDirectionsUrl } from './lib/mapsUrls';
import { getPhoneUrl } from './lib/phoneUrl';
import { filterPharmacies, type PharmacyFilter } from './lib/pharmacyFilters';
import { getCurrentOpenStatus, getOpeningCountdown } from './lib/openingCountdown';
import type { SessionPharmacySearch } from './lib/pharmacySession';
import type { Pharmacy } from './types/pharmacy';

type Theme = 'light' | 'dark';
type Language = 'en' | 'fi';
type InfoPage = 'about' | 'nerds';

const messages = {
  en: {
    languageControl: 'Language',
    themeControl: 'Toggle light or dark theme',
    switchLanguage: 'Switch language to Finnish',
    openAppSwitcher: 'Open applications menu',
    closeAppSwitcher: 'Close applications menu',
    appSwitcherHint: 'Try my other apps!',
    applications: 'Applications',
    menuControl: 'Open quick links',
    closeMenu: 'Close quick links',
    menuLabel: 'Quick links',
    openInfo: 'About this app',
    infoMenuItem: 'Info about the app',
    close: 'Close',
    findNearby: 'Find nearby pharmacies',
    searching: 'Finding nearby pharmacies...',
    subtitle: 'Find up to 10 of the closest pharmacies within 50 km of your location.',
    nearest: 'Nearest pharmacies',
    resultCount: (count: number) => `${count} of up to 10`,
    filterPharmacies: 'Filter pharmacies',
    filterAll: 'All',
    filterOpenNow: 'Open now',
    filterOpensEarliest: 'Opens earliest',
    noneOpen: 'No pharmacies are open right now.',
    noneClosed: 'No closed pharmacies were found.',
    openingStatusUnavailable: 'Current opening status is unavailable for these results.',
    findLocation: 'Use your location to search Google Maps for nearby pharmacies.',
    noResults: 'No pharmacies were found within 50 km.',
    addressMissing: 'Address not provided',
    unnamedPharmacy: 'Pharmacy',
    hoursUnavailable: 'Hours unavailable',
    openFor: (duration: string) => `Open for ${duration}`,
    opensIn: (duration: string) => `Opens in ${duration}`,
    openToday: 'OPEN TODAY',
    phone: 'Phone',
    notProvided: 'Not provided',
    fullSchedule: 'Full opening-hours schedule',
    dataNote: 'Google Maps details may be incomplete or out of date. Confirm opening hours before travelling.',
    directions: 'Get directions',
    callPharmacy: 'Call pharmacy',
    dataAttribution: 'Pharmacy information provided by',
    footerBuilt: (year: number) => `Juho Hiltunen · © ${year}`,
    footerPrivacy: 'Your coordinates are sent through Cloudflare to Google Maps for the search. The last successful search location is kept in this tab\'s session storage to reuse searches within 1 km; it is cleared when the tab is closed.',
    linksLabel: 'Juho Hiltunen links',
    webRepository: 'Web app source',
    iosRepository: 'iOS app source',
    infoTitle: 'About Pharmacy Finder',
    infoIntro: 'Pharmacy Finder helps you find nearby pharmacies wherever you are.',
    infoPortfolio: 'This is an independent software developer portfolio project and is not affiliated with any organization.',
    infoSearchTitle: 'How it works',
    infoSearch: 'With your permission, the app sends your current location through a Cloudflare Worker to Google Places Nearby Search. It searches within 50 km and shows up to the 10 closest pharmacies.',
    infoDataTitle: 'About the information',
    infoData: 'Pharmacy names, addresses, phone numbers, and current opening hours come from Google Maps. Details may be missing or out of date, so confirm directly before travelling.',
    infoPrivacyTitle: 'Your location and availability',
    infoPrivacy: 'Search results and the last successful search location are kept in this browser tab\'s session storage so they survive a refresh. Searches within 1 km reuse saved results, and the data is cleared when the tab is closed. Cloudflare relays your coordinates to Google Maps to perform a search. The free Maps Demo Key has daily limits, so the search may pause temporarily when its limit is reached.',
    infoSource: 'Pharmacy information provided by',
    infoForNerds: 'Info for nerds',
    infoBack: 'Back to overview',
    infoTechnicalTitle: 'How it is built',
    infoTechClientsTitle: 'Web and iOS',
    infoTechClients: 'The web app uses React, TypeScript, Vite and CSS, with browser geolocation for the search position. Its iOS companion uses SwiftUI for the interface, Core Location for positioning and URLSession for network requests.',
    infoTechSearchTitle: 'Search and results',
    infoTechSearch: 'Both clients send coordinates and language to a Cloudflare Worker, which queries Google Places API (New) for up to 10 pharmacies within 50 km, ranked by distance. The clients display available details, calculate distances and opening countdowns, and provide filtering, directions and phone links.',
    infoTechPrivacyTitle: 'Privacy and limits',
    infoTechPrivacy: 'The Google Maps Demo Key stays in a Cloudflare Worker secret, not in the clients. The Worker validates requests, applies rate limits and does not persist coordinates or results. Its endpoint is public; CORS and rate limiting are not authentication. The web app keeps the last successful search in tab session storage and reuses it within 1 km; iOS keeps results in memory only. Google’s demo key has a daily quota.',
    infoTechDeployTitle: 'Deployment',
    infoTechDeploy: 'GitHub Actions builds and publishes the web app to GitHub Pages. The API proxy runs on Cloudflare Workers; the iOS app is a separate SwiftUI project.',
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
    sessionResultsNotSaved: 'The latest search could not be cached for this tab, so repeating it may use the API again.',
    errorUnknown: 'An unexpected error occurred. Please try again.',
  },
  fi: {
    languageControl: 'Kieli',
    themeControl: 'Vaihda vaalean ja tumman teeman välillä',
    switchLanguage: 'Vaihda kieleksi englanti',
    openAppSwitcher: 'Avaa sovellusvalikko',
    closeAppSwitcher: 'Sulje sovellusvalikko',
    appSwitcherHint: 'Kokeile muita sovelluksiani!',
    applications: 'Sovellukset',
    menuControl: 'Avaa pikalinkit',
    closeMenu: 'Sulje pikalinkit',
    menuLabel: 'Pikalinkit',
    openInfo: 'Tietoa sovelluksesta',
    infoMenuItem: 'Tietoa sovelluksesta',
    close: 'Sulje',
    findNearby: 'Etsi lähellä olevat apteekit',
    searching: 'Etsitään lähellä olevia apteekkeja...',
    subtitle: 'Löydä enintään 10 lähintä apteekkia 50 km säteellä sijainnistasi.',
    nearest: 'Lähimmät apteekit',
    resultCount: (count: number) => `${count} / enintään 10`,
    filterPharmacies: 'Suodata apteekkeja',
    filterAll: 'Kaikki',
    filterOpenNow: 'Avoinna nyt',
    filterOpensEarliest: 'Avautuu aikaisimmin',
    noneOpen: 'Yksikään apteekki ei ole nyt avoinna.',
    noneClosed: 'Suljettuja apteekkeja ei löytynyt.',
    openingStatusUnavailable: 'Apteekkien tämänhetkistä aukiolotietoa ei ole saatavilla.',
    findLocation: 'Paikanna itsesi hakeaksesi lähellä olevat apteekit Google Mapsista.',
    noResults: '50 km säteeltä ei löytynyt apteekkeja.',
    addressMissing: 'Osoitetta ei ole saatavilla',
    unnamedPharmacy: 'Apteekki',
    hoursUnavailable: 'Aukioloaikoja ei ole saatavilla',
    openFor: (duration: string) => `Avoinna vielä ${duration}`,
    opensIn: (duration: string) => `Avautuu ${duration} päästä`,
    openToday: 'AVOINNA TÄNÄÄN',
    phone: 'Puhelin',
    notProvided: 'Ei ilmoitettu',
    fullSchedule: 'Koko aukioloaikataulu',
    dataNote: 'Google Mapsin tiedot voivat olla puutteellisia tai vanhentuneita. Varmista aukioloajat ennen matkaa.',
    directions: 'Reittiohjeet',
    callPharmacy: 'Soita apteekkiin',
    dataAttribution: 'Apteekkitiedot tarjoaa',
    footerBuilt: (year: number) => `Juho Hiltunen · © ${year}`,
    footerPrivacy: 'Koordinaatit välitetään Cloudflaren kautta Google Mapsiin hakua varten. Viimeisimmän onnistuneen haun sijainti säilytetään tämän välilehden istuntomuistissa enintään 1 km:n päässä tehtyjen uusintahakujen välttämiseksi, ja se poistetaan välilehden sulkeutuessa.',
    linksLabel: 'Juho Hiltusen linkit',
    webRepository: 'Web-sovelluksen lähdekoodi',
    iosRepository: 'iOS-sovelluksen lähdekoodi',
    infoTitle: 'Tietoa Pharmacy Finderistä',
    infoIntro: 'Pharmacy Finder auttaa löytämään lähellä olevia apteekkeja missä päin maailmaa tahansa.',
    infoPortfolio: 'Tämä on itsenäinen ohjelmistokehittäjän portfolio-projekti, eikä se ole sidoksissa mihinkään organisaatioon.',
    infoSearchTitle: 'Näin se toimii',
    infoSearch: 'Luvallasi sovellus lähettää nykyisen sijaintisi Cloudflare Worker -palvelun kautta Google Places Nearby Searchiin. Haku kattaa enintään 50 km säteen ja näyttää enintään 10 lähintä apteekkia.',
    infoDataTitle: 'Tietojen luotettavuus',
    infoData: 'Apteekkien nimet, osoitteet, puhelinnumerot ja ajantasaiset aukioloajat tulevat Google Mapsista. Tiedot voivat puuttua tai olla vanhentuneita, joten varmista ne apteekista ennen matkaa.',
    infoPrivacyTitle: 'Sijainti ja palvelun saatavuus',
    infoPrivacy: 'Hakutulokset ja viimeisimmän onnistuneen haun sijainti säilytetään tämän selaimen välilehden istuntomuistissa, jotta ne säilyvät sivun päivityksen jälkeen. Enintään 1 km:n päässä tehdyt haut käyttävät tallennettuja tuloksia, ja tiedot poistetaan välilehden sulkeutuessa. Cloudflare välittää koordinaatit Google Mapsiin hakua varten. Maksuttomalla Google Maps Demo Keyllä on päiväkiintiö, joten haku voi keskeytyä tilapäisesti kiintiön täyttyessä.',
    infoSource: 'Apteekkitiedot tarjoaa',
    infoForNerds: 'Tietoa nörteille',
    infoBack: 'Takaisin yleiskatsaukseen',
    infoTechnicalTitle: 'Tekninen toteutus',
    infoTechClientsTitle: 'Web ja iOS',
    infoTechClients: 'Web-sovellus käyttää Reactia, TypeScriptiä, Viteä ja CSS:ää sekä selaimen sijaintipalvelua hakusijainnin määrittämiseen. iOS-versio käyttää käyttöliittymään SwiftUI:ta, paikannukseen Core Locationia ja verkkopyyntöihin URLSessionia.',
    infoTechSearchTitle: 'Haku ja tulokset',
    infoTechSearch: 'Molemmat sovellukset lähettävät koordinaatit ja kielen Cloudflare Workerille, joka hakee Google Places API (New) -rajapinnasta enintään 10 apteekkia 50 km:n säteeltä etäisyyden mukaan järjestettynä. Sovellukset näyttävät saatavilla olevat tiedot, laskevat etäisyydet ja aukioloaikojen laskurit sekä tarjoavat suodatuksen, reittiohjeet ja puhelinlinkit.',
    infoTechPrivacyTitle: 'Tietosuoja ja rajoitukset',
    infoTechPrivacy: 'Google Maps Demo Key säilyy Cloudflare Workerin salaisuutena, ei sovelluksissa. Worker validoi pyynnöt, rajoittaa hakunopeutta eikä tallenna koordinaatteja tai tuloksia. Rajapinta on julkinen; CORS ja nopeusrajoitus eivät ole tunnistautumista. Web-sovellus säilyttää viimeisimmän onnistuneen haun välilehden istuntomuistissa ja käyttää sitä uudelleen 1 km:n säteellä; iOS säilyttää tulokset vain muistissa. Googlen demoavaimella on päiväkiintiö.',
    infoTechDeployTitle: 'Julkaisu',
    infoTechDeploy: 'GitHub Actions rakentaa ja julkaisee web-sovelluksen GitHub Pagesiin. API-välityspalvelu toimii Cloudflare Workersissa; iOS-sovellus on erillinen SwiftUI-projekti.',
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
    sessionResultsNotSaved: 'Viimeisintä hakua ei voitu tallentaa tämän välilehden muistiin, joten sen uusiminen voi käyttää APIa uudelleen.',
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
  const [savedSearch, setSavedSearch] = useState<SessionPharmacySearch | null>(
    () => loadSessionPharmacySearch(),
  );
  const [userLocation, setUserLocation] = useState<Coordinates | null>(() => savedSearch?.origin ?? null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(() => savedSearch?.pharmacies ?? []);
  const [filterMode, setFilterMode] = useState<PharmacyFilter>('all');
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAppSwitcherOpen, setIsAppSwitcherOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoPage, setInfoPage] = useState<InfoPage>('about');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const appSwitcherButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const copy = messages[language];
  const effectiveTheme = themeOverride ?? (systemPrefersDark ? 'dark' : 'light');
  const visiblePharmacies = filterPharmacies(pharmacies, filterMode, userLocation, currentTime);
  const filterEmptyMessage = pharmacies.some((pharmacy) => (
    typeof getCurrentOpenStatus(pharmacy, currentTime) !== 'boolean'
  ))
    ? copy.openingStatusUnavailable
    : filterMode === 'openNow' ? copy.noneOpen : copy.noneClosed;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(timerId);
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

    const rootOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsInfoOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = rootOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, [isInfoOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isAppSwitcherOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsAppSwitcherOpen(false);
      appSwitcherButtonRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAppSwitcherOpen]);

  const handleLocate = async () => {
    if (!navigator.geolocation) {
      setErrorMessage(copy.locationUnsupported);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setFilterMode('all');
    let searchToPersist: SessionPharmacySearch | null = null;

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

      if (
        savedSearch?.origin &&
        savedSearch.language === language &&
        isSameSearchArea(savedSearch.origin, location)
      ) {
        setCurrentTime(Date.now());
        setSelectedId(savedSearch.pharmacies[0]?.id ?? null);
        if (savedSearch.pharmacies.length === 0) setErrorMessage(copy.noResults);
        return;
      }

      const results = await searchNearbyPharmacies(location, language);
      searchToPersist = { pharmacies: results, origin: location, language };
      setSavedSearch(searchToPersist);
      setPharmacies(results);
      setSelectedId(results[0]?.id ?? null);
      if (results.length === 0) setErrorMessage(copy.noResults);
    } catch (error) {
      setSavedSearch(null);
      setPharmacies([]);
      setSelectedId(null);
      setErrorMessage(getErrorMessage(error, copy));
    } finally {
      setIsSearching(false);
    }

    try {
      if (searchToPersist) {
        saveSessionPharmacySearch(searchToPersist);
      } else {
        clearSessionPharmacySearch();
      }
    } catch (error) {
      console.error('Unable to update saved Pharmacy Finder session results.', error);
      setErrorMessage((current) => (
        current ? `${current} ${copy.sessionResultsNotSaved}` : copy.sessionResultsNotSaved
      ));
    }
  };

  const formatTodayHours = (hours?: string | null) => {
    return hours?.trim() || copy.hoursUnavailable;
  };

  const handleFilterChange = (nextFilter: PharmacyFilter) => {
    setFilterMode(nextFilter);
    const matches = filterPharmacies(pharmacies, nextFilter, userLocation, currentTime);
    setSelectedId(matches[0]?.id ?? null);
  };

  const handleOpenInfo = () => {
    setInfoPage('about');
    setIsInfoOpen(true);
    setIsMenuOpen(false);
    setIsAppSwitcherOpen(false);
  };

  const handleThemeToggle = () => {
    const nextTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
    // Apply the fade only for this change; the stored preference still overrides system appearance.
    document.documentElement.classList.add('theme-transition');
    window.setTimeout(() => document.documentElement.classList.remove('theme-transition'), 400);
    window.localStorage.setItem('pharmacyFinder.appearance', nextTheme);
    setThemeOverride(nextTheme);
  };

  return (
    <div className="page-shell">
      {isAppSwitcherOpen && (
        <button
          className="app-switcher-backdrop"
          type="button"
          aria-label={copy.closeAppSwitcher}
          tabIndex={-1}
          onClick={() => {
            setIsAppSwitcherOpen(false);
            appSwitcherButtonRef.current?.focus();
          }}
        />
      )}
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-heading">
            <div className="app-switcher">
              <button
                ref={appSwitcherButtonRef}
                className="app-switcher-toggle"
                type="button"
                aria-label={isAppSwitcherOpen ? copy.closeAppSwitcher : copy.openAppSwitcher}
                aria-expanded={isAppSwitcherOpen}
                aria-controls="app-switcher-menu"
                onClick={() => {
                  setIsAppSwitcherOpen((isOpen) => !isOpen);
                  setIsMenuOpen(false);
                }}
              >
                <img
                  className="brand-logo"
                  src={`${import.meta.env.BASE_URL}pharmacy-logo.svg`}
                  alt=""
                />
              </button>
              {!isAppSwitcherOpen && (
                <div className="app-switcher-hint" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="m4 10 4-4 4 4" />
                  </svg>
                  <span>{copy.appSwitcherHint}</span>
                </div>
              )}
              {isAppSwitcherOpen && (
                <nav
                  className="app-switcher-menu"
                  id="app-switcher-menu"
                  aria-label={copy.applications}
                >
                  <a
                    className="app-switcher-item"
                    href="https://hiltunenjuho.github.io/"
                  >
                    <img
                      className="app-switcher-logo"
                      src={`${import.meta.env.BASE_URL}portfolio-logo.svg`}
                      alt=""
                    />
                    <span className="app-switcher-name app-switcher-name-portfolio">
                      Portfolio Website
                    </span>
                  </a>
                  <a
                    className="app-switcher-item is-current"
                    href="https://hiltunenjuho.github.io/nearest-pharmacy-web/"
                    aria-current="page"
                  >
                    <img
                      className="app-switcher-logo"
                      src={`${import.meta.env.BASE_URL}pharmacy-logo.svg`}
                      alt=""
                    />
                    <span className="app-switcher-name app-switcher-name-pharmacy">
                      Pharmacy Finder
                    </span>
                  </a>
                  <a
                    className="app-switcher-item"
                    href="https://hiltunenjuho.github.io/knowdium/"
                  >
                    <img
                      className="app-switcher-logo"
                      src={`${import.meta.env.BASE_URL}knowdium-logo.svg`}
                      alt=""
                    />
                    <span className="app-switcher-name app-switcher-name-knowdium">knowdium!</span>
                  </a>
                </nav>
              )}
            </div>
            <div>
              <div className="eyebrow">Juho Hiltunen</div>
              <h1>Pharmacy Finder</h1>
            </div>
          </div>
          <button
            className="utility-button info-button"
            type="button"
            onClick={handleOpenInfo}
            aria-label={copy.openInfo}
          >
            <span aria-hidden="true">i</span>
          </button>
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
          <div className="header-menu" ref={menuRef}>
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="quick-links"
              aria-label={isMenuOpen ? copy.closeMenu : copy.menuControl}
              onClick={() => {
                setIsMenuOpen((isOpen) => !isOpen);
                setIsAppSwitcherOpen(false);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <nav
              className={`quick-links ${isMenuOpen ? 'is-open' : ''}`}
              id="quick-links"
              aria-label={copy.menuLabel}
              aria-hidden={!isMenuOpen}
            >
              <button
                className="quick-link-button"
                type="button"
                tabIndex={isMenuOpen ? 0 : -1}
                onClick={handleOpenInfo}
              >
                {copy.infoMenuItem}
              </button>
              <a tabIndex={isMenuOpen ? 0 : -1} href="https://hiltunenjuho.github.io/" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                Juho Hiltunen
              </a>
              <a tabIndex={isMenuOpen ? 0 : -1} href="https://www.linkedin.com/in/hiltunenjuho/" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                LinkedIn
              </a>
              <a tabIndex={isMenuOpen ? 0 : -1} href="https://github.com/hiltunenjuho" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                GitHub
              </a>
            </nav>
          </div>
        </header>

      <p className="subtitle">{copy.subtitle}</p>

      {errorMessage ? <p className="notice" role="status">{errorMessage}</p> : null}

      <main className="content-grid">
        <section className="panel list-panel">
          <div className="panel-header">
            <h2>{copy.nearest}</h2>
            <span>{copy.resultCount(visiblePharmacies.length)}</span>
          </div>

          {pharmacies.length > 0 ? (
            <div className="filter-toggle" role="group" aria-label={copy.filterPharmacies}>
              <button
                type="button"
                aria-pressed={filterMode === 'all'}
                onClick={() => handleFilterChange('all')}
              >
                {copy.filterAll}
              </button>
              <button
                type="button"
                aria-pressed={filterMode === 'openNow'}
                onClick={() => handleFilterChange('openNow')}
              >
                {copy.filterOpenNow}
              </button>
              <button
                type="button"
                aria-pressed={filterMode === 'opensEarliest'}
                onClick={() => handleFilterChange('opensEarliest')}
              >
                {copy.filterOpensEarliest}
              </button>
            </div>
          ) : null}

          <div className="pharmacy-list">
            {visiblePharmacies.map((pharmacy, index) => {
              const distance = userLocation
                ? getDistanceKm(userLocation, { lat: pharmacy.lat, lng: pharmacy.lng })
                : null;
              const expanded = pharmacy.id === selectedId;
              const detailsId = `pharmacy-details-${index}`;
              const openingCountdown = getOpeningCountdown(pharmacy, currentTime);

              return (
                <article
                  key={pharmacy.id}
                  className={`pharmacy-card ${expanded ? 'active' : ''}`}
                >
                  <button
                    className="pharmacy-card-toggle"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={expanded ? detailsId : undefined}
                    onClick={() => setSelectedId((current) => current === pharmacy.id ? null : pharmacy.id)}
                  >
                    <div className="card-row">
                      <div className="card-summary">
                        <strong>{pharmacy.name === 'Pharmacy' ? copy.unnamedPharmacy : pharmacy.name}</strong>
                        <p>{pharmacy.address || copy.addressMissing}</p>
                        {openingCountdown ? (
                          <small className="opening-countdown">
                            {openingCountdown.isOpen
                              ? copy.openFor(openingCountdown.duration)
                              : copy.opensIn(openingCountdown.duration)}
                          </small>
                        ) : null}
                        <small className="today-hours">{formatTodayHours(pharmacy.todayHours)}</small>
                      </div>
                      {distance !== null ? <span className="pharmacy-distance">{formatDistance(distance)}</span> : null}
                      <svg className="pharmacy-card-chevron" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </button>
                  {expanded ? (
                    <div className="pharmacy-details" id={detailsId}>
                      <div className="meta-grid">
                        <div>
                          <label>{copy.openToday}</label>
                          <strong>{formatTodayHours(pharmacy.todayHours)}</strong>
                        </div>
                        <div>
                          <label>{copy.phone}</label>
                          {pharmacy.phoneNumber && getPhoneUrl(pharmacy.phoneNumber)
                            ? <a href={getPhoneUrl(pharmacy.phoneNumber)}>{pharmacy.phoneNumber}</a>
                            : <strong>{copy.notProvided}</strong>}
                        </div>
                      </div>

                      {pharmacy.openingHours.length > 0 ? (
                        <details className="hours-details">
                          <summary>{copy.fullSchedule}</summary>
                          <ul>
                            {pharmacy.openingHours.map((day) => <li key={day}>{day}</li>)}
                          </ul>
                        </details>
                      ) : null}
                      <p className="data-note">{copy.dataNote}</p>

                      <div className="attribution" translate="no">
                        {copy.dataAttribution}{' '}
                        <a href="https://maps.google.com/" target="_blank" rel="noreferrer">Google Maps</a>
                      </div>

                      <div className="cta-row">
                        <a className="action-button action-directions" href={getDirectionsUrl(pharmacy)} target="_blank" rel="noreferrer">
                          <svg className="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 20h4a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3h6" />
                            <path d="m16 4 4 4-4 4" />
                          </svg>
                          {copy.directions}
                        </a>
                        {pharmacy.phoneNumber && getPhoneUrl(pharmacy.phoneNumber) ? (
                          <a className="action-button action-call" href={getPhoneUrl(pharmacy.phoneNumber)} title={pharmacy.phoneNumber}>
                            <svg className="action-icon" viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M7 3h3l1.5 5-2 1.5a15 15 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 5 5.2 2 2 0 0 1 7 3Z" />
                            </svg>
                            {copy.callPharmacy}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
            {!isSearching && pharmacies.length === 0 ? (
              <p className="empty-state">{copy.findLocation}</p>
            ) : null}
            {pharmacies.length > 0 && visiblePharmacies.length === 0 ? (
              <p className="empty-state" role="status">{filterEmptyMessage}</p>
            ) : null}
          </div>
        </section>

      </main>
      </div>
      <footer className="site-footer">
        <div className="site-footer-content">
          <div className="footer-brand">
            <strong>Pharmacy Finder</strong>
            <span>{copy.footerBuilt(new Date().getFullYear())}</span>
            <span>{copy.footerPrivacy}</span>
          </div>
          <nav className="footer-links" aria-label={copy.linksLabel}>
            <a href="https://hiltunenjuho.github.io/" target="_blank" rel="noopener noreferrer">Portfolio</a>
            <a href="https://github.com/hiltunenjuho" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/hiltunenjuho/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://github.com/hiltunenjuho/nearest-pharmacy-web" target="_blank" rel="noopener noreferrer">{copy.webRepository}</a>
            <a href="https://github.com/hiltunenjuho/nearest-pharmacy-ios" target="_blank" rel="noopener noreferrer">{copy.iosRepository}</a>
            <a href="https://github.com/hiltunenjuho/nearest-pharmacy-web/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">{language === 'fi' ? 'MIT-lisenssi' : 'MIT License'}</a>
          </nav>
        </div>
      </footer>

      {isInfoOpen ? (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsInfoOpen(false);
        }}>
          <section className="info-dialog" role="dialog" aria-modal="true" aria-labelledby="info-title" onKeyDown={(event) => {
            if (event.key === 'Escape') setIsInfoOpen(false);
          }}>
            <button className="dialog-close" type="button" autoFocus onClick={() => setIsInfoOpen(false)} aria-label={copy.close}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
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
              </>
            ) : (
              <>
                <button className="info-back-button" type="button" onClick={() => setInfoPage('about')}>
                  ← {copy.infoBack}
                </button>
                <h2 id="info-title">{copy.infoTechnicalTitle}</h2>
                <h3>{copy.infoTechClientsTitle}</h3>
                <p>{copy.infoTechClients}</p>
                <h3>{copy.infoTechSearchTitle}</h3>
                <p>{copy.infoTechSearch}</p>
                <h3>{copy.infoTechPrivacyTitle}</h3>
                <p>{copy.infoTechPrivacy}</p>
                <h3>{copy.infoTechDeployTitle}</h3>
                <p>{copy.infoTechDeploy}</p>
              </>
            )}
            <div className="info-dialog-actions">
              {infoPage === 'about' ? (
                <button className="info-next-button" type="button" onClick={() => setInfoPage('nerds')}>
                  {copy.infoForNerds}
                </button>
              ) : null}
              <button className="info-next-button" type="button" onClick={() => setIsInfoOpen(false)}>
                {copy.close}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default App;
