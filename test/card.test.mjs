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
vm.runInContext(`${source}\nthis.carb = { carbBestPrices, carbVisibleStations, carbSetSchema, CarburantsFranceCard, CarburantsFranceMapCard };`, context);
const { carbBestPrices, carbVisibleStations, carbSetSchema, CarburantsFranceCard, CarburantsFranceMapCard } = context.carb;

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
