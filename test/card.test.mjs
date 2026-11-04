// Unit tests for the card helpers: the card file is evaluated with stubs, no browser needed.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../custom_components/carburants_france/frontend/carburants-france-card.js', import.meta.url), 'utf8');
const context = {
  HTMLElement: class {},
  customElements: { get: () => true, define() {} },
  window: {},
  navigator: { language: 'en' },
  document: { addEventListener() {}, removeEventListener() {} },
  console,
  // Timers are queued, never run on their own: tests call runTimers().
  setTimeout: (fn) => timers.push(fn) - 1,
  clearTimeout: (id) => { if (id != null && timers[id]) timers[id] = null; },
  clearInterval() {},
};
const timers = [];
const runTimers = () => {
  for (const fn of timers.splice(0)) fn?.();
};
vm.createContext(context);
vm.runInContext(`${source}\nthis.carb = { carbBestPrices, carbVisibleStations, carbSetSchema, carbOpening, carbLang, carbLocale, carbLanguageOptions, carbPlural, CarburantsFranceCard, CarburantsFranceMapCard };`, context);
const { carbBestPrices, carbVisibleStations, carbSetSchema, carbOpening, carbLang, carbLocale, carbLanguageOptions, CarburantsFranceCard, CarburantsFranceMapCard } = context.carb;
const NEW_LANGS = ['ro', 'da', 'sv', 'bg', 'ru', 'uk', 'hu', 'sk', 'cs', 'sl', 'lv', 'el'];

const fuels = [{ key: 'gazole' }, { key: 'e10' }];
const station = (id, gazole, e10) => ({
  station_id: id,
  fuels: {
    gazole: gazole == null ? { available: false, rupture: 'temporaire' } : { available: true, price: gazole },
    e10: e10 == null ? { available: false, rupture: 'temporaire' } : { available: true, price: e10 },
  },
});
const stations = [station(1, 1.8, 1.7), station(2, 1.75, null), station(3, null, null), station(4, null, null)];

test('carbBestPrices keeps the lowest price in stock per fuel', () => {
  assert.deepEqual({ ...carbBestPrices(stations, fuels) }, { gazole: 1.75, e10: 1.7 });
  assert.deepEqual({ ...carbBestPrices([station(3, null, null)], fuels) }, {});
});

test('carbVisibleStations hides the out of stock stations unless asked', () => {
  const config = { hide_out_of_stock_stations: true };
  let visible = carbVisibleStations(stations, fuels, config, false);
  assert.deepEqual(visible.shown.map((s) => s.station_id), [1, 2]);
  assert.equal(visible.hidden, 2);
  visible = carbVisibleStations(stations, fuels, config, true);
  assert.equal(visible.shown.length, 4);
  visible = carbVisibleStations(stations, fuels, { hide_out_of_stock_stations: false }, false);
  assert.equal(visible.shown.length, 4);
  assert.equal(visible.hidden, 0);
});

test('getCardSize counts the stations shown, max_stations and the footer', () => {
  const size = (config, showAll = false) => CarburantsFranceCard.prototype.getCardSize.call({
    _config: { hide_out_of_stock_stations: true, max_stations: 0, ...config },
    _lastState: { attributes: { stations: stations, fuels: fuels } },
    _showAll: showAll,
    _fuels: () => fuels,
  });
  assert.equal(size({}), 1 + 2 * 2 + 1);
  assert.equal(size({}, true), 1 + 4 * 2 + 1);
  assert.equal(size({ max_stations: 1 }), 1 + 2 + 1);
  assert.equal(size({ hide_out_of_stock_stations: false }), 1 + 4 * 2);
  assert.equal(CarburantsFranceCard.prototype.getCardSize.call({ _config: {}, _lastState: null }), 1);
});

// Weekly hours, Monday = 1 … Sunday = 7; days not listed are closed.
const week = (spec) => [1, 2, 3, 4, 5, 6, 7].map((day) => (spec[day] ? { day, closed: false, ranges: spec[day] } : { day, closed: true, ranges: [] }));
const at = (iso) => new Date(iso); // local time; 2026-10-29 is a Thursday
const en = () => context.CarburantsI18n.en;
context.carbPlural = context.carb.carbPlural;

test('carbOpening: a range crossing midnight is open in the small hours of the next day only', () => {
  // Friday 22:00 → 02:00, Saturday closed: open on Saturday at 01:00.
  const friNight = { hours: week({ 1: [['08:00', '20:00']], 5: [['22:00', '02:00']] }) };
  assert.equal(carbOpening(friNight, en(), at('2026-10-31T01:00:00'), 'en').key, 'open');
  assert.equal(carbOpening(friNight, en(), at('2026-10-31T01:00:00'), 'en').text, 'Open · closes at 02:00');
  assert.equal(carbOpening(friNight, en(), at('2026-10-31T02:30:00'), 'en').key, 'closed');
  assert.equal(carbOpening(friNight, en(), at('2026-10-30T23:00:00'), 'en').key, 'open');
  // Thursday closed: not open on Friday at 01:00 (that part of Friday's range is Friday night's).
  assert.equal(carbOpening(friNight, en(), at('2026-10-30T01:00:00'), 'en').key, 'closed');
  // Sunday → Monday wraps around the week.
  const sunNight = { hours: week({ 7: [['20:00', '00:00']], 1: [['06:00', '12:00']] }) };
  assert.equal(carbOpening(sunNight, en(), at('2026-11-01T21:00:00'), 'en').key, 'open');
  assert.equal(carbOpening(sunNight, en(), at('2026-11-02T00:30:00'), 'en').key, 'closed');
});

test('carbOpening names the next opening day in the card locale', () => {
  const monday = { hours: week({ 1: [['08:00', '20:00']] }) };
  const thu = at('2026-10-29T12:00:00');
  assert.equal(carbOpening(monday, context.CarburantsI18n.en, thu, 'en').text, 'Closed · opens at Mon 08:00');
  // The exact abbreviation depends on the ICU data ("Mo" or "Mo."): compare with Intl itself.
  const mon = (locale) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(at('2026-11-02T12:00:00'));
  assert.equal(carbOpening(monday, context.CarburantsI18n.de, thu, 'de').text, `Geschlossen · öffnet um ${mon('de')} 08:00`);
  assert.equal(carbOpening(monday, context.CarburantsI18n.fr, thu, 'fr').text, `Fermé · ouvre à ${mon('fr')} 08:00`);
  assert.notEqual(mon('de'), 'mon.');
});

test('carbLang prefers the language option over the Home Assistant language', () => {
  const hass = { locale: { language: 'fr' } };
  assert.equal(carbLang(hass), 'fr');
  assert.equal(carbLang(hass, 'auto'), 'fr');
  assert.equal(carbLang(hass, 'de'), 'de');
  assert.equal(carbLang({ language: 'ja' }), 'en');
});

test('carbLang: the full language when the card has it, else the part before the dash, else English', () => {
  assert.equal(carbLang({ locale: { language: 'fr-FR' } }), 'fr');
  assert.equal(carbLang({ locale: { language: 'sr-Latn' } }), 'sr-Latn');
  assert.equal(carbLang({ locale: { language: 'sr' } }), 'sr');
  assert.equal(carbLang({ language: 'sr-Cyrl' }), 'sr');
  assert.equal(carbLang({ locale: { language: 'ja' } }), 'en');
  // The `language` option still wins over Home Assistant's.
  assert.equal(carbLang({ locale: { language: 'fr' } }, 'sr-Latn'), 'sr-Latn');
  assert.equal(carbLang({ locale: { language: 'sr-Latn' } }, 'sr'), 'sr');
});

test('carbLang: Italian, Dutch, European Portuguese and Polish, with their regional variants', () => {
  const lang = (code) => carbLang({ locale: { language: code } });
  assert.equal(lang('it-IT'), 'it');
  assert.equal(lang('nl-BE'), 'nl');
  assert.equal(lang('pt'), 'pt');
  // Brazilian Portuguese falls back to European Portuguese.
  assert.equal(lang('pt-BR'), 'pt');
  assert.equal(lang('pl-PL'), 'pl');
  assert.equal(lang('sr-Latn'), 'sr-Latn');
  assert.equal(lang('ja'), 'en');
  assert.equal(carbLang({ locale: { language: 'en' } }, 'pl'), 'pl');
});

test('the editors offer Italian, Dutch, Portuguese and Polish, each in its own name', () => {
  const labels = Object.fromEntries(carbLanguageOptions('auto').map((o) => [o.value, o.label]));
  assert.equal(labels.it, 'Italiano');
  assert.equal(labels.nl, 'Nederlands');
  assert.equal(labels.pt, 'Português (Portugal)');
  assert.equal(labels.pl, 'Polski');
  // Every card language is offered, and only those.
  assert.deepEqual(Object.keys(labels).filter((v) => v !== 'auto').sort(), Object.keys(context.CarburantsI18n).sort());
});

const CYRILLIC = /[\u0400-\u04FF]/;
test('Serbian Latin dates and weekdays are in the Latin script, Cyrillic ones in Cyrillic', () => {
  const monday = { hours: week({ 1: [['08:00', '20:00']] }) };
  const thu = at('2026-10-29T12:00:00');
  const latin = carbOpening(monday, context.CarburantsI18n['sr-Latn'], thu, carbLocale(null, 'sr-Latn')).text;
  assert.doesNotMatch(latin, CYRILLIC, latin);
  assert.match(latin, /^Zatvoreno · otvara se u /);
  const cyrillic = carbOpening(monday, context.CarburantsI18n.sr, thu, carbLocale(null, 'sr')).text;
  assert.match(cyrillic, /^Затворено · отвара се у [\u0400-\u04FF]/);
  assert.equal(carbLocale({ locale: { language: 'sr-Latn' } }, 'auto'), 'sr-Latn');
  assert.doesNotMatch(new Intl.RelativeTimeFormat(carbLocale(null, 'sr-Latn'), { numeric: 'auto', style: 'short' }).format(-2, 'day'), CYRILLIC);
});

test('the editors offer Serbian in both scripts, each in its own name', () => {
  const options = carbLanguageOptions('auto');
  assert.equal(JSON.stringify(options.slice(-2)), JSON.stringify([{ value: 'sr', label: 'Српски' }, { value: 'sr-Latn', label: 'Srpski (latinica)' }]));
});

// Serbian Cyrillic letter by letter, and its Latin spelling (љ, њ and џ take two letters).
const SR_CYR = 'абвгдђежзијклљмнњопрстћуфхцчџш';
const SR_LAT = ['a', 'b', 'v', 'g', 'd', 'đ', 'e', 'ž', 'z', 'i', 'j', 'k', 'l', 'lj', 'm', 'n', 'nj', 'o', 'p', 'r', 's', 't', 'ć', 'u', 'f', 'h', 'c', 'č', 'dž', 'š'];
const toLatin = new Map();
[...SR_CYR].forEach((c, i) => {
  toLatin.set(c, SR_LAT[i]);
  toLatin.set(c.toUpperCase(), SR_LAT[i][0].toUpperCase() + SR_LAT[i].slice(1));
});
const strings = (value) => (typeof value === 'string' ? [value] : Object.values(value).flatMap(strings));

test('Serbian: the Cyrillic and Latin cards say the same thing, letter for letter', () => {
  for (const i18n of [context.CarburantsI18n, context.CarburantsMapI18n]) {
    const cyr = strings(i18n.sr);
    const lat = strings(i18n['sr-Latn']);
    assert.equal(lat.length, cyr.length);
    cyr.forEach((text, i) => {
      assert.equal([...text].map((c) => toLatin.get(c) ?? c).join(''), lat[i], text);
    });
  }
});

test('Serbian Cyrillic has no Latin word left, except names, units and placeholders', () => {
  const allowed = /Home Assistant|Carburants France|OpenStreetMap( France)?|OpenTopoMap|CyclOSM|Esri|IGN|URL|entity|km|px|\{\w+\}/g;
  for (const i18n of [context.CarburantsI18n, context.CarburantsMapI18n]) {
    for (const text of strings(i18n.sr)) {
      assert.doesNotMatch(text.replace(allowed, ''), /[A-Za-z]/, text);
    }
  }
});

test('carbSetSchema only hands ha-form a schema that changed', () => {
  let sets = 0;
  const form = {};
  Object.defineProperty(form, 'schema', { set() { sets += 1; } });
  carbSetSchema(form, [{ name: 'entity' }]);
  carbSetSchema(form, [{ name: 'entity' }]);
  assert.equal(sets, 1);
  carbSetSchema(form, [{ name: 'entity' }, { name: 'fuels' }]);
  assert.equal(sets, 2);
});

test('detaching the map card leaves the pseudo full screen (iOS) for good', () => {
  const classes = new Set(['fullscreen', 'pseudo']);
  const haCard = { classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)) } };
  const fsLink = { setAttribute() {} };
  const card = Object.assign(Object.create(CarburantsFranceMapCard.prototype), {
    _root: { querySelector: (sel) => (sel === 'ha-card' ? haCard : null) },
    _pseudoFs: true,
    _fsLink: fsLink,
    _hass: { language: 'en' },
    matches: () => false,
  });
  card._listenFullscreen();
  card.disconnectedCallback();
  assert.equal(card._pseudoFs, false);
  assert.deepEqual([...classes], []);
  assert.equal(fsLink.title, 'Full screen');
});

test('the map is torn down after a long detach only, and rebuilt when the card comes back', () => {
  const mapCard = (connected) => {
    let removed = 0;
    let updates = 0;
    const card = Object.assign(Object.create(CarburantsFranceMapCard.prototype), {
      _map: { remove: () => { removed += 1; } },
      _config: { show_fullscreen: false },
      _hass: {},
      _root: { querySelector: () => null },
      _update: () => { updates += 1; },
    });
    Object.defineProperty(card, 'isConnected', { get: () => connected.value });
    return { card, removed: () => removed, updates: () => updates };
  };
  // Straight back (view switch, editor preview): the pending teardown is cancelled.
  const connected = { value: false };
  let c = mapCard(connected);
  c.card.disconnectedCallback();
  connected.value = true;
  c.card._invalidate = () => {};
  c.card.connectedCallback();
  runTimers();
  assert.equal(c.removed(), 0);
  assert.ok(c.card._map);
  // Gone for good: the map (and its WebGL context) is freed, then rebuilt on reattach.
  connected.value = false;
  c = mapCard(connected);
  c.card.disconnectedCallback();
  runTimers();
  assert.equal(c.removed(), 1);
  assert.equal(c.card._map, null);
  connected.value = true;
  c.card.connectedCallback();
  assert.equal(c.updates(), 1);
});

test('a map card detached in native full screen comes back out of full screen', () => {
  for (const keepMap of [true, false]) {
    const classes = new Set(['fullscreen']);
    const haCard = {
      classList: {
        contains: (name) => classes.has(name),
        toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)),
      },
    };
    const fsLink = { setAttribute() {} };
    const native = { value: true };
    const card = Object.assign(Object.create(CarburantsFranceMapCard.prototype), {
      _root: { querySelector: (sel) => (sel === 'ha-card' ? haCard : null) },
      _pseudoFs: false,
      _fsLink: fsLink,
      _map: {},
      _config: { show_fullscreen: true },
      _hass: { language: 'en', callWS: () => Promise.resolve({}) },
      _invalidate() {},
      _update() {},
      matches: () => native.value,
    });
    card._listenFullscreen();
    card.disconnectedCallback();
    // Removing the element makes the browser leave full screen; fullscreenchange comes too late.
    native.value = false;
    if (!keepMap) card._map = null;
    card.connectedCallback();
    runTimers();
    assert.deepEqual([...classes], [], `map ${keepMap ? 'kept' : 'rebuilt'}`);
    assert.equal(fsLink.title, 'Full screen');
  }
});

// Element stub enough for the search bar and the full screen button labels.
const labelled = () => {
  const attrs = {};
  return { attrs, setAttribute: (name, value) => { attrs[name] = value; } };
};

test('changing the language option relabels the search bar and the full screen button in place', () => {
  const input = Object.assign(labelled(), { value: 'Renn', placeholder: 'Search a town or postcode' });
  const clear = Object.assign(labelled(), { title: 'Clear the search' });
  const bar = { hidden: false, firstChild: input, querySelector: (sel) => ({ input, '.clear': clear })[sel] ?? null };
  const fsLink = labelled();
  const card = Object.assign(Object.create(CarburantsFranceMapCard.prototype), {
    _root: { querySelector: (sel) => (sel === '.searchbar' ? bar : null) },
    _fsLink: fsLink,
    _hass: undefined,
    matches: () => false,
  });
  card.setConfig({ entity: 'sensor.x', language: 'en' });
  card.setConfig({ entity: 'sensor.x', language: 'fr' });
  // Same input, not rebuilt: the text typed (and the focus) stay.
  assert.equal(bar.querySelector('input'), input);
  assert.equal(input.value, 'Renn');
  assert.equal(input.placeholder, 'Rechercher une ville ou un code postal');
  assert.equal(input.attrs['aria-label'], 'Rechercher une ville ou un code postal');
  assert.equal(clear.title, 'Effacer la recherche');
  assert.equal(clear.attrs['aria-label'], 'Effacer la recherche');
  assert.equal(fsLink.title, 'Plein écran');
  assert.equal(fsLink.attrs['aria-label'], 'Plein écran');
});

test('changing the language before the map card is drawn, or without search bar, does not fail', () => {
  const card = Object.assign(Object.create(CarburantsFranceMapCard.prototype), { matches: () => false });
  card.setConfig({ entity: 'sensor.x', language: 'en' });
  card.setConfig({ entity: 'sensor.x', language: 'de' });
  const empty = { hidden: true, firstChild: null, querySelector: () => null };
  card._root = { querySelector: (sel) => (sel === '.searchbar' ? empty : null) };
  card.setConfig({ entity: 'sensor.x', language: 'es', show_search: false });
  assert.equal(card._config.language, 'es');
});

test('with language: auto, the map card labels follow a Home Assistant language switch', () => {
  const input = Object.assign(labelled(), { value: '', placeholder: '' });
  const clear = labelled();
  const bar = { hidden: false, firstChild: input, querySelector: (sel) => ({ input, '.clear': clear })[sel] ?? null };
  const fsLink = labelled();
  const map = { classList: { toggle() {} } };
  const card = Object.assign(Object.create(CarburantsFranceMapCard.prototype), {
    _root: { querySelector: (sel) => ({ '.searchbar': bar, '.map': map })[sel] ?? null },
    _fsLink: fsLink,
    _map: {},
    _lastState: null,
    _reloadTilesIfNeeded() {},
    matches: () => false,
  });
  card.setConfig({ entity: 'sensor.x', language: 'auto' });
  card._update = () => {};
  card.hass = { locale: { language: 'fr' }, states: {} };
  assert.equal(input.placeholder, 'Rechercher une ville ou un code postal');
  card.hass = { locale: { language: 'de' }, states: {} };
  assert.equal(input.placeholder, 'Ort oder Postleitzahl suchen');
  assert.equal(fsLink.title, 'Vollbild');
});

// Keys a language adds when its grammar needs them; the others fall back to `stations`, `opens_at` and `since`.
const OPTIONAL_KEYS = ['stations_one', 'stations_two', 'stations_few', 'stations_many', 'opens_on', 'out_since'];
const withoutOptional = (dict) => Object.fromEntries(Object.entries(dict).filter(([key]) => !OPTIONAL_KEYS.includes(key)));

test('every card language has exactly the keys of English', () => {
  const shape = (value) => {
    if (Array.isArray(value)) return `array:${value.length}`;
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, shape(value[key])]));
    }
    return typeof value;
  };
  const placeholders = (value) => JSON.stringify(value).match(/\{\w+\}/g)?.sort() ?? [];
  for (const i18n of [context.CarburantsI18n, context.CarburantsMapI18n]) {
    assert.deepEqual(Object.keys(i18n).sort(), [...NEW_LANGS, 'de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'sr', 'sr-Latn'].sort());
    for (const lang of Object.keys(i18n)) {
      assert.deepEqual(shape(withoutOptional(i18n[lang])), shape(withoutOptional(i18n.en)), lang);
      assert.deepEqual(placeholders(withoutOptional(i18n[lang])), placeholders(withoutOptional(i18n.en)), lang);
      const extra = Object.keys(i18n[lang]).filter((key) => OPTIONAL_KEYS.includes(key));
      for (const key of extra) assert.equal(typeof i18n[lang][key], 'string', `${lang}: ${key}`);
      if (i18n[lang].opens_on) assert.deepEqual(placeholders(i18n[lang].opens_on), ['{d}', '{t}'], lang);
      if (i18n[lang].out_since) assert.deepEqual(placeholders(i18n[lang].out_since), ['{s}'], lang);
      for (const text of strings(i18n[lang])) assert.ok(text.trim(), `${lang}: empty string`);
    }
  }
});

// The map popup, rendered alone: `this` only needs what _popup reads.
const popup = (stationsShown, s, best) => CarburantsFranceMapCard.prototype._popup.call(
  {
    _locale: () => 'en',
    _price: CarburantsFranceMapCard.prototype._price,
    _results: null,
    _mt: () => ({}),
  },
  { ...s, station_name: `S${s.station_id}`, address: 'x', city: 'y', latitude: 48, longitude: -1 },
  fuels.map((f) => ({ ...f, name: f.key })),
  best,
  { out_of_stock: 'out', no_price: 'no price', directions: 'go', always_open: 'open' },
  new Date(),
  stationsShown,
);

test('the map popup does not mark a lone station as the best price', () => {
  const lone = station(1, 1.8, 1.7);
  const html = popup(1, lone, carbBestPrices([lone], fuels));
  assert.doesNotMatch(html, /class="best"/);
});

test('the map popup marks the best price only on the cheapest of several stations', () => {
  const shown = [station(1, 1.8, 1.7), station(2, 1.75, 1.72)];
  const best = carbBestPrices(shown, fuels);
  assert.equal(popup(2, shown[0], best).match(/class="best"/g)?.length, 1);
  assert.equal(popup(2, shown[1], best).match(/class="best"/g)?.length, 1);
  // Stations hidden from the map (e.g. out of stock) do not count: a single one shown is not "the best".
  assert.doesNotMatch(popup(1, shown[0], best), /class="best"/);
});

// List card with a stub shadow root: the list keeps the HTML written to it, and hands out one stub row
// per station found in that HTML (a fresh one each render, as innerHTML would), recording focus().
const listCard = () => {
  const focused = [];
  const focusOptions = [];
  const list = {
    html: '',
    set innerHTML(html) { this.html = html; },
    get innerHTML() { return this.html; },
    querySelectorAll(sel) {
      if (sel !== '.station') return [];
      if (this.nodesOf !== this.html) {
        this.nodesOf = this.html;
        this.nodes = [...this.html.matchAll(/<div class="station" data-id="([^"]*)">/g)].map((m) => {
          const item = { getAttribute: (name) => (name === 'data-id' ? m[1] : null) };
          const row = { focus: (opts) => { focused.push(m[1]); focusOptions.push(opts); }, closest: (c) => (c === '.station' ? item : null) };
          item.querySelector = (s) => (s === '.row' ? row : null);
          return item;
        });
      }
      return this.nodes;
    },
  };
  const node = () => ({ innerHTML: '', hidden: false, querySelector: () => null });
  const parts = { '.header': node(), '.list': list, '.footer': node() };
  const card = Object.assign(Object.create(CarburantsFranceCard.prototype), {
    _root: { querySelector: (sel) => parts[sel] ?? null, activeElement: null },
  });
  const state = { state: '2', attributes: { config_entry_id: 'x', fuels: fuels.map((f) => ({ ...f, name: f.key })), stations: [station(1, 1.8, 1.7), station(2, 1.75, 1.72)] } };
  card.setConfig({ entity: 'sensor.x', language: 'en', show_logo: false });
  card.hass = { language: 'en', states: { 'sensor.x': state } };
  return { card, list, focused, focusOptions };
};
// A key press on a station row, as the list's keydown listener receives it.
const keyOnRow = (list, id, key) => {
  const row = list.querySelectorAll('.station').find((s) => s.getAttribute('data-id') === id).querySelector('.row');
  let prevented = false;
  return { row, ev: { key, target: row, preventDefault: () => { prevented = true; } }, prevented: () => prevented };
};

test('a list station row is a keyboard button that says whether it is expanded', () => {
  const { card, list } = listCard();
  assert.equal(list.html.match(/<div class="row" role="button" tabindex="0" aria-expanded="false">/g)?.length, 2);
  card._expandedId = '2';
  card._render();
  assert.match(list.html, /data-id="2"><div class="row" role="button" tabindex="0" aria-expanded="true">/);
  assert.match(list.html, /data-id="1"><div class="row" role="button" tabindex="0" aria-expanded="false">/);
});

test('Enter and Space on a list station row expand and collapse it, other keys do nothing', () => {
  const { card, list } = listCard();
  for (const [key, expected] of [['Enter', '1'], [' ', null], ['a', null], ['Tab', null]]) {
    const k = keyOnRow(list, '1', key);
    card._onListKey(k.ev);
    assert.equal(card._expandedId, expected, key);
    assert.equal(k.prevented(), key === 'Enter' || key === ' ', key);
  }
  // Keys typed on a link of the expanded details (Enter on "Directions") never toggle the station.
  card._expandedId = '1';
  const link = { closest: (sel) => (sel === '.station' ? list.querySelectorAll('.station')[0] : null) };
  card._onListKey({ key: 'Enter', target: link, preventDefault() { throw new Error('prevented'); } });
  assert.equal(card._expandedId, '1');
});

test('the focused list station row keeps the focus when the list is redrawn', () => {
  const { card, list, focused } = listCard();
  const k = keyOnRow(list, '2', 'Enter');
  card._root.activeElement = k.row;
  card._onListKey(k.ev);
  assert.deepEqual(focused, ['2']);
  // Nothing focused in the card (or focus elsewhere): a redraw moves no focus.
  card._root.activeElement = null;
  card._expandedId = null;
  card._render();
  assert.deepEqual(focused, ['2']);
});

test('giving the focus back to the redrawn row does not scroll the page', () => {
  const { card, list, focused, focusOptions } = listCard();
  const k = keyOnRow(list, '2', 'Enter');
  card._root.activeElement = k.row;
  card._onListKey(k.ev);
  assert.deepEqual(focused, ['2']);
  assert.deepEqual({ ...focusOptions[0] }, { preventScroll: true });
});

test('no focus() call in the cards may scroll the page', () => {
  // Every focus() the cards make (row given back after a redraw, search field after clearing it) keeps the scroll.
  const calls = [...source.matchAll(/\.focus\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(calls.length >= 2);
  for (const args of calls) assert.equal(args.replace(/\s+/g, ' '), '{ preventScroll: true }');
});

test('the focused row of a station that is gone after a redraw does not fail', () => {
  const { card, list, focused } = listCard();
  const k = keyOnRow(list, '2', 'Enter');
  card._root.activeElement = k.row;
  card._lastState = { ...card._lastState, attributes: { ...card._lastState.attributes, stations: [station(1, 1.8, 1.7)] } };
  card._render();
  assert.deepEqual(focused, []);
});

const styles = (Card) => Card._styles().replace(/\s+/g, ' ');
// The reduced motion block, which must come after every rule it overrides (same specificity: the last one wins).
const reducedMotion = (css) => {
  const at = css.indexOf('@media (prefers-reduced-motion: reduce)');
  if (at === -1) return '';
  const rest = css.slice(at);
  assert.doesNotMatch(rest.slice(rest.indexOf('} }')), /(\.chevron|\.refresh-btn\.spinning ha-icon|\.locate\.busy ha-icon) \{/, 'a rule after the reduced motion block');
  return rest.slice(0, rest.indexOf('} }'));
};

test('the spinning and pulsing icons and the chevron stop when the system asks for reduced motion', () => {
  const list = reducedMotion(styles(CarburantsFranceCard));
  assert.match(list, /\.refresh-btn\.spinning ha-icon \{[^}]*animation: none/);
  assert.match(list, /\.chevron \{[^}]*transition: none/);
  const map = reducedMotion(styles(CarburantsFranceMapCard));
  assert.match(map, /\.locate\.busy ha-icon \{[^}]*animation: none/);
});

test('the Leaflet controls of the map card follow the theme (no hard-coded colours)', () => {
  const css = styles(CarburantsFranceMapCard);
  assert.doesNotMatch(css, /\.carb-fs a \{[^}]*#333/);
  assert.match(css, /\.leaflet-bar a \{[^}]*background-color: var\(--card-background-color[^}]*color: var\(--primary-text-color/);
  assert.match(css, /\.leaflet-bar a:hover, \.leaflet-bar a:focus \{[^}]*background-color: var\(--secondary-background-color/);
  assert.match(css, /\.leaflet-touch \.leaflet-bar \{[^}]*border-color: var\(--divider-color/);
  assert.match(css, /\.leaflet-container \.leaflet-control-attribution \{[^}]*background: color-mix\([^)]*var\(--card-background-color[^}]*color: var\(--primary-text-color/);
  assert.match(css, /\.leaflet-container \.leaflet-control-attribution a \{[^}]*color: /);
});

test('the map card search bar lines up with the header, and the position halo follows the primary colour', () => {
  const css = styles(CarburantsFranceMapCard);
  assert.match(css, /\.header \{[^}]*padding: 12px 12px 8px/);
  assert.match(css, /\.searchbar \{ padding: 0 12px 8px; \}/);
  assert.doesNotMatch(css, /rgba\(3,169,244/);
  assert.match(css, /\.me \{[^}]*box-shadow: 0 0 0 6px color-mix\(in srgb, var\(--primary-color, #03a9f4\) 25%, transparent\)/);
});

test('the station count agrees with its number (Polish one / few / many, Italian, Dutch and Portuguese singular)', () => {
  const plural = (lang, n) => context.carbPlural(context.CarburantsI18n[lang], 'stations', n, lang);
  assert.equal(plural('pl', '1'), 'stacja');
  assert.equal(plural('pl', '3'), 'stacje');
  assert.equal(plural('pl', '22'), 'stacje');
  assert.equal(plural('pl', '5'), 'stacji');
  assert.equal(plural('pl', '12'), 'stacji');
  assert.equal(plural('it', '1'), 'stazione');
  assert.equal(plural('it', '2'), 'stazioni');
  assert.equal(plural('nl', '1'), 'tankstation');
  assert.equal(plural('pt', '1'), 'posto');
  assert.equal(context.carbPlural(context.CarburantsI18n.pt, 'stations', '0', 'pt-PT'), 'postos');
  // French and English have their singular too (review pass 9).
  assert.equal(plural('fr', '1'), 'station');
  assert.equal(plural('en', '1'), 'station');
});

test('Italian, Dutch and Portuguese name the next opening day inside the sentence', () => {
  const monday = { hours: week({ 1: [['06:00', '20:00']] }) };
  const thu = at('2026-10-29T12:00:00');
  const mon = (locale) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(at('2026-11-02T12:00:00'));
  assert.equal(carbOpening(monday, context.CarburantsI18n.it, thu, 'it').text, `Chiuso · apre ${mon('it')} alle 06:00`);
  assert.equal(carbOpening(monday, context.CarburantsI18n.nl, thu, 'nl').text, `Gesloten · opent ${mon('nl')} om 06:00`);
  assert.equal(carbOpening(monday, context.CarburantsI18n.pt, thu, 'pt-PT').text, `Fechado · abre ${mon('pt-PT')} às 06:00`);
  // Tomorrow: no day name, the plain "opens at".
  const friday = { hours: week({ 5: [['06:00', '20:00']] }) };
  assert.equal(carbOpening(friday, context.CarburantsI18n.it, thu, 'it').text, 'Chiuso · apre alle 06:00');
});

test('carbLocale: Home Assistant\'s full locale for a variant of the card language, else the card language (pt → pt-PT)', () => {
  assert.equal(carbLocale({ locale: { language: 'pt-BR' } }), 'pt-BR');
  assert.equal(carbLocale({ locale: { language: 'pt' } }), 'pt-PT');
  assert.equal(carbLocale({ locale: { language: 'en' } }, 'pt'), 'pt-PT');
  assert.equal(carbLocale({ locale: { language: 'fr-CA' } }), 'fr-CA');
  assert.equal(carbLocale({ language: 'de-CH' }), 'de-CH');
  // The language option still wins: French numbers on a French card, whatever Home Assistant's language.
  assert.equal(carbLocale({ locale: { language: 'de-DE' } }, 'fr'), 'fr');
  assert.equal(carbLocale({ locale: { language: 'sr-Latn' } }, 'sr'), 'sr');
  assert.equal(carbLocale({ locale: { language: 'ja' } }), 'en');
});

// ── Review pass 9 ─────────────────────────────────────────────────────────────

test('the station count is singular for 1 in every language, and Serbian has its 2-4 form', () => {
  const plural = (lang, n) => context.carbPlural(context.CarburantsI18n[lang], 'stations', String(n), lang);
  const expected = {
    fr: { 1: 'station', 2: 'stations', 5: 'stations', 21: 'stations', 22: 'stations' },
    en: { 1: 'station', 2: 'stations', 5: 'stations', 21: 'stations', 22: 'stations' },
    de: { 1: 'Tankstelle', 2: 'Tankstellen', 5: 'Tankstellen', 21: 'Tankstellen', 22: 'Tankstellen' },
    es: { 1: 'estación', 2: 'estaciones', 5: 'estaciones', 21: 'estaciones', 22: 'estaciones' },
    it: { 1: 'stazione', 2: 'stazioni', 5: 'stazioni', 21: 'stazioni', 22: 'stazioni' },
    nl: { 1: 'tankstation', 2: 'tankstations', 5: 'tankstations', 21: 'tankstations', 22: 'tankstations' },
    pt: { 1: 'posto', 2: 'postos', 5: 'postos', 21: 'postos', 22: 'postos' },
    pl: { 1: 'stacja', 2: 'stacje', 5: 'stacji', 21: 'stacji', 22: 'stacje' },
    sr: { 1: 'станица', 2: 'станице', 5: 'станица', 21: 'станица', 22: 'станице' },
    'sr-Latn': { 1: 'stanica', 2: 'stanice', 5: 'stanica', 21: 'stanica', 22: 'stanice' },
  };
  for (const [lang, forms] of Object.entries(expected)) {
    for (const [n, word] of Object.entries(forms)) assert.equal(plural(lang, n), word, `${lang} ${n}`);
  }
  // French counts 0 as one ("0 station"), English does not.
  assert.equal(plural('fr', 0), 'station');
  assert.equal(plural('en', 0), 'stations');
});

// The list card's header and list, rendered for a sensor state (stub shadow root, as listCard).
const listFor = (state, lang = 'en') => {
  const node = () => ({ innerHTML: '', hidden: false, querySelector: () => null, querySelectorAll: () => [] });
  const parts = { '.header': node(), '.list': node(), '.footer': node() };
  const card = Object.assign(Object.create(CarburantsFranceCard.prototype), {
    _root: { querySelector: (sel) => parts[sel] ?? null, activeElement: null },
  });
  card.setConfig({ entity: 'sensor.x', language: lang, show_logo: false });
  card.hass = { language: 'en', states: { 'sensor.x': state } };
  const sub = parts['.header'].innerHTML.match(/<div class="hsub">([^<]*)<\/div>/)?.[1];
  return { sub, list: parts['.list'].innerHTML };
};

test('an unavailable or unknown sensor says the data is unavailable, never "unavailable stations"', () => {
  for (const value of ['unavailable', 'unknown']) {
    for (const lang of ['fr', 'en', 'pl', 'sr-Latn']) {
      const t = context.CarburantsI18n[lang];
      const { sub, list } = listFor({ state: value, attributes: { friendly_name: 'Stations' } }, lang);
      assert.equal(sub, t.unavailable, `${value} ${lang}`);
      assert.doesNotMatch(sub, /unavailable stations|unknown/);
      assert.ok(list.includes(`<div class="empty">${context.carbEsc(t.unavailable_hint)}</div>`), `${value} ${lang}`);
      assert.ok(!list.includes(context.carbEsc(t.empty)));
    }
  }
  assert.equal(listFor({ state: 'unavailable', attributes: {} }, 'fr').sub, 'Données indisponibles');
});

test('a sensor with no station left still counts them and says there is none to show', () => {
  const { sub, list } = listFor({ state: '0', attributes: { fuels: [], stations: [] } }, 'en');
  assert.equal(sub, '0 stations');
  assert.match(list, /No station to show/);
  assert.equal(listFor({ state: '1', attributes: { fuels: fuels.map((f) => ({ ...f, name: f.key })), stations: [station(1, 1.8, 1.7)] } }, 'en').sub, '1 station');
});

test('the map card says the data is unavailable when the sensor is, outside a search', () => {
  const realLoad = context.carbLoadLeaflet;
  context.carbLoadLeaflet = () => new Promise(() => {});
  try {
    const message = { hidden: true, textContent: '' };
    const map = { style: {}, classList: { toggle() {} } };
    const make = (state, results = null) => {
      const card = Object.assign(Object.create(CarburantsFranceMapCard.prototype), {
        _root: { querySelector: (sel) => ({ '.message': message, '.map': map })[sel] ?? null },
        _ensureShell() {},
        _renderHeader() {},
        _renderSearchbar() {},
        _reloadTilesIfNeeded() {},
        _darkTiles: () => false,
        _lastState: state,
        _results: results,
      });
      card._config = { height: 400, language: 'fr' };
      card._hass = { language: 'fr', states: {} };
      card._update();
      return message;
    };
    make({ state: 'unavailable', attributes: {} });
    assert.equal(message.hidden, false);
    assert.equal(message.textContent, context.CarburantsI18n.fr.unavailable_hint);
    // A search shows its own results, whatever the sensor.
    make({ state: 'unavailable', attributes: {} }, { mode: 'city', stations: [station(1, 1.8, 1.7)] });
    assert.equal(message.hidden, true);
    make({ state: '2', attributes: { stations: [] } });
    assert.equal(message.hidden, true);
  } finally {
    context.carbLoadLeaflet = realLoad;
  }
});

// Status texts (open, closed, out of stock, best price) on the card background: the state colour mixed with the
// text colour, so they reach 4.5:1 in light and dark themes; borders, pins and icons keep the plain state colour.
test('status texts mix their state colour with the text colour (contrast), borders keep the plain colour', () => {
  const list = styles(CarburantsFranceCard);
  const map = styles(CarburantsFranceMapCard);
  for (const css of [list, map]) {
    for (const [name, pct] of [['success', 55], ['info', 55], ['error', 55], ['warning', 50]]) {
      assert.match(css, new RegExp(`--carb-${name}-text: color-mix\\(in srgb, var\\(--${name}-color, #[0-9a-f]+\\) ${pct}%, var\\(--primary-text-color, #212121\\)\\)`), name);
    }
  }
  assert.match(list, /\.opening\.open, \.opening\.always \{ color: var\(--carb-success-text\); \}/);
  assert.match(list, /\.opening\.automate \{ color: var\(--carb-info-text\); \}/);
  assert.match(list, /\.opening\.closed \{ color: var\(--carb-error-text\); \}/);
  assert.match(list, /\.fuel\.best \.fprice, \.fuel\.best \.fname ha-icon \{ color: var\(--carb-success-text\); \}/);
  assert.match(list, /\.fuel\.out \.fprice \{[^}]*color: var\(--carb-warning-text\)/);
  assert.match(list, /\.fuel\.best \{ border-color: var\(--success-color, #43a047\)/);
  assert.match(list, /\.fuel\.out \{ border-color: var\(--warning-color, #ffa600\)/);
  // No faded out of stock tile: opacity would bring the text back under 4.5:1.
  assert.doesNotMatch(list, /\.fuel\.out \{[^}]*opacity/);
  assert.match(map, /\.popening\.open, \.popening\.always \{ color: var\(--carb-success-text\); \}/);
  assert.match(map, /\.popening\.automate \{ color: var\(--carb-info-text\); \}/);
  assert.match(map, /\.popening\.closed \{ color: var\(--carb-error-text\); \}/);
  assert.match(map, /\.popup b\.best \{ color: var\(--carb-success-text\); \}/);
  assert.match(map, /\.popup \.out \{ color: var\(--carb-warning-text\);/);
  assert.match(map, /\.pin\.best \{ border-color: var\(--success-color, #43a047\); color: var\(--carb-success-text\); \}/);
  assert.match(map, /\.pin\.out \{ border-color: var\(--warning-color, #ffa600\); color: var\(--carb-warning-text\); \}/);
  // Nothing left that writes text in a plain state colour.
  for (const css of [list, map]) {
    assert.doesNotMatch(css.replace(/border-color: var\(--[a-z]+-color[^;]*;/g, ''), /[^-]color: var\(--(success|info|error|warning)-color/);
  }
});

test('the map attribution keeps Leaflet\'s small print, whatever the card font size', () => {
  assert.match(styles(CarburantsFranceMapCard), /\.leaflet-container \.leaflet-control-attribution \{[^}]*font-size: 11px/);
});

test('narrow card: the title keeps a few letters and the header buttons wrap rather than leave the card', () => {
  const list = styles(CarburantsFranceCard);
  const map = styles(CarburantsFranceMapCard);
  // List card: the title block grows from 0 but never below the icon and 5 letters; the refresh button never shrinks.
  assert.match(list, /\.header \{[^}]*flex-wrap: wrap/);
  assert.match(list, /\.title \{[^}]*flex: 1 1 0[^}]*\}/);
  assert.doesNotMatch(list, /\.title \{[^}]*min-width: 0/);
  // Basis 0, not auto: a long title must not take the room of the refresh button or wrap it needlessly.
  assert.match(list, /\.titles \{[^}]*flex: 1 1 0; min-width: 5ch; contain: inline-size/);
  assert.doesNotMatch(list, /\.titles \{[^}]*flex: 1 1 auto/);
  assert.match(list, /\.refresh-btn \{ flex: none;/);
  // The subtitle (station count, "Data unavailable") wraps rather than being cut: "Podaci nisu dostupni" at 234 px.
  assert.match(list, /\.hsub \{[^}]*white-space: normal/);
  assert.doesNotMatch(list, /\.hsub \{[^}]*(nowrap|ellipsis)/);
  // Map card: same for the title, the radius and "locate me" tools stay whole.
  assert.match(map, /\.header \{[^}]*flex-wrap: wrap/);
  assert.match(map, /\.hname \{[^}]*flex: 1 1 0; min-width: 5ch/);
  assert.match(map, /\.tools \{[^}]*flex: none/);
  assert.match(map, /\.locate \{[^}]*flex: none/);
});

test('narrow list card: the fuel tiles, opening status and details reflow instead of leaving the card', () => {
  const list = styles(CarburantsFranceCard);
  assert.match(list, /ha-card \{[^}]*container: carb-card \/ inline-size/);
  const narrow = list.slice(list.indexOf('@container carb-card (max-width: 299px)'));
  assert.ok(narrow.length > 0 && list.includes('@container carb-card (max-width: 299px)'));
  // !important: the column count is an inline style set by carbFuelColumns.
  assert.match(narrow, /\.fuels \{ grid-template-columns: repeat\(auto-fill, minmax\(88px, 1fr\)\) !important; margin-left: 0; \}/);
  assert.match(narrow, /\.details \{ margin-left: 0; \}/);
  assert.match(narrow, /\.opening \{ white-space: normal; \}/);
  assert.match(narrow, /\.line1 \{ flex-flow: column nowrap; align-items: stretch; gap: 0; \}/);
  // The tiles flow freely there: an empty slot (fuel not sold) would leave a hole in the grid.
  assert.match(narrow, /\.fuel\.empty \{ display: none; \}/);
  // List card: at least 9 of 12 columns (~240 px), where the station names stay readable; the map card (header
  // tools wrapping) still fits half a section.
  assert.equal(CarburantsFranceCard.prototype.getGridOptions().min_columns, 9);
  assert.equal(CarburantsFranceMapCard.prototype.getGridOptions().min_columns, 6);
});

test('the list card keeps a usable width in a container sized by its content, and still shrinks in a 1fr 1fr grid', () => {
  // ha-card is an inline-size container, so it has no width of its own: an inline-block or `auto` grid column
  // would shrink the card to its padding. A min-width (or contain-intrinsic-*) on the host would be a minimum:
  // in a `1fr 1fr` grid (layout-card, grid card, horizontal stack) the card would then overflow its track.
  const list = styles(CarburantsFranceCard);
  assert.match(list, /ha-card \{[^}]*container: carb-card \/ inline-size/);
  const hostRules = [...list.matchAll(/:host \{([^}]*)\}/g)].map((m) => m[1]).join(';');
  assert.doesNotMatch(hostRules, /min-width: *[1-9]\d*px/);
  assert.doesNotMatch(list, /contain-intrinsic-/);
  // The natural width comes from an empty grid pseudo-element whose only track is minmax(0, N px): its
  // max-content width is N px (inline-block, `auto` column) and its min-content width is 0 (1fr track, card
  // wrapped in a div or not), with no height.
  const before = list.match(/:host::before \{([^}]*)\}/)?.[1] ?? '';
  assert.match(before, /content: "";/);
  assert.match(before, /display: grid;/);
  assert.match(before, /height: 0;/);
  const natural = Number(before.match(/grid-template-columns: minmax\(0, (\d+)px\)/)?.[1]);
  // Below the narrowest width the Sections view gives it (9 of 12 columns on a 320 px phone section: 234 px).
  assert.ok(natural >= 200 && natural <= 234, `natural width ${natural}`);
});

test('the map card keeps a usable width in a container sized by its content, and still shrinks in a 1fr 1fr grid', () => {
  // The search field had no width: its intrinsic width (~20 characters) set the card's min-content width
  // (277 px), so in a `1fr 1fr` grid (layout-card, custom grids) the card overflowed its track by 62-242 px.
  // `flex: 1; min-width: 0` does not lower that min-content contribution, `width: 0` does.
  const map = styles(CarburantsFranceMapCard);
  assert.match(map, /\.search input \{[^}]*width: 0;[^}]*flex: 1 1 auto;[^}]*min-width: 0;/);
  const hostRules = [...map.matchAll(/:host \{([^}]*)\}/g)].map((m) => m[1]).join(';');
  assert.doesNotMatch(hostRules, /min-width: *[1-9]\d*px/);
  assert.doesNotMatch(map, /contain-intrinsic-/);
  // With no intrinsic width left, the natural width (inline-block, `auto` column) comes from an empty grid
  // pseudo-element: max-content N px, min-content 0, no height.
  const before = map.match(/:host::before \{([^}]*)\}/)?.[1] ?? '';
  assert.match(before, /content: "";/);
  assert.match(before, /display: grid;/);
  assert.match(before, /height: 0;/);
  const natural = Number(before.match(/grid-template-columns: minmax\(0, (\d+)px\)/)?.[1]);
  assert.ok(natural >= 240 && natural <= 320, `natural width ${natural}`);
});

test('auto-detection finds an unavailable stations sensor from the entity registry (no attributes then)', () => {
  const hass = {
    states: {
      'sensor.other': { state: '3', attributes: {} },
      'sensor.carburants_stations': { state: 'unavailable', attributes: { friendly_name: 'Stations' } },
    },
    entities: {
      'sensor.other': { entity_id: 'sensor.other', platform: 'other', translation_key: 'stations' },
      'sensor.carburants_gazole_best': { entity_id: 'sensor.carburants_gazole_best', platform: 'carburants_france', translation_key: 'best_price' },
      'sensor.carburants_stations': { entity_id: 'sensor.carburants_stations', platform: 'carburants_france', translation_key: 'stations' },
    },
  };
  assert.equal(CarburantsFranceCard._findEntity(hass), 'sensor.carburants_stations');
  assert.equal(CarburantsFranceCard.getStubConfig(hass).entity, 'sensor.carburants_stations');
  // An available sensor with its attributes still wins, and an old HA without hass.entities finds nothing more.
  const live = { state: '2', attributes: { stations: [], fuels: [], config_entry_id: 'x' } };
  assert.equal(CarburantsFranceCard._findEntity({ ...hass, states: { ...hass.states, 'sensor.live': live } }), 'sensor.live');
  assert.equal(CarburantsFranceCard._findEntity({ states: hass.states }), null);
  // Registry entry without a state (entity removed): not picked.
  assert.equal(CarburantsFranceCard._findEntity({ states: {}, entities: hass.entities }), null);
  // The list card then says the data is unavailable instead of "sensor not found".
  const node = () => ({ innerHTML: '', hidden: false, querySelector: () => null, querySelectorAll: () => [] });
  const parts = { '.header': node(), '.list': node(), '.footer': node() };
  const card = Object.assign(Object.create(CarburantsFranceCard.prototype), {
    _root: { querySelector: (sel) => parts[sel] ?? null, activeElement: null },
  });
  card.setConfig({ language: 'en', show_logo: false });
  card.hass = { language: 'en', ...hass };
  assert.match(parts['.header'].innerHTML, /<div class="hsub">Data unavailable<\/div>/);
});

// ── Romanian, Danish, Swedish, Bulgarian, Russian, Ukrainian, Hungarian, Slovak, Czech, Slovenian, Latvian, Greek ──

test('carbLang: the 12 new languages, with their regional variants', () => {
  const lang = (code) => carbLang({ locale: { language: code } });
  for (const code of NEW_LANGS) {
    assert.equal(lang(code), code);
    assert.equal(lang(`${code}-XX`), code);
    assert.equal(carbLang({ locale: { language: 'en' } }, code), code);
  }
  assert.equal(lang('ro-MD'), 'ro');
  assert.equal(lang('sv-FI'), 'sv');
  assert.equal(lang('el-CY'), 'el');
});

test('the editors offer the 12 new languages, each in its own name, after Polish', () => {
  const options = carbLanguageOptions('auto');
  const labels = Object.fromEntries(options.map((o) => [o.value, o.label]));
  const expected = {
    ro: 'Română', da: 'Dansk', sv: 'Svenska', bg: 'Български', ru: 'Русский', uk: 'Українська', hu: 'Magyar',
    sk: 'Slovenčina', cs: 'Čeština', sl: 'Slovenščina', lv: 'Latviešu', el: 'Ελληνικά',
  };
  for (const [code, label] of Object.entries(expected)) assert.equal(labels[code], label, code);
  const values = options.map((o) => o.value);
  assert.deepEqual([...values.slice(values.indexOf('pl') + 1, values.indexOf('sr'))], NEW_LANGS);
});

test('the station count agrees with its number in the 12 new languages', () => {
  const plural = (lang, n) => context.carbPlural(context.CarburantsI18n[lang], 'stations', String(n), lang);
  const expected = {
    ro: { 1: 'stație', 2: 'stații', 19: 'stații', 20: 'de stații', 101: 'stații' },
    da: { 1: 'tankstation', 2: 'tankstationer' },
    sv: { 1: 'station', 2: 'stationer' },
    bg: { 1: 'бензиностанция', 2: 'бензиностанции' },
    ru: { 1: 'АЗС', 5: 'АЗС' },
    uk: { 1: 'АЗС', 5: 'АЗС' },
    hu: { 1: 'töltőállomás', 5: 'töltőállomás' },
    sk: { 1: 'stanica', 2: 'stanice', 4: 'stanice', 5: 'staníc' },
    cs: { 1: 'stanice', 2: 'stanice', 4: 'stanice', 5: 'stanic' },
    sl: { 1: 'postaja', 2: 'postaji', 3: 'postaje', 5: 'postaj', 101: 'postaja', 102: 'postaji' },
    lv: { 1: 'stacija', 2: 'stacijas', 21: 'stacija', 22: 'stacijas' },
    el: { 1: 'πρατήριο', 2: 'πρατήρια' },
  };
  for (const [lang, forms] of Object.entries(expected)) {
    for (const [n, word] of Object.entries(forms)) assert.equal(plural(lang, n), word, `${lang} ${n}`);
  }
});

test('the 12 new languages name the next opening day inside the sentence', () => {
  const monday = { hours: week({ 1: [['06:00', '20:00']] }) };
  const thu = at('2026-10-29T12:00:00');
  for (const lang of NEW_LANGS) {
    const t = context.CarburantsI18n[lang];
    const text = carbOpening(monday, t, thu, lang).text;
    const day = new Intl.DateTimeFormat(lang, { weekday: 'short' }).format(at('2026-11-02T12:00:00'));
    assert.equal(text, `${t.closed} · ${t.opens_on.replace('{d}', day).replace('{t}', '06:00')}`, lang);
  }
});

test('the Cyrillic and Greek languages have no Latin word left, except names, units and placeholders', () => {
  const allowed = /Home Assistant|Carburants France|OpenStreetMap( France)?|OpenTopoMap|CyclOSM|Esri|IGN|URL|entity|km|px|\{\w+\}/g;
  for (const lang of ['bg', 'ru', 'uk', 'el']) {
    for (const i18n of [context.CarburantsI18n, context.CarburantsMapI18n]) {
      for (const text of strings(i18n[lang])) assert.doesNotMatch(text.replace(allowed, ''), /[A-Za-z]/, `${lang}: ${text}`);
    }
  }
});
