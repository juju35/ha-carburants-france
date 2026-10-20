var CARBURANTS_CARD_VERSION = '0.9.1';

// ── Integration icon (same drawing as brand/icon.png) ────────────────────────
var CARBURANTS_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">' +
  '<rect x="8" y="8" width="240" height="240" rx="56" fill="#0E7C66"/>' +
  '<g fill="none" stroke="#fff" stroke-width="14" stroke-linejoin="round" stroke-linecap="round">' +
  '<rect x="60" y="58" width="92" height="144" rx="12"/><path d="M78 92 H134"/>' +
  '<path d="M152 104 H170 a14 14 0 0 1 14 14 V172 a12 12 0 0 0 24 0 V102 L188 80"/>' +
  '<path d="M48 202 H164"/></g>' +
  '<rect x="78" y="78" width="56" height="30" rx="6" fill="#fff"/></svg>'
);

// The government open data page the prices come from.
var CARBURANTS_SOURCE_URL = 'https://data.economie.gouv.fr/explore/assets/prix-des-carburants-en-france-flux-instantane-v2/view/';

// ── i18n ──────────────────────────────────────────────────────────────────────
var CarburantsI18n = {
  fr: {
    default_title: 'Carburants',
    stations: 'stations',
    empty: 'Aucune station à afficher',
    no_entity: 'Capteur Stations introuvable. Ajoutez l\'intégration Carburants France ou renseignez « entity ».',
    refresh: 'Actualiser',
    refresh_failed: 'Actualisation impossible',
    open: 'Ouvert',
    closed: 'Fermé',
    closes_at: 'ferme à',
    opens_at: 'ouvre à',
    always_open: '24h/24',
    automate: 'Automate 24/24',
    out_of_stock: 'Rupture',
    no_price: 'Sans prix',
    no_price_hint: 'Ni prix ni rupture publiés pour l\'instant',
    rupture_ended: 'rupture levée',
    not_sold: 'Non vendu',
    since: 'depuis',
    best: 'Meilleur prix',
    updated: 'Mis à jour',
    hours: 'Horaires',
    services: 'Services',
    directions: 'Itinéraire',
    show_all_one: 'Afficher la station en rupture',
    show_all: 'Afficher les {n} stations en rupture',
    hide_out: 'Masquer les stations en rupture',
    all_out: 'Tous les carburants suivis sont en rupture dans ces stations.',
    highway: 'Autoroute',
    days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
    editor: {
      entity: 'Capteur Stations',
      title: 'Titre',
      fuels: 'Carburants affichés (tous si vide)',
      sort: 'Tri',
      sort_fuel: 'Carburant pour le tri par prix',
      max_stations: 'Nombre maximum de stations (0 = toutes)',
      show_icon: 'Icône',
      show_logo: 'Logos des enseignes',
      show_brand: 'Enseigne',
      show_address: 'Adresse',
      show_distance: 'Distance',
      show_hours: 'Ouverture',
      show_updated: 'Date des prix',
      show_out_of_stock: 'Carburants en rupture',
      highlight_best: 'Meilleur prix en vert',
      show_refresh: 'Bouton Actualiser',
      hide_out_of_stock_stations: 'Masquer les stations en rupture',
    },
    sort_options: { price: 'Prix', distance: 'Distance', name: 'Nom', config: 'Ordre de configuration' },
  },
  en: {
    default_title: 'Fuel',
    stations: 'stations',
    empty: 'No station to show',
    no_entity: 'Stations sensor not found. Add the Carburants France integration or set "entity".',
    refresh: 'Refresh',
    refresh_failed: 'Refresh failed',
    open: 'Open',
    closed: 'Closed',
    closes_at: 'closes at',
    opens_at: 'opens at',
    always_open: '24/7',
    automate: '24/7 pay at pump',
    out_of_stock: 'Out of stock',
    no_price: 'No price',
    no_price_hint: 'No price nor shortage published yet',
    rupture_ended: 'shortage lifted',
    not_sold: 'Not sold',
    since: 'since',
    best: 'Best price',
    updated: 'Updated',
    hours: 'Opening hours',
    services: 'Services',
    directions: 'Directions',
    show_all_one: 'Show the out of stock station',
    show_all: 'Show the {n} out of stock stations',
    hide_out: 'Hide out of stock stations',
    all_out: 'Every followed fuel is out of stock at these stations.',
    highway: 'Motorway',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    editor: {
      entity: 'Stations sensor',
      title: 'Title',
      fuels: 'Fuels shown (all when empty)',
      sort: 'Sort',
      sort_fuel: 'Fuel for price sorting',
      max_stations: 'Maximum stations (0 = all)',
      show_icon: 'Icon',
      show_logo: 'Brand logos',
      show_brand: 'Brand',
      show_address: 'Address',
      show_distance: 'Distance',
      show_hours: 'Opening status',
      show_updated: 'Price date',
      show_out_of_stock: 'Out of stock fuels',
      highlight_best: 'Best price in green',
      show_refresh: 'Refresh button',
      hide_out_of_stock_stations: 'Hide out of stock stations',
    },
    sort_options: { price: 'Price', distance: 'Distance', name: 'Name', config: 'Configuration order' },
  },
};

var CARBURANTS_DEFAULTS = {
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
};

function carbEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function carbLang(hass) {
  var lang = ((hass && (hass.locale && hass.locale.language || hass.language)) || navigator.language || 'en').slice(0, 2);
  return CarburantsI18n[lang] ? lang : 'en';
}

function carbTitleCase(s) {
  s = String(s || '');
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])\S/g, function (m) { return m.toUpperCase(); }) : s;
}

// Stable color per brand for the initials badge.
function carbBrandColor(name) {
  var palette = ['#1565c0', '#2e7d32', '#c62828', '#6a1b9a', '#ef6c00', '#00838f', '#4e342e', '#283593'];
  var h = 0;
  for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function carbInitials(name) {
  var words = String(name || '').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

// True when none of the fuels is in stock at the station (all in shortage, or not sold).
function carbAllOut(station, fuels) {
  return !fuels.some(function (f) {
    var fuel = station.fuels && station.fuels[f.key];
    return fuel && fuel.available;
  });
}

function carbToggleLabel(t, showAll, hidden) {
  if (showAll) return t.hide_out;
  return hidden === 1 ? t.show_all_one : t.show_all.replace('{n}', hidden);
}

// Calls onOutside for a click anywhere outside the element (shadow DOM aware). A click, not a
// pointerdown: collapsing on press would shift the layout under the pointer before the click.
function carbOutsideListener(element, onOutside) {
  return function (ev) {
    var path = ev.composedPath ? ev.composedPath() : [];
    if (path.indexOf(element) === -1) onOutside();
  };
}

// Logos of sub-brands that share their network's logo in Wikidata: inlined, so no external request.
// Total Access, cropped square from the brand's sign (96 px).
var CARBURANTS_TOTAL_ACCESS_LOGO = 'data:image/png;base64,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';
var CARBURANTS_BRAND_LOGOS = [
  { match: /\btotal\s*(energies)?\s*access\b/i, src: CARBURANTS_TOTAL_ACCESS_LOGO },
];

// The station's logo: { src, own }, own when the card ships it (it then replaces the sub-brand tag).
function carbLogo(s) {
  for (var i = 0; i < CARBURANTS_BRAND_LOGOS.length; i++) {
    if (CARBURANTS_BRAND_LOGOS[i].match.test(String(s.brand || ''))) return { src: CARBURANTS_BRAND_LOGOS[i].src, own: true };
  }
  return s.logo ? { src: s.logo, own: false } : null;
}

// Sub-brand of a network, shown as a tag on the logo: "Total Access" -> "Access".
// The logo alone cannot tell them apart (TotalEnergies and Total Access share it).
var CARBURANTS_SUB_BRAND = /\b(access|contact|express|market|city)\b/i;
function carbSubBrand(brand) {
  var match = CARBURANTS_SUB_BRAND.exec(String(brand || ''));
  return match ? match[1].toUpperCase() : '';
}

function carbMinutes(hhmm) {
  var p = String(hhmm).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
}

// Opening status from the feed's weekly hours: { key: open|closed|always|automate, text }.
function carbOpening(station, t, now) {
  var hours = station.hours || [];
  var day = now.getDay() === 0 ? 7 : now.getDay();
  var minutes = now.getHours() * 60 + now.getMinutes();
  var always = hours.length === 7 && hours.every(function (d) {
    return !d.closed && d.ranges.some(function (r) { return r[0] === '00:00' && carbMinutes(r[1]) >= 23 * 60 + 59; });
  });
  if (always) return { key: 'always', text: t.always_open };
  var today = hours.filter(function (d) { return d.day === day; })[0];
  if (today && !today.closed) {
    for (var i = 0; i < today.ranges.length; i++) {
      var r = today.ranges[i];
      if (minutes >= carbMinutes(r[0]) && minutes < carbMinutes(r[1])) {
        return { key: 'open', text: t.open + ' · ' + t.closes_at + ' ' + r[1] };
      }
    }
  }
  if (station.automate_24_24) return { key: 'automate', text: t.automate };
  if (!hours.length) return null;
  // Next opening today, else the next open day.
  if (today && !today.closed) {
    var later = today.ranges.filter(function (r) { return carbMinutes(r[0]) > minutes; })[0];
    if (later) return { key: 'closed', text: t.closed + ' · ' + t.opens_at + ' ' + later[0] };
  }
  for (var k = 1; k <= 7; k++) {
    var d = hours.filter(function (x) { return x.day === ((day - 1 + k) % 7) + 1; })[0];
    if (d && !d.closed && d.ranges.length) {
      var label = k === 1 ? '' : t.days[d.day - 1].slice(0, 3).toLowerCase() + '. ';
      return { key: 'closed', text: t.closed + ' · ' + t.opens_at + ' ' + label + d.ranges[0][0] };
    }
  }
  return { key: 'closed', text: t.closed };
}

function carbRelative(iso, locale) {
  var ts = Date.parse(iso || '');
  if (isNaN(ts)) return '';
  var seconds = (ts - Date.now()) / 1000;
  var units = [['day', 86400], ['hour', 3600], ['minute', 60]];
  var rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  for (var i = 0; i < units.length; i++) {
    if (Math.abs(seconds) >= units[i][1]) return rtf.format(Math.round(seconds / units[i][1]), units[i][0]);
  }
  return rtf.format(0, 'minute');
}

// ── carburants-france-card ────────────────────────────────────────────────────
class CarburantsFranceCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('carburants-france-card-editor');
  }

  static getStubConfig(hass) {
    var entity = CarburantsFranceCard._findEntity(hass);
    return entity ? { entity: entity } : {};
  }

  static _findEntity(hass) {
    if (!hass || !hass.states) return null;
    var ids = Object.keys(hass.states);
    for (var i = 0; i < ids.length; i++) {
      var st = hass.states[ids[i]];
      if (ids[i].indexOf('sensor.') === 0 && st.attributes && Array.isArray(st.attributes.stations) &&
          Array.isArray(st.attributes.fuels) && st.attributes.config_entry_id) {
        return ids[i];
      }
    }
    return null;
  }

  setConfig(config) {
    this._config = Object.assign({}, CARBURANTS_DEFAULTS, config || {});
    // Only one station is expanded at a time.
    this._expandedId = this._expandedId || null;
    this._lastState = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    var first = !this._hass;
    this._hass = hass;
    var entityId = this._entityId();
    var st = entityId ? hass.states[entityId] : null;
    if (first || st !== this._lastState) {
      this._lastState = st;
      this._render();
    }
  }

  connectedCallback() {
    // Opening status and price ages move with the clock.
    var self = this;
    this._timer = setInterval(function () { self._render(); }, 60000);
    // A click elsewhere collapses the station and hides the out of stock ones again.
    this._onOutside = this._onOutside || carbOutsideListener(this, function () {
      if (self._expandedId === null && !self._showAll) return;
      self._expandedId = null;
      self._showAll = false;
      self._render();
    });
    document.addEventListener('click', this._onOutside, true);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    document.removeEventListener('click', this._onOutside, true);
  }

  getCardSize() {
    var st = this._lastState;
    var n = st && st.attributes && Array.isArray(st.attributes.stations) ? st.attributes.stations.length : 0;
    return 1 + n * 2;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  _entityId() {
    return (this._config && this._config.entity) || CarburantsFranceCard._findEntity(this._hass);
  }

  _t() {
    return CarburantsI18n[carbLang(this._hass)];
  }

  _locale() {
    return (this._hass && this._hass.locale && this._hass.locale.language) || navigator.language || 'fr';
  }

  _ensureShell() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML =
      '<style>' + CarburantsFranceCard._styles() + '</style>' +
      '<ha-card><div class="header"></div><div class="list"></div><div class="footer" hidden></div></ha-card>';
    this._root.querySelector('.list').addEventListener('click', this._onListClick.bind(this));
    this._root.querySelector('.footer').addEventListener('click', function (ev) {
      if (!ev.target.closest('.toggle')) return;
      this._showAll = !this._showAll;
      this._render();
    }.bind(this));
  }

  _fuels() {
    var all = (this._lastState && this._lastState.attributes.fuels) || [];
    var wanted = this._config.fuels;
    if (!Array.isArray(wanted) || !wanted.length) return all;
    return all.filter(function (f) { return wanted.indexOf(f.key) !== -1; });
  }

  _render() {
    if (!this._config || !this._hass) return;
    this._ensureShell();
    var t = this._t();
    var st = this._lastState;
    var header = this._root.querySelector('.header');
    var list = this._root.querySelector('.list');
    var title = this._config.title || t.default_title;
    var icon = this._config.show_icon
      ? '<a class="icon-link" href="' + CARBURANTS_SOURCE_URL + '" target="_blank" rel="noopener" title="data.economie.gouv.fr">' +
        '<img class="icon" src="' + CARBURANTS_ICON + '" alt="data.economie.gouv.fr"></a>'
      : '';

    if (!st) {
      header.innerHTML = '<div class="title">' + icon + carbEsc(title) + '</div>';
      list.innerHTML = '<div class="empty">' + carbEsc(t.no_entity) + '</div>';
      return;
    }

    var fuels = this._fuels();
    var stations = (st.attributes.stations || []).slice();
    var best = this._bestPrices(stations, fuels);
    var hidden = this._config.hide_out_of_stock_stations
      ? stations.filter(function (s) { return carbAllOut(s, fuels); }).length
      : 0;
    if (hidden && !this._showAll) stations = stations.filter(function (s) { return !carbAllOut(s, fuels); });
    stations = this._sorted(stations, fuels);
    if (this._config.max_stations > 0) stations = stations.slice(0, this._config.max_stations);
    var footer = this._root.querySelector('.footer');
    footer.hidden = !hidden;
    footer.innerHTML = hidden
      ? '<button type="button" class="toggle"><ha-icon icon="' + (this._showAll ? 'mdi:eye-off-outline' : 'mdi:eye-outline') + '"></ha-icon>' +
        carbEsc(carbToggleLabel(t, this._showAll, hidden)) + '</button>'
      : '';

    header.innerHTML =
      '<div class="title">' + icon + carbEsc(title) +
      ' <span class="count">' + carbEsc(st.state) + ' ' + carbEsc(t.stations) + '</span></div>' +
      (this._config.show_refresh
        ? '<ha-icon-button class="refresh-btn' + (this._refreshing ? ' spinning' : '') + '" label="' + carbEsc(t.refresh) +
          '" title="' + carbEsc(t.refresh) + '"><ha-icon icon="mdi:refresh"></ha-icon></ha-icon-button>'
        : '');
    var refreshBtn = header.querySelector('.refresh-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', this._refresh.bind(this));

    if (!stations.length) {
      list.innerHTML = '<div class="empty">' + carbEsc(hidden ? t.all_out : t.empty) + '</div>';
      return;
    }
    var self = this;
    var now = new Date();
    list.innerHTML = stations.map(function (s) { return self._renderStation(s, fuels, best, t, now); }).join('');
    list.querySelectorAll('img.logo').forEach(function (img) {
      img.addEventListener('error', function () {
        var badge = document.createElement('div');
        badge.className = 'logo badge';
        badge.style.background = img.dataset.color;
        badge.textContent = img.dataset.initials;
        img.replaceWith(badge);
      });
    });
  }

  _bestPrices(stations, fuels) {
    var best = {};
    fuels.forEach(function (f) {
      stations.forEach(function (s) {
        var fuel = s.fuels && s.fuels[f.key];
        if (fuel && fuel.available && (best[f.key] == null || fuel.price < best[f.key])) best[f.key] = fuel.price;
      });
    });
    return best;
  }

  _sorted(stations, fuels) {
    var sort = this._config.sort;
    if (sort === 'config') return stations;
    if (sort === 'name') return stations.sort(function (a, b) { return String(a.station_name).localeCompare(String(b.station_name)); });
    var byDistance = function (a, b) {
      var da = a.distance == null ? Infinity : a.distance, db = b.distance == null ? Infinity : b.distance;
      return da - db;
    };
    if (sort === 'distance') return stations.sort(byDistance);
    var key = this._config.sort_fuel || (fuels[0] && fuels[0].key);
    return stations.sort(function (a, b) {
      var fa = a.fuels && a.fuels[key], fb = b.fuels && b.fuels[key];
      var pa = fa && fa.available ? fa.price : Infinity, pb = fb && fb.available ? fb.price : Infinity;
      return pa - pb || byDistance(a, b);
    });
  }

  _logoWrap(s) {
    var logo = this._logoHtml(s);
    var known = carbLogo(s);
    var sub = known && known.own ? '' : carbSubBrand(s.brand);
    if (!logo || !sub) return logo;
    return '<div class="logo-wrap" title="' + carbEsc(s.brand) + '">' + logo + '<span class="sub-brand">' + carbEsc(sub) + '</span></div>';
  }

  _logoHtml(s) {
    if (!this._config.show_logo) return '';
    var label = s.brand || s.station_name || '';
    var color = carbBrandColor(label || 'station');
    var initials = carbInitials(label);
    var known = carbLogo(s);
    if (known) {
      return '<img class="logo' + (known.own ? ' own' : '') + '" src="' + carbEsc(known.src) + '" alt="' + carbEsc(label) + '" loading="lazy" referrerpolicy="no-referrer"' +
        ' data-color="' + color + '" data-initials="' + carbEsc(initials) + '">';
    }
    if (initials && s.brand) return '<div class="logo badge" style="background:' + color + '">' + carbEsc(initials) + '</div>';
    return '<div class="logo badge neutral"><ha-icon icon="mdi:gas-station"></ha-icon></div>';
  }

  _price(value) {
    return new Intl.NumberFormat(this._locale(), { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value) + ' €';
  }

  _renderStation(s, fuels, best, t, now) {
    var cfg = this._config;
    var id = String(s.station_id);
    var expanded = this._expandedId === id;
    var opening = cfg.show_hours ? carbOpening(s, t, now) : null;
    var self = this;

    var meta = [];
    if (cfg.show_brand && s.brand) meta.push('<span class="brand">' + carbEsc(s.brand) + '</span>');
    if (cfg.show_address) meta.push(carbEsc(s.address) + ', ' + carbEsc(carbTitleCase(s.city)));
    if (cfg.show_distance && s.distance != null) {
      meta.push(new Intl.NumberFormat(this._locale(), { maximumFractionDigits: 1 }).format(s.distance) + ' km');
    }
    if (s.highway) meta.push(carbEsc(t.highway));

    var chips = fuels.map(function (f) {
      var fuel = s.fuels && s.fuels[f.key];
      // Empty slot, so each fuel stays in the same column from one station to the next.
      var slot = '<div class="fuel empty"></div>';
      if (!fuel) return slot;
      if (!fuel.available && !fuel.rupture) {
        // Shortage just lifted, or no price published yet: the fuel is still sold here.
        var ended = fuel.rupture_end ? carbRelative(fuel.rupture_end, self._locale()) : '';
        return '<div class="fuel nodata" title="' + carbEsc(t.no_price_hint) + '">' +
          '<span class="fname">' + carbEsc(f.name) + '</span><span class="fprice">' + carbEsc(t.no_price) + '</span>' +
          (cfg.show_updated && ended ? '<span class="fage">' + carbEsc(t.rupture_ended + ' ' + ended) + '</span>' : '') + '</div>';
      }
      if (!fuel.available) {
        if (!cfg.show_out_of_stock || fuel.rupture === 'definitive') return slot;
        var since = fuel.rupture_since ? carbRelative(fuel.rupture_since, self._locale()) : '';
        return '<div class="fuel out" title="' + carbEsc(t.out_of_stock + (since ? ' ' + t.since + ' ' + since : '')) + '">' +
          '<span class="fname">' + carbEsc(f.name) + '</span><span class="fprice">' + carbEsc(t.out_of_stock) + '</span>' +
          (cfg.show_updated && since ? '<span class="fage">' + carbEsc(since) + '</span>' : '') + '</div>';
      }
      var isBest = cfg.highlight_best && best[f.key] === fuel.price && Object.keys(self._lastState.attributes.stations).length > 1;
      return '<div class="fuel' + (isBest ? ' best' : '') + '"' + (isBest ? ' title="' + carbEsc(t.best) + '"' : '') + '>' +
        '<span class="fname">' + carbEsc(f.name) + (isBest ? ' <ha-icon icon="mdi:star"></ha-icon>' : '') + '</span>' +
        '<span class="fprice">' + self._price(fuel.price) + '</span>' +
        (cfg.show_updated ? '<span class="fage">' + carbEsc(carbRelative(fuel.updated, self._locale())) + '</span>' : '') +
        '</div>';
    }).join('');

    var html =
      '<div class="station" data-id="' + carbEsc(id) + '">' +
      '<div class="row">' + this._logoWrap(s) +
      '<div class="main">' +
      '<div class="line1"><span class="name">' + carbEsc(s.station_name) + '</span>' +
      (opening ? '<span class="opening ' + opening.key + '">' + carbEsc(opening.text) + '</span>' : '') + '</div>' +
      (meta.length ? '<div class="meta">' + meta.join(' · ') + '</div>' : '') +
      '</div>' +
      '<ha-icon class="chevron" icon="' + (expanded ? 'mdi:chevron-up' : 'mdi:chevron-down') + '"></ha-icon>' +
      '</div>' +
      (chips.indexOf('fprice') !== -1
        ? '<div class="fuels"' + (fuels.length <= 4 ? ' style="grid-template-columns:repeat(' + fuels.length + ',minmax(0,1fr))"' : '') + '>' + chips + '</div>'
        : '');

    if (expanded) html += this._renderDetails(s, t, now);
    return html + '</div>';
  }

  _renderDetails(s, t, now) {
    var today = now.getDay() === 0 ? 7 : now.getDay();
    var rows = (s.hours || []).map(function (d) {
      var value = d.closed || !d.ranges.length
        ? t.closed
        : d.ranges.map(function (r) { return r[0] + '–' + r[1]; }).join(', ');
      return '<tr' + (d.day === today ? ' class="today"' : '') + '><td>' + carbEsc(t.days[d.day - 1]) + '</td><td>' + carbEsc(value) + '</td></tr>';
    }).join('');
    var html = '<div class="details">';
    if (rows) html += '<div class="dtitle">' + carbEsc(t.hours) + (s.automate_24_24 ? ' · ' + carbEsc(t.automate) : '') + '</div><table>' + rows + '</table>';
    if (s.services && s.services.length) {
      html += '<div class="dtitle">' + carbEsc(t.services) + '</div><div class="services">' +
        s.services.map(function (x) { return '<span>' + carbEsc(x) + '</span>'; }).join('') + '</div>';
    }
    if (s.latitude != null) {
      html += '<a class="directions" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' +
        encodeURIComponent(s.latitude + ',' + s.longitude) + '"><ha-icon icon="mdi:directions"></ha-icon>' + carbEsc(t.directions) + '</a>';
    }
    return html + '</div>';
  }

  _onListClick(ev) {
    // Links, and reading the expanded details, never toggle the station.
    if (ev.target.closest('a') || ev.target.closest('.details')) return;
    var item = ev.target.closest('.station');
    if (!item) return;
    var id = item.getAttribute('data-id');
    this._expandedId = this._expandedId === id ? null : id;
    this._render();
  }

  _refresh() {
    if (this._refreshing) return;
    var data = {};
    var st = this._lastState;
    if (st && st.attributes.config_entry_id) data.config_entry_id = st.attributes.config_entry_id;
    this._refreshing = true;
    this._render();
    var self = this;
    var t = this._t();
    this._hass.callService('carburants_france', 'refresh', data).catch(function (err) {
      var btn = self._root.querySelector('.refresh-btn');
      if (btn) btn.title = t.refresh_failed + ' : ' + ((err && err.message) || err);
    }).finally(function () {
      self._refreshing = false;
      var btn = self._root.querySelector('.refresh-btn');
      if (btn) btn.classList.remove('spinning');
    });
  }

  static _styles() {
    return [
      ':host { display: block; }',
      'ha-card { padding: 12px 0 8px; overflow: hidden; }',
      '.header { display: flex; align-items: center; justify-content: space-between; padding: 0 8px 4px 16px; min-height: 40px; }',
      '.title { display: flex; align-items: center; font-size: 1.15em; font-weight: 500; color: var(--primary-text-color); }',
      '.icon-link { display: flex; flex: none; margin-right: 10px; }',
      '.icon { width: 28px; height: 28px; display: block; }',
      '.count { font-size: 0.8em; font-weight: 400; color: var(--secondary-text-color); margin-left: 6px; }',
      '.refresh-btn.spinning ha-icon { animation: carb-spin 1s linear infinite; }',
      '@keyframes carb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '.empty { padding: 12px 16px; color: var(--secondary-text-color); }',
      '.station { padding: 10px 16px; cursor: pointer; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.station:first-child { border-top: none; }',
      '.row { display: flex; align-items: center; gap: 12px; }',
      '.logo { width: 40px; height: 40px; flex: none; border-radius: 10px; object-fit: contain; background: #fff; padding: 3px; box-sizing: border-box; border: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.logo.badge { display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.95em; letter-spacing: .5px; border: none; }',
      // A logo shipped with the card is a full square with its own rounded corners.
      '.logo.own { padding: 0; border: none; background: none; border-radius: 0; }',
      '.logo-wrap { position: relative; flex: none; display: flex; }',
      '.sub-brand { position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%); padding: 0 4px; border-radius: 4px; background: #e2001a; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: .4px; line-height: 12px; white-space: nowrap; box-shadow: 0 0 0 1.5px var(--card-background-color, #fff); }',
      '.meta .brand { color: var(--primary-text-color); font-weight: 500; }',
      '.logo.badge.neutral { background: var(--secondary-background-color, #eee); color: var(--secondary-text-color); }',
      '.main { flex: 1; min-width: 0; }',
      '.line1 { display: flex; align-items: baseline; gap: 8px; justify-content: space-between; flex-wrap: wrap; }',
      '.name { font-weight: 500; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.opening { font-size: 0.8em; white-space: nowrap; }',
      '.opening.open, .opening.always { color: var(--success-color, #43a047); }',
      '.opening.automate { color: var(--info-color, #039be5); }',
      '.opening.closed { color: var(--error-color, #db4437); }',
      '.meta { font-size: 0.85em; color: var(--secondary-text-color); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.chevron { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; }',
      '.fuels { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 6px; margin: 8px 0 0 52px; }',
      '.fuel { display: flex; flex-direction: column; padding: 5px 8px; border-radius: 8px; background: var(--secondary-background-color, rgba(0,0,0,.04)); border: 1px solid transparent; }',
      '.fname { font-size: 0.75em; color: var(--secondary-text-color); display: flex; align-items: center; gap: 3px; }',
      '.fname ha-icon { --mdc-icon-size: 12px; }',
      '.fprice { font-size: 1.05em; font-weight: 600; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }',
      '.fage { font-size: 0.7em; color: var(--secondary-text-color); }',
      '.fuel.empty { visibility: hidden; }',
      '.fuel.best { border-color: var(--success-color, #43a047); background: rgba(67,160,71,.10); }',
      '.fuel.best .fprice, .fuel.best .fname { color: var(--success-color, #43a047); }',
      '.fuel.out { opacity: .85; border-color: var(--warning-color, #ffa600); background: rgba(255,166,0,.08); }',
      '.fuel.out .fprice { font-size: 0.9em; color: var(--warning-color, #ffa600); }',
      '.fuel.nodata { border-style: dashed; border-color: var(--divider-color, rgba(0,0,0,.2)); }',
      '.fuel.nodata .fprice { font-size: 0.9em; font-weight: 500; color: var(--secondary-text-color); }',
      '.details { margin: 10px 0 2px 52px; font-size: 0.85em; color: var(--primary-text-color); }',
      '.dtitle { font-weight: 500; margin: 8px 0 4px; color: var(--secondary-text-color); }',
      '.details table { border-collapse: collapse; }',
      '.details td { padding: 1px 12px 1px 0; }',
      '.details tr.today td { font-weight: 600; }',
      '.services { display: flex; flex-wrap: wrap; gap: 4px; }',
      '.services span { border: 1px solid var(--divider-color, rgba(0,0,0,.12)); border-radius: 10px; padding: 1px 8px; font-size: 0.9em; }',
      '.directions { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 8px 16px; border-radius: 20px; background: var(--primary-color); color: var(--text-primary-color, #fff); text-decoration: none; font-weight: 500; font-size: 1.05em; box-shadow: 0 1px 3px rgba(0,0,0,.25); }',
      '.directions:hover { filter: brightness(1.1); }',
      '.directions ha-icon { --mdc-icon-size: 20px; }',
      '.footer { padding: 4px 16px 2px; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.footer[hidden] { display: none; }',
      '.toggle { display: inline-flex; align-items: center; gap: 6px; font: inherit; font-size: 0.875em; font-weight: 500; padding: 6px 0; border: none; background: none; color: var(--primary-color); cursor: pointer; }',
      '.toggle ha-icon { --mdc-icon-size: 18px; }',
    ].join('\n');
  }
}

// ── carburants-france-card-editor ─────────────────────────────────────────────
class CarburantsFranceCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({}, config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
      this._form.schema = this._schema();
    } else {
      this._render();
    }
  }

  _fuelOptions() {
    var entity = this._config.entity || CarburantsFranceCard._findEntity(this._hass);
    var st = entity && this._hass.states[entity];
    var fuels = (st && st.attributes.fuels) || [];
    return fuels.map(function (f) { return { value: f.key, label: f.name }; });
  }

  _schema() {
    var t = CarburantsI18n[carbLang(this._hass)];
    var fuels = this._fuelOptions();
    var sorts = ['price', 'distance', 'name', 'config'].map(function (k) { return { value: k, label: t.sort_options[k] }; });
    return [
      { name: 'entity', selector: { entity: { domain: 'sensor', integration: 'carburants_france' } } },
      { name: 'title', selector: { text: {} } },
      { name: 'fuels', selector: { select: { multiple: true, mode: 'list', options: fuels } } },
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'sort', selector: { select: { mode: 'dropdown', options: sorts } } },
          { name: 'sort_fuel', selector: { select: { mode: 'dropdown', options: fuels } } },
        ],
      },
      { name: 'max_stations', selector: { number: { min: 0, max: 50, mode: 'box' } } },
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'show_icon', selector: { boolean: {} } },
          { name: 'show_logo', selector: { boolean: {} } },
          { name: 'show_brand', selector: { boolean: {} } },
          { name: 'show_address', selector: { boolean: {} } },
          { name: 'show_distance', selector: { boolean: {} } },
          { name: 'show_hours', selector: { boolean: {} } },
          { name: 'show_updated', selector: { boolean: {} } },
          { name: 'show_out_of_stock', selector: { boolean: {} } },
          { name: 'highlight_best', selector: { boolean: {} } },
          { name: 'show_refresh', selector: { boolean: {} } },
          { name: 'hide_out_of_stock_stations', selector: { boolean: {} } },
        ],
      },
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      var t = CarburantsI18n[carbLang(this._hass)].editor;
      this._form = document.createElement('ha-form');
      this._form.computeLabel = function (field) { return t[field.name] || field.name; };
      this._form.addEventListener('value-changed', this._valueChanged.bind(this));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    // Show the defaults as set, so the toggles match what the card does.
    this._form.data = Object.assign({}, CARBURANTS_DEFAULTS, this._config);
  }

  _valueChanged(ev) {
    var value = Object.assign({}, ev.detail.value);
    // Keep the YAML short: drop options left at their default.
    Object.keys(CARBURANTS_DEFAULTS).forEach(function (key) {
      if (value[key] === CARBURANTS_DEFAULTS[key]) delete value[key];
    });
    ['title', 'entity', 'sort_fuel'].forEach(function (key) { if (!value[key]) delete value[key]; });
    if (Array.isArray(value.fuels) && !value.fuels.length) delete value.fuels;
    var entityChanged = value.entity !== this._config.entity;
    this._config = value;
    if (entityChanged) this._form.schema = this._schema();
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: value }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('carburants-france-card-editor')) {
  customElements.define('carburants-france-card-editor', CarburantsFranceCardEditor);
}

if (!customElements.get('carburants-france-card')) {
  customElements.define('carburants-france-card', CarburantsFranceCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'carburants-france-card',
    name: 'Carburants France',
    description: 'Fuel prices and availability of the followed stations, with brand logos.',
    preview: true,
  });
  console.info('%c CARBURANTS-FRANCE-CARD %c v' + CARBURANTS_CARD_VERSION + ' ', 'color:#fff;background:#0e7c66;font-weight:700', 'color:#0e7c66;background:#fff');
}

// ── carburants-france-map-card ────────────────────────────────────────────────
// Leaflet ships with the integration: no CDN, only the map tiles come from the network.
var CARBURANTS_STATIC = '/carburants_france_static';
var CARBURANTS_MAP_DEFAULTS = { height: 400, show_icon: true, show_home: true, show_logo: true, show_name: true, map_style: 'osm', theme: 'auto', hide_out_of_stock_stations: true };

var CARBURANTS_OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
var CARBURANTS_IGN_WMTS = 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

// Base maps that need no API key. "osm" goes through Home Assistant (see _tileUrl).
// photo: aerial imagery, never darkened by the dark theme.
var CARBURANTS_MAP_STYLES = {
  osm: { maxZoom: 19, attribution: CARBURANTS_OSM_ATTRIBUTION },
  osm_fr: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.fr" target="_blank" rel="noopener">OpenStreetMap France</a> | ' + CARBURANTS_OSM_ATTRIBUTION,
  },
  ign: {
    url: CARBURANTS_IGN_WMTS + '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&FORMAT=image/png',
    maxNativeZoom: 19,
    maxZoom: 20,
    attribution: 'Plan IGN &copy; <a href="https://www.ign.fr" target="_blank" rel="noopener">IGN</a>',
  },
  ign_photo: {
    url: CARBURANTS_IGN_WMTS + '&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&FORMAT=image/jpeg',
    maxNativeZoom: 19,
    maxZoom: 20,
    photo: true,
    attribution: 'Photographies aériennes &copy; <a href="https://www.ign.fr" target="_blank" rel="noopener">IGN</a>',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attribution: CARBURANTS_OSM_ATTRIBUTION + ', SRTM | &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA)',
  },
  cyclosm: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    maxZoom: 20,
    attribution: '<a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a> | ' + CARBURANTS_OSM_ATTRIBUTION,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    photo: true,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  custom: { maxZoom: 20 },
};

var CarburantsMapI18n = {
  fr: {
    default_title: 'Carte des stations',
    home: 'Domicile',
    editor: {
      entity: 'Capteur Stations',
      title: 'Titre (vide pour aucun)',
      fuel: 'Carburant affiché sur les repères',
      height: 'Hauteur (px)',
      zoom: 'Zoom (vide = ajusté aux stations)',
      map_style: 'Fond de carte',
      theme: 'Thème du fond de carte',
      tile_url: 'URL des tuiles ({z}, {x}, {y})',
      tile_attribution: 'Attribution des tuiles',
      show_icon: 'Icône',
      show_home: 'Domicile',
      show_logo: 'Logos des enseignes',
      show_name: 'Nom des stations sur les repères',
      hide_out_of_stock_stations: 'Masquer les stations en rupture',
    },
    themes: { auto: 'Selon le thème', light: 'Clair', dark: 'Sombre' },
    styles: {
      osm: 'OpenStreetMap',
      osm_fr: 'OpenStreetMap France',
      ign: 'Plan IGN',
      ign_photo: 'Photos aériennes IGN',
      topo: 'OpenTopoMap (relief)',
      cyclosm: 'CyclOSM (vélo)',
      satellite: 'Satellite (Esri)',
      custom: 'Personnalisé (URL)',
    },
  },
  en: {
    default_title: 'Stations map',
    home: 'Home',
    editor: {
      entity: 'Stations sensor',
      title: 'Title (empty for none)',
      fuel: 'Fuel shown on markers',
      height: 'Height (px)',
      zoom: 'Zoom (empty = fit the stations)',
      map_style: 'Base map',
      theme: 'Base map theme',
      tile_url: 'Tile URL ({z}, {x}, {y})',
      tile_attribution: 'Tile attribution',
      show_icon: 'Icon',
      show_home: 'Home',
      show_logo: 'Brand logos',
      show_name: 'Station names on markers',
      hide_out_of_stock_stations: 'Hide out of stock stations',
    },
    themes: { auto: 'Follow theme', light: 'Light', dark: 'Dark' },
    styles: {
      osm: 'OpenStreetMap',
      osm_fr: 'OpenStreetMap France',
      ign: 'IGN map',
      ign_photo: 'IGN aerial photos',
      topo: 'OpenTopoMap (terrain)',
      cyclosm: 'CyclOSM (cycling)',
      satellite: 'Satellite (Esri)',
      custom: 'Custom (URL)',
    },
  },
};

var carbLeafletPromise = null;
function carbLoadLeaflet() {
  if (window.L && window.L.map) return Promise.resolve(window.L);
  if (!carbLeafletPromise) {
    carbLeafletPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = CARBURANTS_STATIC + '/leaflet/leaflet.js?v=1.9.4';
      script.onload = function () { resolve(window.L); };
      script.onerror = function () { carbLeafletPromise = null; reject(new Error('Leaflet could not be loaded')); };
      document.head.appendChild(script);
    });
  }
  return carbLeafletPromise;
}

class CarburantsFranceMapCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement('carburants-france-map-card-editor');
  }

  static getStubConfig(hass) {
    var entity = CarburantsFranceCard._findEntity(hass);
    return entity ? { entity: entity } : {};
  }

  setConfig(config) {
    var previous = this._config;
    this._config = Object.assign({}, CARBURANTS_MAP_DEFAULTS, config || {});
    if (previous && this._map && this._tilesKey(previous) !== this._tilesKey(this._config)) {
      if (this._tiles) this._map.removeLayer(this._tiles);
      this._tiles = null;
      this._loadTiles(window.L);
    }
    this._lastState = null;
    this._fitted = false;
    if (this._hass) this._update();
  }

  set hass(hass) {
    this._hass = hass;
    var entityId = this._entityId();
    var st = entityId ? hass.states[entityId] : null;
    if (st !== this._lastState || !this._map) {
      this._lastState = st;
      this._update();
    }
  }

  connectedCallback() {
    var self = this;
    // A click elsewhere closes the popup and hides the out of stock stations again.
    this._onOutside = this._onOutside || carbOutsideListener(this, function () {
      if (!self._map) return;
      self._map.closePopup();
      if (self._showAll) {
        self._showAll = false;
        self._drawMarkers(window.L);
      }
    });
    document.addEventListener('click', this._onOutside, true);
    if (!this._map) return;
    if (this._resizeObserver) this._resizeObserver.observe(this._root.querySelector('.map'));
    this._scheduleTokenRefresh();
    // The token may have expired while the card was detached.
    if (this._tiles && this._tiles._url.indexOf('/api/map_tiles/') === 0) {
      this._tileUrl().then(function (url) { if (self._tiles) self._tiles.setUrl(url); });
    }
    setTimeout(this._invalidate.bind(this), 0);
  }

  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    clearInterval(this._tokenTimer);
    document.removeEventListener('click', this._onOutside, true);
  }

  getCardSize() {
    return Math.ceil((this._config ? this._config.height : 400) / 50) + 1;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  _entityId() {
    return (this._config && this._config.entity) || CarburantsFranceCard._findEntity(this._hass);
  }

  _t() {
    return CarburantsI18n[carbLang(this._hass)];
  }

  _locale() {
    return (this._hass && this._hass.locale && this._hass.locale.language) || navigator.language || 'fr';
  }

  _dark() {
    if (this._config.theme === 'dark') return true;
    if (this._config.theme === 'light') return false;
    return !!(this._hass && this._hass.themes && this._hass.themes.darkMode);
  }

  _style() {
    var style = this._config.map_style;
    if (style === 'custom' && !this._config.tile_url) style = 'osm';
    return CARBURANTS_MAP_STYLES[style] ? style : 'osm';
  }

  _tilesKey(config) {
    return [config.map_style, config.tile_url, config.tile_attribution].join('|');
  }

  // Aerial imagery is never darkened.
  _darkTiles() {
    return this._dark() && !CARBURANTS_MAP_STYLES[this._style()].photo;
  }

  _ensureShell() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML =
      '<link rel="stylesheet" href="' + CARBURANTS_STATIC + '/leaflet/leaflet.css?v=1.9.4">' +
      '<style>' + CarburantsFranceMapCard._styles() + '</style>' +
      '<ha-card><div class="header" hidden></div><div class="message" hidden></div><div class="map"></div></ha-card>';
  }

  _update() {
    if (!this._config || !this._hass) return;
    this._ensureShell();
    var mt = CarburantsMapI18n[carbLang(this._hass)];
    var header = this._root.querySelector('.header');
    var title = this._config.title === undefined ? mt.default_title : this._config.title;
    // Same icon as the list card, opening the government data page.
    var icon = this._config.show_icon
      ? '<a class="icon-link" href="' + CARBURANTS_SOURCE_URL + '" target="_blank" rel="noopener" title="data.economie.gouv.fr">' +
        '<img class="icon" src="' + CARBURANTS_ICON + '" alt="data.economie.gouv.fr"></a>'
      : '';
    header.hidden = !title && !icon;
    header.innerHTML = icon + carbEsc(title || '');
    var mapEl = this._root.querySelector('.map');
    mapEl.style.height = Math.max(150, Number(this._config.height) || 400) + 'px';
    // Follows the Home Assistant theme live when theme is auto.
    mapEl.classList.toggle('dark', this._darkTiles());
    var message = this._root.querySelector('.message');
    if (!this._lastState) {
      message.hidden = false;
      message.textContent = this._t().no_entity;
      return;
    }
    message.hidden = true;
    var self = this;
    carbLoadLeaflet().then(function (L) {
      self._ensureMap(L);
      self._drawMarkers(L);
    }).catch(function (err) {
      message.hidden = false;
      message.textContent = String((err && err.message) || err);
    });
  }

  _ensureMap(L) {
    if (this._map) return;
    var mapEl = this._root.querySelector('.map');
    this._map = L.map(mapEl, { zoomControl: true, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.25 });
    mapEl.classList.toggle('dark', this._darkTiles());
    this._loadTiles(L);
    this._layer = L.layerGroup().addTo(this._map);
    var self = this;
    var Toggle = L.Control.extend({
      onAdd: function () {
        var el = L.DomUtil.create('button', 'carb-toggle');
        el.type = 'button';
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.on(el, 'click', function () {
          self._showAll = !self._showAll;
          self._drawMarkers(L);
        });
        return el;
      },
    });
    this._toggle = new Toggle({ position: 'topright' }).addTo(this._map);
    this._fitted = false;
    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(function () { self._invalidate(); });
      this._resizeObserver.observe(mapEl);
    }
  }

  // OpenStreetMap tiles through Home Assistant's own Map tiles proxy (2026.9+), like the
  // native map card. Its access token rotates every 30 minutes, two being valid at once.
  _tileUrl() {
    var hass = this._hass;
    return Promise.resolve()
      .then(function () { return hass.callWS({ type: 'map_tiles/access_token' }); })
      .then(function (res) { return '/api/map_tiles/raster/{z}/{x}/{y}.png?token=' + encodeURIComponent(res.token); })
      .catch(function () { return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'; });
  }

  _loadTiles(L) {
    var self = this;
    var map = this._map;
    var style = this._style();
    var spec = CARBURANTS_MAP_STYLES[style];
    var options = { maxZoom: spec.maxZoom, attribution: spec.attribution };
    if (spec.maxNativeZoom) options.maxNativeZoom = spec.maxNativeZoom;
    var key = this._tilesKey(this._config);
    var url;
    if (style === 'osm') {
      url = this._tileUrl();
    } else if (style === 'custom') {
      options.attribution = this._config.tile_attribution || '';
      url = Promise.resolve(this._config.tile_url);
    } else {
      url = Promise.resolve(spec.url);
    }
    this._root.querySelector('.map').classList.toggle('dark', this._darkTiles());
    url.then(function (resolved) {
      // The map was rebuilt or the style changed while the token was loading.
      if (self._map !== map || self._tilesKey(self._config) !== key) return;
      self._tiles = L.tileLayer(resolved, options).addTo(map);
      self._tiles.bringToBack();
      self._scheduleTokenRefresh();
    });
  }

  _scheduleTokenRefresh() {
    clearInterval(this._tokenTimer);
    if (!this._tiles || this._tiles._url.indexOf('/api/map_tiles/') !== 0) return;
    var self = this;
    this._tokenTimer = setInterval(function () {
      self._tileUrl().then(function (url) {
        // No redraw: tiles already shown stay, new ones use the new token.
        if (self._tiles) self._tiles.setUrl(url, true);
      });
    }, 20 * 60 * 1000);
  }

  _destroyMap() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    clearInterval(this._tokenTimer);
    if (this._map) this._map.remove();
    this._map = null;
    this._layer = null;
    this._tiles = null;
  }

  _invalidate() {
    if (!this._map) return;
    this._map.invalidateSize();
    if (!this._fitted && this._bounds) this._fit();
  }

  _fit() {
    var mapEl = this._root.querySelector('.map');
    if (!mapEl.clientWidth) return; // Not laid out yet: the resize observer comes back.
    if (this._config.zoom && this._bounds) {
      this._map.setView(this._bounds.getCenter(), this._config.zoom);
    } else if (this._bounds) {
      // Pins sit above their point and are ~120 px wide: leave room on top and on the sides.
      var side = this._config.show_name ? 110 : 80;
      this._map.fitBounds(this._bounds, { paddingTopLeft: [side, 80], paddingBottomRight: [side, 30], maxZoom: 15 });
    }
    this._fitted = true;
  }

  _fuelKey(fuels) {
    var wanted = this._config.fuel;
    if (wanted && fuels.some(function (f) { return f.key === wanted; })) return wanted;
    return fuels[0] && fuels[0].key;
  }

  _drawMarkers(L) {
    var t = this._t();
    var attrs = this._lastState.attributes;
    var fuels = attrs.fuels || [];
    var key = this._fuelKey(fuels);
    var stations = (attrs.stations || []).filter(function (s) { return s.latitude != null && s.longitude != null; });
    var best = CarburantsFranceCard.prototype._bestPrices.call(null, stations, fuels);
    var hidden = this._config.hide_out_of_stock_stations
      ? stations.filter(function (s) { return carbAllOut(s, fuels); }).length
      : 0;
    if (hidden && !this._showAll) stations = stations.filter(function (s) { return !carbAllOut(s, fuels); });
    var toggle = this._toggle.getContainer();
    toggle.hidden = !hidden;
    toggle.textContent = carbToggleLabel(t, this._showAll, hidden);
    var fuelName = (fuels.filter(function (f) { return f.key === key; })[0] || {}).name || '';
    var self = this;
    var now = new Date();
    var points = [];
    var signature = stations.map(function (s) { return s.station_id; }).join(',');
    if (signature !== this._signature) this._fitted = false;
    this._signature = signature;

    this._layer.clearLayers();
    stations.forEach(function (s) {
      var fuel = s.fuels && s.fuels[key];
      var state = !fuel || fuel.rupture === 'definitive' ? 'none'
        : !fuel.available ? (fuel.rupture ? 'out' : 'nodata')
        : best[key] === fuel.price && stations.length > 1 ? 'best' : 'ok';
      var label = state === 'ok' || state === 'best' ? self._price(fuel.price)
        : state === 'out' ? t.out_of_stock : state === 'nodata' ? t.no_price : '—';
      var logo = '';
      if (self._config.show_logo) {
        var name = s.brand || s.station_name || '';
        var known = carbLogo(s);
        logo = known
          ? '<img' + (known.own ? ' class="own"' : '') + ' src="' + carbEsc(known.src) + '" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ini\',textContent:' +
            carbEsc(JSON.stringify(carbInitials(name))) + '}))">'
          : '<span class="ini" style="background:' + carbBrandColor(name || 'station') + '">' + carbEsc(carbInitials(name) || '⛽') + '</span>';
      }
      var sub = known && known.own ? '' : carbSubBrand(s.brand);
      var subTag = sub ? '<span class="psub">' + carbEsc(sub) + '</span>' : '';
      var icon = L.divIcon({
        className: 'carb-marker',
        html: '<div class="pin ' + state + '" title="' + carbEsc(s.station_name + ' · ' + fuelName) + '">' + logo +
          (self._config.show_name
            ? '<span class="ptext"><span class="pline">' + subTag + '<span class="pname-pin">' + carbEsc(s.station_name) + '</span></span><span class="price">' + carbEsc(label) + '</span></span>'
            : subTag + '<span class="price">' + carbEsc(label) + '</span>') +
          '</div>',
        iconSize: null,
        iconAnchor: [0, 0],
      });
      var marker = L.marker([s.latitude, s.longitude], { icon: icon, riseOnHover: true, zIndexOffset: state === 'best' ? 1000 : 0 });
      marker.bindPopup(self._popup(s, fuels, best, t, now), { maxWidth: 280, minWidth: 220 });
      marker.addTo(self._layer);
      points.push([s.latitude, s.longitude]);
    });

    var home = this._hass.states['zone.home'];
    if (this._config.show_home && home && home.attributes.latitude != null) {
      var mt = CarburantsMapI18n[carbLang(this._hass)];
      L.marker([home.attributes.latitude, home.attributes.longitude], {
        icon: L.divIcon({ className: 'carb-marker', html: '<div class="home" title="' + carbEsc(mt.home) + '"><ha-icon icon="mdi:home"></ha-icon></div>', iconSize: null, iconAnchor: [0, 0] }),
        zIndexOffset: -1000,
        keyboard: false,
      }).addTo(this._layer);
      points.push([home.attributes.latitude, home.attributes.longitude]);
    }

    this._bounds = points.length ? L.latLngBounds(points) : null;
    if (!this._fitted) this._fit();
  }

  _price(value) {
    return new Intl.NumberFormat(this._locale(), { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value) + ' €';
  }

  _popup(s, fuels, best, t, now) {
    var self = this;
    var opening = carbOpening(s, t, now);
    var rows = fuels.map(function (f) {
      var fuel = s.fuels && s.fuels[f.key];
      if (!fuel || fuel.rupture === 'definitive') return '';
      var value = fuel.available
        ? '<b' + (best[f.key] === fuel.price ? ' class="best"' : '') + '>' + self._price(fuel.price) + '</b>'
        : fuel.rupture
          ? '<span class="out">' + carbEsc(t.out_of_stock) + '</span>'
          : '<span class="nodata">' + carbEsc(t.no_price) + '</span>';
      var age = fuel.available ? carbRelative(fuel.updated, self._locale())
        : carbRelative(fuel.rupture ? fuel.rupture_since : fuel.rupture_end, self._locale());
      return '<tr><td>' + carbEsc(f.name) + '</td><td>' + value + '</td><td class="age">' + carbEsc(age) + '</td></tr>';
    }).join('');
    return '<div class="popup">' +
      '<div class="pname">' + carbEsc(s.station_name) + '</div>' +
      (s.brand ? '<div class="pbrand">' + carbEsc(s.brand) + '</div>' : '') +
      '<div class="paddr">' + carbEsc(s.address) + ', ' + carbEsc(carbTitleCase(s.city)) +
      (s.distance != null ? ' · ' + new Intl.NumberFormat(this._locale(), { maximumFractionDigits: 1 }).format(s.distance) + ' km' : '') + '</div>' +
      (opening ? '<div class="popening ' + opening.key + '">' + carbEsc(opening.text) + '</div>' : '') +
      (rows ? '<table>' + rows + '</table>' : '') +
      '<a class="pdir" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(s.latitude + ',' + s.longitude) + '"><ha-icon icon="mdi:directions"></ha-icon>' + carbEsc(t.directions) + '</a></div>';
  }

  static _styles() {
    return [
      ':host { display: block; }',
      'ha-card { overflow: hidden; }',
      '.header { display: flex; align-items: center; min-height: 40px; padding: 12px 16px 8px; font-size: 1.15em; font-weight: 500; color: var(--primary-text-color); }',
      '.icon-link { display: flex; flex: none; margin-right: 10px; }',
      '.icon { width: 28px; height: 28px; display: block; }',
      '.header[hidden], .message[hidden] { display: none; }',
      '.message { padding: 12px 16px; color: var(--secondary-text-color); }',
      '.map { width: 100%; background: var(--secondary-background-color, #e5e5e5); z-index: 0; }',
      '.leaflet-container { font: inherit; }',
      '.map.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9); }',
      '.carb-marker { background: none; border: none; }',
      '.ptext { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }',
      '.pline { display: flex; align-items: center; gap: 3px; min-width: 0; }',
      '.psub { flex: none; padding: 0 3px; border-radius: 3px; background: #e2001a; color: #fff; font-size: 8px; font-weight: 700; letter-spacing: .3px; line-height: 11px; }',
      '.pname-pin { max-width: 130px; overflow: hidden; text-overflow: ellipsis; font-size: 11px; font-weight: 500; color: var(--primary-text-color, #212121); }',
      '.pin { position: absolute; transform: translate(-50%, calc(-100% - 7px)); display: flex; align-items: center; gap: 5px; padding: 3px 8px 3px 3px; border-radius: 16px; background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121); border: 2px solid var(--secondary-text-color, #727272); box-shadow: 0 1px 4px rgba(0,0,0,.35); white-space: nowrap; font-weight: 600; font-size: 13px; font-variant-numeric: tabular-nums; cursor: pointer; }',
      '.pin::after { content: ""; position: absolute; left: 50%; bottom: -8px; transform: translateX(-50%); border: 6px solid transparent; border-top: 7px solid var(--secondary-text-color, #727272); }',
      '.pin.best { border-color: var(--success-color, #43a047); color: var(--success-color, #43a047); }',
      '.pin.best::after { border-top-color: var(--success-color, #43a047); }',
      '.pin.out { border-color: var(--warning-color, #ffa600); color: var(--warning-color, #ffa600); }',
      '.pin.out::after { border-top-color: var(--warning-color, #ffa600); }',
      '.pin.none { opacity: .6; }',
      // Leaflet forces width:auto and max-width:none on marker images: these selectors must outrank it.
      '.leaflet-container .leaflet-marker-pane .pin img { flex: none; box-sizing: border-box; height: 22px !important; width: auto !important; max-width: 52px !important; max-height: 22px !important; padding: 2px 4px !important; border-radius: 11px; object-fit: contain; background: #fff; }',
      '.leaflet-container .leaflet-marker-pane .pin img.own { width: 22px !important; padding: 0 !important; border-radius: 0; background: none; }',
      '.pin .ini { width: 22px; height: 22px; border-radius: 50%; flex: none; }',
      '.pin .ini { display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 700; background: #607d8b; }',
      '.home { position: absolute; transform: translate(-50%, -50%); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary-color, #03a9f4); color: #fff; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); --mdc-icon-size: 18px; }',
      '.leaflet-popup-content-wrapper, .leaflet-popup-tip { background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121); }',
      '.leaflet-popup-content { margin: 10px 12px; font-size: 13px; }',
      '.pname { font-weight: 600; font-size: 14px; }',
      '.pbrand { font-size: 12px; font-weight: 500; color: var(--secondary-text-color, #727272); }',
      '.paddr { color: var(--secondary-text-color, #727272); margin-top: 2px; }',
      '.popening { margin-top: 4px; font-size: 12px; }',
      '.popening.open, .popening.always { color: var(--success-color, #43a047); }',
      '.popening.automate { color: var(--info-color, #039be5); }',
      '.popening.closed { color: var(--error-color, #db4437); }',
      '.popup table { margin-top: 6px; border-collapse: collapse; width: 100%; }',
      '.popup td { padding: 2px 8px 2px 0; }',
      '.popup td.age { color: var(--secondary-text-color, #727272); font-size: 11px; text-align: right; padding-right: 0; }',
      '.popup b.best { color: var(--success-color, #43a047); }',
      '.popup .out { color: var(--warning-color, #ffa600); font-weight: 600; }',
      '.popup .nodata { color: var(--secondary-text-color, #727272); }',
      '.carb-toggle { font: inherit; font-size: 12px; font-weight: 500; padding: 5px 10px; border-radius: 4px; border: 2px solid rgba(0,0,0,.2); background: var(--card-background-color, #fff); color: var(--primary-color, #03a9f4); cursor: pointer; background-clip: padding-box; }',
      '.carb-toggle[hidden] { display: none; }',
      // Leaflet colours every link in the map: the selector must outrank '.leaflet-container a'.
      '.leaflet-container a.pdir { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; padding: 8px 14px; border-radius: 18px; background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.25); }',
      '.leaflet-container a.pdir:hover { filter: brightness(1.1); }',
      '.pdir ha-icon { --mdc-icon-size: 18px; }',
    ].join('\n');
  }
}

class CarburantsFranceMapCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({}, config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
      this._form.schema = this._schema();
    } else {
      this._render();
    }
  }

  _schema() {
    var mt = CarburantsMapI18n[carbLang(this._hass)];
    var entity = this._config.entity || CarburantsFranceCard._findEntity(this._hass);
    var st = entity && this._hass.states[entity];
    var fuels = ((st && st.attributes.fuels) || []).map(function (f) { return { value: f.key, label: f.name }; });
    var themes = ['auto', 'light', 'dark'].map(function (k) { return { value: k, label: mt.themes[k] }; });
    var styles = Object.keys(CARBURANTS_MAP_STYLES).map(function (k) { return { value: k, label: mt.styles[k] }; });
    var custom = this._config.map_style === 'custom'
      ? [
          { name: 'tile_url', selector: { text: { type: 'url' } } },
          { name: 'tile_attribution', selector: { text: {} } },
        ]
      : [];
    return [
      { name: 'entity', selector: { entity: { domain: 'sensor', integration: 'carburants_france' } } },
      { name: 'title', selector: { text: {} } },
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'map_style', selector: { select: { mode: 'dropdown', options: styles } } },
          { name: 'theme', selector: { select: { mode: 'dropdown', options: themes } } },
        ],
      },
    ].concat(custom, [
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'fuel', selector: { select: { mode: 'dropdown', options: fuels } } },
          { name: 'height', selector: { number: { min: 150, max: 1200, step: 10, mode: 'box', unit_of_measurement: 'px' } } },
          { name: 'zoom', selector: { number: { min: 5, max: 18, mode: 'box' } } },
          { name: 'show_icon', selector: { boolean: {} } },
          { name: 'show_home', selector: { boolean: {} } },
          { name: 'show_logo', selector: { boolean: {} } },
          { name: 'show_name', selector: { boolean: {} } },
          { name: 'hide_out_of_stock_stations', selector: { boolean: {} } },
        ],
      },
    ]);
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      var t = CarburantsMapI18n[carbLang(this._hass)].editor;
      this._form = document.createElement('ha-form');
      this._form.computeLabel = function (field) { return t[field.name] || field.name; };
      this._form.addEventListener('value-changed', this._valueChanged.bind(this));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.schema = this._schema();
    this._form.data = Object.assign({}, CARBURANTS_MAP_DEFAULTS, this._config);
  }

  _valueChanged(ev) {
    var value = Object.assign({}, ev.detail.value);
    Object.keys(CARBURANTS_MAP_DEFAULTS).forEach(function (key) {
      if (value[key] === CARBURANTS_MAP_DEFAULTS[key]) delete value[key];
    });
    ['entity', 'fuel', 'zoom', 'tile_url', 'tile_attribution'].forEach(function (key) { if (!value[key]) delete value[key]; });
    if (value.map_style !== 'custom') {
      delete value.tile_url;
      delete value.tile_attribution;
    }
    // An empty title hides the header: keep it as "" rather than dropping it.
    var rebuild = value.entity !== this._config.entity || value.map_style !== this._config.map_style;
    this._config = value;
    if (rebuild) this._form.schema = this._schema();
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: value }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('carburants-france-map-card-editor')) {
  customElements.define('carburants-france-map-card-editor', CarburantsFranceMapCardEditor);
}

if (!customElements.get('carburants-france-map-card')) {
  customElements.define('carburants-france-map-card', CarburantsFranceMapCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'carburants-france-map-card',
    name: 'Carburants France — carte',
    description: 'Map of the followed stations, with the price of a fuel on each marker.',
    preview: true,
  });
}

