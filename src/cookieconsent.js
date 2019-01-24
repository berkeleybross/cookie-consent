/* eslint-disable prefer-arrow-callback */
import { getCookie as getRawCookie, createCookie as createRawCookie } from './cookies';
import { insertCookieBanner, hideCookieModal, showCookieConfirmation } from './modal';
import { enableScriptsByCategory, enableIframesByCategory } from './enable';
import packageJson from '../package.json';

/**
 * If cookie rules/regulations change and the cookie itself needs to change,
 * bump this version up afterwards. It will then give the user the banner again
 * to consent to the new rules
 */
export const COOKIE_VERSION = 1;
const COOKIE_NAME = 'nhsuk-cookie-consent';

/* eslint-disable sort-keys */
const cookieTypes = {
  necessary: true,
  preferences: true,
  statistics: false,
  marketing: false,
  version: COOKIE_VERSION,
};
/* eslint-enable sort-key */

function getCookie() {
  const rawCookie = getRawCookie(COOKIE_NAME);
  return JSON.parse(rawCookie);
}

function createCookie(value, days, path, domain, secure) {
  const stringValue = JSON.stringify(value);
  return createRawCookie(COOKIE_NAME, stringValue, days, path, domain, secure);
}

function getCookieVersion() {
  return getCookie(COOKIE_NAME).version;
}

function isValidVersion(version) {
  return getCookieVersion() <= version;
}

// If consent is given, change value of cookie
export function acceptConsent() {
  // On a domain where marketing cookies are required, toggleMarketing() would go here
  hideCookieModal();
}

export function askMeLater() {
  createCookie(COOKIE_NAME, cookieTypes, '', '/');
  hideCookieModal();
}

// N.B document.currentScript needs to be executed outside of any callbacks
// https://developer.mozilla.org/en-US/docs/Web/API/Document/currentScript#Notes
const scriptTag = document.currentScript;

/**
 * Get properties from the script tag that is including this javascript
 */
function getScriptSettings() {
  const defaults = {
    nobanner: false,
  };
  if (!scriptTag) {
    return defaults;
  }

  const dataNobanner = scriptTag.getAttribute('data-nobanner');

  // overwrite the default settings with attributes found on the <script> tag
  return {
    ...defaults,
    nobanner: dataNobanner === 'true' || dataNobanner === '',
  };
}

function getConsentSetting(key) {
  const cookie = getCookie(COOKIE_NAME);
  return cookie[key];
}

function getPreferences() {
  return getConsentSetting('preferences');
}

function getStatistics() {
  return getConsentSetting('statistics');
}

function getMarketing() {
  return getConsentSetting('marketing');
}

function togglePreferences() {
  const cookie = getCookie();
  cookie.preferences = !cookie.preferences;
  createCookie(cookie, 365, '/');
}

function toggleStatistics() {
  const cookie = getCookie();
  cookie.statistics = !cookie.statistics;
  createCookie(cookie, 365, '/');
}

function toggleMarketing() {
  const cookie = getCookie();
  cookie.marketing = !cookie.marketing;
  createCookie(cookie, 365, '/');
}

/*
 * Set the global NHSCookieConsent object that implementors of this library
 * will interact with.
 */
window.NHSCookieConsent = {
  /*
   * The version of this package as defined in the package.json
   */
  VERSION: packageJson.version,

  getPreferences,
  getStatistics,
  getMarketing,
  togglePreferences,
  toggleStatistics,
  toggleMarketing,
};

window.addEventListener("load", function checkCookie() {
  const settings = getScriptSettings();

  // If there isn't a user cookie, create one
  if (getCookie() == null) {
    createCookie(cookieTypes, 365, '/');
    if (!settings.nobanner) {
      insertCookieBanner(acceptConsent, askMeLater);
    }
  } else if (!isValidVersion(COOKIE_VERSION)) {
    createCookie(cookieTypes, 365, '/');
    if (!settings.nobanner) {
      insertCookieBanner(acceptConsent, askMeLater);
    }
  }

  if (getStatistics() === true) {
    enableScriptsByCategory('statistics');
    enableIframesByCategory('statistics');
  }
  if (getPreferences() === true) {
    enableScriptsByCategory('preferences');
    enableIframesByCategory('preferences');
  }
  if (getMarketing() === true) {
    enableScriptsByCategory('marketing');
    enableIframesByCategory('marketing');
  }
});
