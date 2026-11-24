// ── i18n ──────────────────────────────────────────────────────────────────────
import { CARBURANTS_CARD_VERSION } from "./card-picker.js";
import { CarburantsI18n } from "./i18n/strings.js";

export var CARBURANTS_DEFAULTS = {
  language: 'auto',
  show_title: true,
  show_subtitle: true,
  sort: 'price',
  max_stations: 0,
  show_icon: true,
  show_logo: true,
  show_brand: true,
  show_address: true,
  show_distance: true,
  show_hours: true,
  show_updated: true,
  show_out_of_stock: true,
  highlight_best: true,
  hide_out_of_stock_stations: true,
  show_refresh: true,
  illustration: true,
  illustration_theme: 'auto',
};
// Options of the mini card only: `fuel` (the fuel it shows, else the sort fuel, else the first one) has no default.
export var CARBURANTS_MINI_DEFAULTS = { zoom: true };

// The sensor has no value (source unreachable at startup, integration reloading): never shown as a count.
export function carbUnavailable(st) {
  return !!st && (st.state === 'unavailable' || st.state === 'unknown');
}

export function carbEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Card language: the `language` option when set (en/fr/de/es/it/nl/pt/pl/ro/da/sv/bg/ru/uk/hu/sk/cs/sl/lv/el/sr/sr-Latn), else Home Assistant's language:
// the full code when the card has it (sr-Latn), else the part before the dash (fr-FR → fr, pt-BR → pt), else English.
export function carbLang(hass, language) {
  if (language && CarburantsI18n[language]) return language;
  var lang = (hass && (hass.locale?.language || hass.language)) || navigator.language || 'en';
  if (CarburantsI18n[lang]) return lang;
  lang = lang.split('-')[0];
  return CarburantsI18n[lang] ? lang : 'en';
}

// Number and date locale: Home Assistant's full locale (fr-FR, pt-BR…) when it is a variant of the card language,
// else the card language itself, European Portuguese being pt-PT (plain `pt` is Brazilian for Intl).
export function carbLocale(hass, language) {
  var lang = carbLang(hass, language);
  var ha = (hass && (hass.locale?.language || hass.language)) || navigator.language || '';
  var locale = ha === lang || (ha.split('-')[0] === lang && !CarburantsI18n[ha]) ? ha : lang;
  return locale === 'pt' ? 'pt-PT' : locale;
}

// Plural form of `key` for n: `key_one` / `key_two` / `key_few` / `key_many` when the language has it, else `key`.
export function carbPlural(t, key, n, locale) {
  var category = 'other';
  try {
    category = new Intl.PluralRules(locale).select(Number(n));
  } catch (_e) {}
  return t[`${key}_${category}`] || t[key];
}

// Choices of the editors' `language` option, each language in its own name.
export function carbLanguageOptions(autoLabel) {
  return [{ value: 'auto', label: autoLabel }].concat(
    [['en', 'English'], ['fr', 'Français'], ['de', 'Deutsch'], ['es', 'Español'], ['it', 'Italiano'], ['nl', 'Nederlands'], ['pt', 'Português (Portugal)'], ['pl', 'Polski'], ['ro', 'Română'], ['da', 'Dansk'], ['sv', 'Svenska'], ['bg', 'Български'], ['ru', 'Русский'], ['uk', 'Українська'], ['hu', 'Magyar'], ['sk', 'Slovenčina'], ['cs', 'Čeština'], ['sl', 'Slovenščina'], ['lv', 'Latviešu'], ['el', 'Ελληνικά'], ['sr', 'Српски'], ['sr-Latn', 'Srpski (latinica)']].map((l) => ({ value: l[0], label: l[1] })),
  );
}

export function carbTitleCase(s) {
  s = String(s || '');
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])\S/g, (m) => m.toUpperCase()) : s;
}

// Stable color per brand for the initials badge.
export function carbBrandColor(name) {
  var palette = ['#1565c0', '#2e7d32', '#c62828', '#6a1b9a', '#ef6c00', '#00838f', '#4e342e', '#283593'];
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function carbInitials(name) {
  var words = String(name || '').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

// True when none of the fuels is in stock at the station (all in shortage, or not sold).
export function carbAllOut(station, fuels) {
  return !fuels.some((f) => {
    var fuel = station.fuels?.[f.key];
    return fuel?.available;
  });
}

// Lowest price in stock per fuel key, over the given stations.
export function carbBestPrices(stations, fuels) {
  var best = {};
  fuels.forEach((f) => {
    stations.forEach((s) => {
      var fuel = s.fuels?.[f.key];
      if (fuel?.available && (best[f.key] == null || fuel.price < best[f.key])) best[f.key] = fuel.price;
    });
  });
  return best;
}

// The station selling the fuel cheapest (in stock), the nearest on a price tie (unknown distance last), or null.
export function carbCheapest(stations, key) {
  var best = null;
  var far = (s) => (s.distance == null ? Infinity : s.distance);
  stations.forEach((s) => {
    var fuel = s.fuels?.[key];
    if (!fuel?.available || fuel.price == null) return;
    var price = best?.fuels[key].price;
    if (!best || fuel.price < price || (fuel.price === price && far(s) < far(best))) best = s;
  });
  return best;
}

// Stations shown: the out of stock ones are left out unless asked (hide_out_of_stock_stations).
// hidden: how many were left out (the "show all" button).
export function carbVisibleStations(stations, fuels, config, showAll) {
  var hidden = config.hide_out_of_stock_stations ? stations.filter((s) => carbAllOut(s, fuels)).length : 0;
  var shown = hidden && !showAll ? stations.filter((s) => !carbAllOut(s, fuels)) : stations.slice();
  return { shown: shown, hidden: hidden };
}

export function carbToggleLabel(t, showAll, hidden) {
  if (showAll) return t.hide_out;
  return hidden === 1 ? t.show_all_one : t.show_all.replace('{n}', hidden);
}

// Gives ha-form a schema only when it differs from the current one (the fuels follow the entity).
export function carbSetSchema(form, schema) {
  var key = JSON.stringify(schema);
  if (form._carbSchemaKey === key) return;
  form._carbSchemaKey = key;
  form.schema = schema;
}

// Calls onOutside for a click anywhere outside the element (shadow DOM aware), on the release, not on the press:
// collapsing on press would shift the layout under the pointer before the click (the click keeps the target of the
// press and the release).
// « A click elsewhere », caught on the pointer: iOS (Safari and the companion app) sends no click for a tap on
// something that is not clickable. It counts when the press and the release are both outside the element (a map
// or a slider dragged out of it does not count, nor a scroll, which cancels the pointer); keyboard clicks (no click
// count) go through the click event.
export function carbWatchOutside(element, onOutside) {
  var downOutside = false;
  var outside = (ev) => (ev.composedPath ? ev.composedPath() : []).indexOf(element) === -1;
  var onDown = (ev) => {
    downOutside = outside(ev);
  };
  var onUp = (ev) => {
    if (downOutside && outside(ev)) onOutside(ev);
    downOutside = false;
  };
  var onClick = (ev) => {
    if (ev.detail === 0 && outside(ev)) onOutside(ev);
  };
  return {
    on() {
      document.addEventListener('pointerdown', onDown, true);
      document.addEventListener('pointerup', onUp, true);
      document.addEventListener('click', onClick, true);
    },
    off() {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('click', onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
}

// Brand logos shipped with the integration (frontend/brands, the logo pack of aaos-carburants), found
// from the brand, then the station name. keys: names in lower case without accents nor punctuation; a key
// matches the whole name, or its start when 4 letters or more; the longest key wins ("totalaccess" before
// "total"). dark: white logo, drawn on a dark tile. tile: the logo is a tile of its own, drawn as is.
export var CARBURANTS_BRAND_LOGOS = [
  { file: 'total_access', keys: ['totalaccess', 'totalenergiesaccess'], tile: true },
  { file: '8_a_huit', keys: ['8ahuit', '8a8', 'huitahuit'] },
  { file: 'avia', keys: ['avia'] },
  { file: 'agip', keys: ['agip'] },
  { file: 'aldi_nord', keys: ['aldi'] },
  { file: 'atac', keys: ['atac'] },
  { file: 'auchan', keys: ['auchan'] },
  { file: 'bp', keys: ['bp'] },
  { file: 'bricomarche', keys: ['bricomarche'] },
  { file: 'carrefour', keys: ['carrefour'] },
  { file: 'casino', keys: ['casino', 'petitcasino'] },
  { file: 'colruyt', keys: ['colruyt'] },
  { file: 'cora', keys: ['cora'] },
  { file: 'costco', keys: ['costco'] },
  { file: 'dyneff', keys: ['dyneff'] },
  { file: 'elan', keys: ['elan'] },
  { file: 'elf', keys: ['elf'] },
  { file: 'eni', keys: ['eni'] },
  { file: 'esso', keys: ['esso'] },
  { file: 'fulli', keys: ['fulli'] },
  { file: 'g20', keys: ['g20'] },
  { file: 'geant_casino', keys: ['geantcasino', 'geant'] },
  { file: 'gulf', keys: ['gulf'] },
  { file: 'hyper_u', keys: ['hyperu', 'superu', 'uexpress', 'systemeu', 'marcheu', 'utile', 'u'] },
  { file: 'intermarche', keys: ['intermarche'] },
  { file: 'leader_price', keys: ['leaderprice'] },
  { file: 'leclerc', keys: ['eleclerc', 'leclerc'] },
  { file: 'lidl', keys: ['lidl'] },
  { file: 'match', keys: ['match', 'supermarchematch'] },
  { file: 'maximarche', keys: ['maximarche'] },
  { file: 'migrol', keys: ['migrol'] },
  { file: 'monoprix', keys: ['monoprix'] },
  { file: 'netto', keys: ['netto'] },
  { file: 'proxi', keys: ['proxi'] },
  { file: 'renault', keys: ['renault'] },
  { file: 'roady', keys: ['roady'], dark: true },
  { file: 'rompetrol', keys: ['rompetrol'] },
  { file: 'shell', keys: ['shell'] },
  { file: 'spar', keys: ['spar'] },
  { file: 'totalenergies', keys: ['totalenergies', 'total'] },
  { file: 'vito', keys: ['vito'] },
  { file: 'weldom', keys: ['weldom'] },
];
export var CARBURANTS_LOGO_KEYS = [];
CARBURANTS_BRAND_LOGOS.forEach((b) => {
  b.keys.forEach((key) => { CARBURANTS_LOGO_KEYS.push({ key: key, brand: b }); });
});
CARBURANTS_LOGO_KEYS.sort((a, b) => b.key.length - a.key.length);

export function carbBrandKey(name) {
  return String(name || '').normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function carbShippedLogo(name) {
  var key = carbBrandKey(name);
  if (!key) return null;
  var hit = CARBURANTS_LOGO_KEYS.find((e) => key === e.key || (e.key.length >= 4 && key.indexOf(e.key) === 0));
  return hit ? hit.brand : null;
}

// The station's logo: { src, own, tile, dark }, own when shipped with the integration, else the Wikidata one.
export function carbLogo(s) {
  var brand = carbShippedLogo(s.brand) || carbShippedLogo(s.station_name);
  if (brand) {
    return { src: `/carburants_france_static/brands/${brand.file}.png?v=${CARBURANTS_CARD_VERSION}`, own: true, tile: !!brand.tile, dark: !!brand.dark };
  }
  return s.logo ? { src: s.logo, own: false } : null;
}

// Logo URLs that failed to load once: drawn as an initials badge right away on the next
// renders, so the browser does not replay the failing request on every redraw.
export var CARBURANTS_FAILED_LOGOS = new Set();

// Extra classes of a logo <img>: own for a tile drawn as is, dark for a white logo.
export function carbLogoClass(known) {
  return (known.tile ? ' own' : '') + (known.dark ? ' dark' : '');
}

// Fuel tile columns: 150 px tiles with one or two fuels, three in a row, four as 2 × 2 on a
// narrow card (in a row once there is room), more wrap on their own.
export function carbFuelColumns(count) {
  var columns = count <= 2 ? `repeat(${count},minmax(0,150px))`
    : count === 3 ? 'repeat(3,minmax(0,1fr))'
      : count === 4 ? 'repeat(auto-fill,minmax(max(140px,calc((100% - 18px) / 4)),1fr))' : '';
  return columns ? ` style="grid-template-columns:${columns}"` : '';
}
