// The map card with a Leaflet stand-in: map built once, tiles (Home Assistant's proxy, fallback, custom), markers,
// out-of-stock toggle, popup kept over a redraw, nearby search area, home and fit. No browser needed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
// The frontend files as scripts/build-frontend.mjs assembles them from their ES modules in src/.
import { bundle } from '../scripts/bundle.mjs';

// The card file's name, for the coverage report (assembled from src/ by scripts/build-frontend.mjs).
const url = new URL('../custom_components/carburants_france/frontend/carburants-france-card.js', import.meta.url);
const context = {
  HTMLElement: class {},
  customElements: { get: () => true, define() {} },
  window: {},
  navigator: { language: 'en' },
  document: { addEventListener() {}, removeEventListener() {} },
  console,
  setTimeout: () => 0,
  clearTimeout() {},
  setInterval: () => 0,
  clearInterval() {},
};
vm.createContext(context);
vm.runInContext(`${bundle('src/carburants-france-card/index.js')}\nthis.carb = { CarburantsFranceMapCard, CARBURANTS_MAP_DEFAULTS };`, context, { filename: fileURLToPath(url) });
const { CarburantsFranceMapCard, CARBURANTS_MAP_DEFAULTS } = context.carb;
const tick = () => new Promise((r) => setTimeout(r, 0));

// Leaflet stand-in: records what the card builds.
function fakeLeaflet() {
  const log = { maps: [], tiles: [], markers: [], circles: [], controls: [] };
  class Layer {
    addTo(target) {
      (target._children ??= []).push(this);
      this._parent = target;
      return this;
    }
    remove() {
      this.removed = true;
    }
  }
  class LayerGroup extends Layer {
    constructor() {
      super();
      this._children = [];
    }
    eachLayer(fn) {
      this._children.forEach(fn);
    }
    clearLayers() {
      this._children = [];
    }
  }
  class Marker extends Layer {
    constructor(latlng, options) {
      super();
      this.latlng = latlng;
      this.options = options;
      this.open = false;
      log.markers.push(this);
    }
    bindPopup(html, opts) {
      this.popup = { html, opts };
      return this;
    }
    isPopupOpen() {
      return this.open;
    }
    openPopup() {
      this.open = true;
      this.reopened = true;
    }
  }
  class Bounds {
    constructor(points) {
      this.points = [...points];
    }
    extend(b) {
      this.points.push(...(b.points || []));
      return this;
    }
    getCenter() {
      return this.points[0];
    }
  }
  const L = {
    map(el, options) {
      const map = {
        el,
        options,
        _children: [],
        removeLayer(layer) {
          layer.removed = true;
        },
        closePopup() {},
        invalidateSize() {},
        fitBounds(b, o) {
          this.fitted = { b, o };
        },
        setView(c, z) {
          this.view = { c, z };
        },
      };
      log.maps.push(map);
      return map;
    },
    layerGroup: () => new LayerGroup(),
    tileLayer(u, options) {
      const t = new Layer();
      t._url = u;
      t.options = options;
      t.bringToBack = () => {};
      t.setUrl = (v) => (t._url = v);
      log.tiles.push(t);
      return t;
    },
    divIcon: (o) => o,
    marker: (ll, o) => new Marker(ll, o),
    circle(ll, o) {
      const c = new Layer();
      c.latlng = ll;
      c.options = o;
      c.getBounds = () => new Bounds([[ll[0] - 0.1, ll[1] - 0.1], [ll[0] + 0.1, ll[1] + 0.1]]);
      log.circles.push(c);
      return c;
    },
    latLngBounds: (points) => new Bounds(points),
    Control: {
      extend(proto) {
        return class extends Layer {
          constructor(options) {
            super();
            this.options = options;
            this._el = proto.onAdd();
            log.controls.push(this);
          }
          getContainer() {
            return this._el;
          }
        };
      },
    },
    control: { zoom: (o) => Object.assign(new Layer(), { options: o }) },
    DomUtil: { create: (tag, cls) => ({ tag, className: cls, hidden: false, textContent: '', setAttribute() {} }) },
    DomEvent: { disableClickPropagation() {}, on() {}, preventDefault() {} },
  };
  return { L, log };
}

const fuels = [{ key: 'gazole', name: 'Gazole' }, { key: 'e10', name: 'SP95-E10' }];
const station = (id, lat, gazole, e10) => ({
  station_id: id,
  station_name: `Station ${id}`,
  brand: 'Total',
  latitude: lat,
  longitude: -1.68,
  fuels: {
    gazole: gazole == null ? { available: false, rupture: 'temporaire' } : { available: true, price: gazole },
    e10: e10 == null ? { available: false, rupture: 'temporaire' } : { available: true, price: e10 },
  },
});
const STATIONS = [station(1, 48.1, 1.8, 1.7), station(2, 48.12, 1.75, null), station(3, 48.14, null, null), station(4, null, 1.6, 1.6)];

function mapCard(config = {}, { callWS } = {}) {
  const mapEl = { clientWidth: 400, classList: { toggle() {} }, style: {} };
  const card = Object.create(CarburantsFranceMapCard.prototype);
  Object.assign(card, {
    _config: { ...CARBURANTS_MAP_DEFAULTS, map_style: 'osm', ...config },
    _hass: {
      language: 'en',
      themes: { darkMode: false },
      states: { 'zone.home': { attributes: { latitude: 48.11, longitude: -1.67 } } },
      callWS: callWS || (() => Promise.resolve({ token: 'abc def' })),
    },
    _lastState: { attributes: { stations: STATIONS, fuels } },
    _root: { querySelector: (sel) => (sel === '.map' ? mapEl : null) },
    _renderHeader() {},
    _updateFullscreenButton() {},
    _renderLocate() {},
    _listenFullscreen() {},
  });
  return card;
}

test('map card: the map is built once, with its layer, toggle, tools and zoom', () => {
  const { L, log } = fakeLeaflet();
  const card = mapCard();
  card._ensureMap(L);
  card._ensureMap(L);
  assert.equal(log.maps.length, 1);
  assert.equal(log.maps[0].options.scrollWheelZoom, false);
  assert.ok(card._layer && card._toggle && card._tools && card._zoomCtl);
  assert.equal(card._tools.options.position, 'bottomright');
  assert.equal(card._toggle.options.position, 'bottomleft');
});

test('map card tiles: Home Assistant proxy with an encoded token, OpenStreetMap when it fails, custom URL', async () => {
  let { L, log } = fakeLeaflet();
  let card = mapCard();
  card._ensureMap(L);
  await tick();
  assert.equal(log.tiles.length, 1);
  assert.equal(log.tiles[0]._url, '/api/map_tiles/raster/{z}/{x}/{y}.png?token=abc%20def');
  assert.equal(log.tiles[0].options.maxZoom, 19);

  ({ L, log } = fakeLeaflet());
  card = mapCard({}, { callWS: () => Promise.reject(new Error('unknown command')) });
  card._ensureMap(L);
  await tick();
  await tick();
  assert.equal(log.tiles[0]._url, 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');

  ({ L, log } = fakeLeaflet());
  card = mapCard({ map_style: 'custom', tile_url: 'https://tiles.example/{z}/{x}/{y}.png', tile_attribution: 'Example' });
  card._ensureMap(L);
  await tick();
  assert.equal(log.tiles[0]._url, 'https://tiles.example/{z}/{x}/{y}.png');
  assert.equal(log.tiles[0].options.attribution, 'Example');
  // A custom style without URL is OpenStreetMap.
  assert.equal(mapCard({ map_style: 'custom' })._style(), 'osm');
});

test('map card markers: stations with coordinates, best price, out of stock hidden behind the toggle, home and fit', () => {
  const { L, log } = fakeLeaflet();
  const card = mapCard({ fuel: 'gazole' });
  card._ensureMap(L);
  card._drawMarkers(L);
  const pins = log.markers.filter((m) => m.options.stationId);
  // Station 4 has no coordinates; station 3 is out of stock and hidden.
  assert.deepEqual(pins.map((m) => m.options.stationId), ['1', '2']);
  const best = pins.find((m) => m.options.stationId === '2');
  assert.match(best.options.icon.html, /class="pin best"/);
  assert.equal(best.options.zIndexOffset, 1000);
  assert.match(pins[0].options.icon.html, /Station 1/);
  assert.ok(pins[0].popup.html.length > 0);
  assert.equal(card._toggle.getContainer().hidden, false);
  // Home marker, and the map fitted to the stations and home.
  const home = log.markers.find((m) => /class="home"/.test(m.options.icon.html));
  assert.deepEqual([...home.latlng], [48.11, -1.67]);
  assert.equal(card._bounds.points.length, 3);
  assert.ok(log.maps[0].fitted);
  assert.equal(card._fitted, true);

  // The toggle shows the out of stock stations too.
  log.markers.length = 0;
  card._showAll = true;
  card._drawMarkers(L);
  assert.deepEqual(log.markers.filter((m) => m.options.stationId).map((m) => m.options.stationId), ['1', '2', '3']);
});

test('map card: an open popup is opened again after a sensor update redraws the markers', () => {
  const { L, log } = fakeLeaflet();
  const card = mapCard();
  card._ensureMap(L);
  card._drawMarkers(L);
  log.markers.find((m) => m.options.stationId === '1').open = true;
  log.markers.length = 0;
  card._drawMarkers(L);
  const again = log.markers.find((m) => m.options.stationId === '1');
  assert.equal(again.reopened, true);
  assert.equal(log.markers.filter((m) => m.reopened).length, 1);
});

test('map card: a nearby search draws its area and starting point, without home, and fits them', () => {
  const { L, log } = fakeLeaflet();
  const card = mapCard({ zoom: 13 });
  card._results = { mode: 'near', latitude: 48.1, longitude: -1.7, radius: 5, stations: STATIONS.slice(0, 2), fuels };
  card._ensureMap(L);
  card._drawMarkers(L);
  assert.equal(log.circles.length, 1);
  assert.equal(log.circles[0].options.radius, 5000);
  assert.ok(log.markers.some((m) => /class="me"/.test(m.options.icon.html)));
  assert.ok(!log.markers.some((m) => /class="home"/.test(m.options.icon.html)));
  // zoom set: centred on the stations at that zoom rather than fitted.
  assert.equal(log.maps[0].view.z, 13);
});

test('map card: not laid out yet, the fit waits for the resize observer', () => {
  const { L } = fakeLeaflet();
  const card = mapCard();
  card._root.querySelector('.map').clientWidth = 0;
  card._ensureMap(L);
  card._drawMarkers(L);
  assert.equal(card._fitted, false);
});
