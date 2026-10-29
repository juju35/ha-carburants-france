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
vm.runInContext(`${source}\nthis.carb = { carbBestPrices, carbVisibleStations, carbSetSchema, carbOpening, carbLang, CarburantsFranceCard, CarburantsFranceMapCard };`, context);
const { carbBestPrices, carbVisibleStations, carbSetSchema, carbOpening, carbLang, CarburantsFranceCard, CarburantsFranceMapCard } = context.carb;

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
  assert.equal(carbLang({ language: 'it' }), 'en');
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
    assert.deepEqual(Object.keys(i18n).sort(), ['de', 'en', 'es', 'fr']);
    for (const lang of Object.keys(i18n)) {
      assert.deepEqual(shape(i18n[lang]), shape(i18n.en), lang);
      assert.deepEqual(placeholders(i18n[lang]), placeholders(i18n.en), lang);
    }
  }
});
