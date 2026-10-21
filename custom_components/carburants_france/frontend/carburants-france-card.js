var CARBURANTS_CARD_VERSION = '1.1.1';

// ── Integration icon (same drawing as brand/icon.png) ────────────────────────
var CARBURANTS_ICON = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">' +
  '<rect width="256" height="256" rx="56" fill="#1B2A41"/>' +
  '<rect x="64" y="56" width="96" height="148" rx="14" fill="#F5A623"/>' +
  '<rect x="78" y="72" width="68" height="52" rx="6" fill="#1B2A41"/>' +
  '<polyline points="86,86 100,98 113,91 126,108 138,112" fill="none" stroke="#12A37F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<rect x="88" y="142" width="48" height="8" rx="4" fill="#1B2A41" opacity="0.35"/>' +
  '<rect x="52" y="196" width="120" height="14" rx="7" fill="#F5A623"/>' +
  '<path d="M160 156 H176 Q192 156 192 140 V100 L176 82" fill="none" stroke="#F5A623" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>'
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
// TotalEnergies, on a white rounded square tile (96 px), for Total, TotalEnergies, Total Contact...
var CARBURANTS_TOTALENERGIES_LOGO = 'data:image/png;base64,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';
// First match wins: Total Access before the other Total brands.
var CARBURANTS_BRAND_LOGOS = [
  { match: /\btotal\s*(energies)?\s*access\b/i, src: CARBURANTS_TOTAL_ACCESS_LOGO },
  { match: /^\s*total(\s*energies)?\b/i, src: CARBURANTS_TOTALENERGIES_LOGO },
];

// The station's logo: { src, own }, own when the card ships it.
function carbLogo(s) {
  for (var i = 0; i < CARBURANTS_BRAND_LOGOS.length; i++) {
    if (CARBURANTS_BRAND_LOGOS[i].match.test(String(s.brand || ''))) return { src: CARBURANTS_BRAND_LOGOS[i].src, own: true };
  }
  return s.logo ? { src: s.logo, own: false } : null;
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
    // Read the current state now: a config change must redraw at once, not at the next hass update.
    this._lastState = this._hass && this._entityId() ? this._hass.states[this._entityId()] || null : null;
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
      header.innerHTML = '<div class="title">' + icon + '<div class="titles"><div class="hname">' + carbEsc(title) + '</div></div></div>';
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
      '<div class="title">' + icon + '<div class="titles"><div class="hname">' + carbEsc(title) + '</div>' +
      '<div class="hsub">' + carbEsc(st.state) + ' ' + carbEsc(t.stations) + '</div></div></div>' +
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
      '<div class="row">' + this._logoHtml(s) +
      '<div class="main">' +
      '<div class="line1"><span class="name">' + carbEsc(s.station_name) + '</span>' +
      (opening ? '<span class="opening ' + opening.key + '">' + carbEsc(opening.text) + '</span>' : '') + '</div>' +
      (meta.length ? '<div class="meta">' + meta.join(' · ') + '</div>' : '') +
      '</div>' +
      '<ha-icon class="chevron' + (expanded ? '' : ' closed') + '" icon="mdi:chevron-down"></ha-icon>' +
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
      'ha-card { padding: 0 0 8px; overflow: hidden; }',
      '.header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 8px 8px 16px; min-height: 40px; }',
      '.title { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; }',
      '.titles { min-width: 0; }',
      '.hname { font-size: 18px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.hsub { font-size: 13px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.icon-link { display: flex; flex: none; }',
      '.icon { width: 40px; height: 40px; display: block; }',
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
      '.chevron { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; transition: transform .2s ease; }',
      '.chevron.closed { transform: rotate(-90deg); }',
      '.fuels { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 6px; margin: 8px 0 0 52px; }',
      '.fuel { display: flex; flex-direction: column; padding: 5px 8px; border-radius: 10px; background: var(--secondary-background-color, rgba(0,0,0,.04)); border: 1px solid transparent; }',
      '.fname { font-size: 0.75em; color: var(--secondary-text-color); display: flex; align-items: center; gap: 3px; }',
      '.fname ha-icon { --mdc-icon-size: 12px; }',
      '.fprice { font-size: 1.05em; font-weight: 500; color: var(--primary-text-color); font-variant-numeric: tabular-nums; }',
      '.fage { font-size: 0.7em; color: var(--secondary-text-color); }',
      '.fuel.empty { visibility: hidden; }',
      '.fuel.best { border-color: var(--success-color, #43a047); background: color-mix(in srgb, var(--success-color, #43a047) 10%, transparent); }',
      '.fuel.best .fprice, .fuel.best .fname { color: var(--success-color, #43a047); }',
      '.fuel.out { opacity: .85; border-color: var(--warning-color, #ffa600); background: color-mix(in srgb, var(--warning-color, #ffa600) 8%, transparent); }',
      '.fuel.out .fprice { font-size: 0.9em; color: var(--warning-color, #ffa600); }',
      '.fuel.nodata { border-style: dashed; border-color: var(--divider-color, rgba(0,0,0,.2)); }',
      '.fuel.nodata .fprice { font-size: 0.9em; font-weight: 500; color: var(--secondary-text-color); }',
      '.details { margin: 10px 0 2px 52px; font-size: 0.85em; color: var(--primary-text-color); }',
      '.dtitle { font-weight: 500; margin: 8px 0 4px; color: var(--secondary-text-color); }',
      '.details table { border-collapse: collapse; }',
      '.details td { padding: 1px 12px 1px 0; }',
      '.details tr.today td { font-weight: 500; }',
      '.services { display: flex; flex-wrap: wrap; gap: 4px; }',
      '.services span { border-radius: 12px; padding: 2px 10px; font-size: 12px; font-weight: 500; background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--secondary-text-color); }',
      '.directions { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 8px 16px; border-radius: 10px; background: var(--primary-color); color: var(--text-primary-color, #fff); text-decoration: none; font-weight: 500; font-size: 1.05em; box-shadow: 0 1px 3px rgba(0,0,0,.25); }',
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
var CARBURANTS_MAP_DEFAULTS = { height: 400, show_icon: true, show_fullscreen: true, show_home: true, show_logo: true, show_name: true, map_style: 'ha', theme: 'auto', hide_out_of_stock_stations: true };

var CARBURANTS_OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
var CARBURANTS_IGN_WMTS = 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

// Base maps that need no API key. "osm" goes through Home Assistant (see _tileUrl).
// photo: aerial imagery, never darkened by the dark theme.
var CARBURANTS_MAP_STYLES = {
  // Home Assistant's own map: OpenStreetMap vector tiles and the style its map card uses (2026.9+).
  ha: { vector: true, maxZoom: 20, attribution: CARBURANTS_OSM_ATTRIBUTION },
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
    fullscreen: 'Plein écran',
    exit_fullscreen: 'Quitter le plein écran',
    editor: {
      entity: 'Capteur Stations',
      title: 'Titre (vide pour aucun)',
      fuel: 'Carburant affiché sur les repères (vide = le moins cher disponible)',
      height: 'Hauteur (px)',
      zoom: 'Zoom (vide = ajusté aux stations)',
      map_style: 'Fond de carte',
      theme: 'Thème du fond de carte',
      tile_url: 'URL des tuiles ({z}, {x}, {y})',
      tile_attribution: 'Attribution des tuiles',
      show_icon: 'Icône',
      show_fullscreen: 'Bouton plein écran',
      show_home: 'Domicile',
      show_logo: 'Logos des enseignes',
      show_name: 'Nom des stations sur les repères',
      hide_out_of_stock_stations: 'Masquer les stations en rupture',
    },
    themes: { auto: 'Selon le thème', light: 'Clair', dark: 'Sombre' },
    styles: {
      ha: 'Home Assistant',
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
    fullscreen: 'Full screen',
    exit_fullscreen: 'Exit full screen',
    editor: {
      entity: 'Stations sensor',
      title: 'Title (empty for none)',
      fuel: 'Fuel shown on markers (empty = cheapest in stock)',
      height: 'Height (px)',
      zoom: 'Zoom (empty = fit the stations)',
      map_style: 'Base map',
      theme: 'Base map theme',
      tile_url: 'Tile URL ({z}, {x}, {y})',
      tile_attribution: 'Tile attribution',
      show_icon: 'Icon',
      show_fullscreen: 'Full screen button',
      show_home: 'Home',
      show_logo: 'Brand logos',
      show_name: 'Station names on markers',
      hide_out_of_stock_stations: 'Hide out of stock stations',
    },
    themes: { auto: 'Follow theme', light: 'Light', dark: 'Dark' },
    styles: {
      ha: 'Home Assistant',
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

var CARBURANTS_FS_SELECTORS = [':fullscreen', ':-webkit-full-screen'];

// MapLibre GL draws Home Assistant's vector map; the adapter puts it in Leaflet, as the native
// map card does. Both ship with the integration, at the versions Home Assistant uses.
var carbMaplibrePromise = null;
function carbLoadMaplibre() {
  if (!carbMaplibrePromise) {
    carbMaplibrePromise = import(CARBURANTS_STATIC + '/maplibre/maplibre-gl.mjs?v=6.14.0').then(function (module) {
      window.maplibregl = window.maplibregl || module;
      if (window.MaplibreGLLeaflet && window.MaplibreGLLeaflet.maplibreGL) return window.MaplibreGLLeaflet.maplibreGL;
      return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = CARBURANTS_STATIC + '/maplibre/leaflet-maplibre-gl.js?v=0.1.4';
        script.onload = function () { resolve(window.MaplibreGLLeaflet.maplibreGL); };
        script.onerror = function () { reject(new Error('MapLibre adapter could not be loaded')); };
        document.head.appendChild(script);
      });
    }).catch(function (err) {
      carbMaplibrePromise = null;
      throw err;
    });
  }
  return carbMaplibrePromise;
}

function carbSupportsWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch (err) {
    return false;
  }
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
    if (previous && this._tilesKey(previous) !== this._tilesKey(this._config)) this._vectorFailed = false;
    this._reloadTilesIfNeeded();
    // Read the current state now: a config change must redraw at once, not at the next hass update.
    this._lastState = this._hass && this._entityId() ? this._hass.states[this._entityId()] || null : null;
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
    } else if (this._root) {
      // Theme switched in Home Assistant: dark filter and light / dark vector style follow.
      this._root.querySelector('.map').classList.toggle('dark', this._darkTiles());
      this._reloadTilesIfNeeded();
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
    if (this._tiles && this._tiles.getMaplibreMap) {
      this._hass.callWS({ type: 'map_tiles/access_token' }).then(function (res) { self._mapToken = res.token; }, function () {});
    } else if (this._tiles && this._tiles._url.indexOf('/api/map_tiles/') === 0) {
      this._tileUrl().then(function (url) { if (self._tiles) self._tiles.setUrl(url); });
    }
    setTimeout(this._invalidate.bind(this), 0);
  }

  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    clearInterval(this._tokenTimer);
    document.removeEventListener('click', this._onOutside, true);
    if (this._onFsChange) {
      document.removeEventListener('fullscreenchange', this._onFsChange);
      document.removeEventListener('webkitfullscreenchange', this._onFsChange);
      document.removeEventListener('keydown', this._onFsKey);
      this._onFsChange = null;
    }
    this._pseudoFs = false;
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

  _dark(config) {
    var theme = (config || this._config).theme;
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return !!(this._hass && this._hass.themes && this._hass.themes.darkMode);
  }

  _style() {
    var style = this._config.map_style;
    if (style === 'custom' && !this._config.tile_url) style = 'osm';
    return CARBURANTS_MAP_STYLES[style] ? style : 'osm';
  }

  // What the base layer depends on; the vector style also has a light and a dark version.
  _tilesKey(config) {
    var vector = (CARBURANTS_MAP_STYLES[config.map_style || CARBURANTS_MAP_DEFAULTS.map_style] || {}).vector;
    return [config.map_style, config.tile_url, config.tile_attribution, vector && this._dark(config)].join('|');
  }

  // Raster tiles are darkened with a filter; aerial imagery and the vector style (dark version) are not.
  _darkTiles() {
    var spec = CARBURANTS_MAP_STYLES[this._style()];
    return this._dark() && !spec.photo && !spec.vector && !this._vectorFailed;
  }

  _ensureShell() {
    if (this._root) return;
    this._root = this.attachShadow({ mode: 'open' });
    this._root.innerHTML =
      '<link rel="stylesheet" href="' + CARBURANTS_STATIC + '/leaflet/leaflet.css?v=1.9.4">' +
      '<link rel="stylesheet" href="' + CARBURANTS_STATIC + '/maplibre/maplibre-gl.css?v=6.14.0">' +
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
    header.innerHTML = icon + '<span class="hname">' + carbEsc(title || '') + '</span>';
    var mapEl = this._root.querySelector('.map');
    mapEl.style.height = Math.max(150, Number(this._config.height) || 400) + 'px';
    // Follows the Home Assistant theme live when theme is auto.
    mapEl.classList.toggle('dark', this._darkTiles());
    this._reloadTilesIfNeeded();
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
    if (this._config.show_fullscreen) this._addFullscreenControl(L);
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
    this._tilesLoadedKey = key;
    if (spec.vector && !this._vectorFailed) {
      this._loadVector(L, map, key);
      return;
    }
    if (spec.vector) {
      style = 'osm';
      spec = CARBURANTS_MAP_STYLES.osm;
      options = { maxZoom: spec.maxZoom, attribution: spec.attribution };
    }
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

  // Home Assistant's style, fetched from the instance like its map card does: /static/map/light.json
  // or dark.json, tiles and glyphs through /api/map_tiles with the rotating token in a header.
  // Anything missing (WebGL2, Home Assistant before 2026.9) falls back to raster OpenStreetMap.
  // The base layer no longer matches the config or the theme (light / dark vector style): swap it.
  _reloadTilesIfNeeded() {
    if (!this._map || this._tilesLoadedKey === this._tilesKey(this._config)) return;
    if (this._tiles) this._map.removeLayer(this._tiles);
    this._tiles = null;
    this._loadTiles(window.L);
  }

  _loadVector(L, map, key) {
    var self = this;
    var dark = this._dark();
    var hass = this._hass;
    var fallback = function (err) {
      if (self._map !== map || self._tilesKey(self._config) !== key) return;
      // eslint-disable-next-line no-console
      console.info('carburants-france-map-card: Home Assistant map style unavailable, using raster tiles', err);
      self._vectorFailed = true;
      self._loadTiles(L);
    };
    if (!carbSupportsWebGL2()) {
      fallback(new Error('WebGL2 not supported'));
      return;
    }
    Promise.all([
      carbLoadMaplibre(),
      hass.callWS({ type: 'map_tiles/access_token' }),
      fetch('/static/map/' + (dark ? 'dark' : 'light') + '.json').then(function (resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      }),
    ]).then(function (results) {
      if (self._map !== map || self._tilesKey(self._config) !== key) return;
      var maplibreGL = results[0];
      var style = results[2];
      self._mapToken = results[1].token;
      var absolute = function (url) { return new URL(url, location.href).href; };
      if (typeof style.sprite === 'string') style.sprite = absolute(style.sprite);
      else if (Array.isArray(style.sprite)) {
        style.sprite = style.sprite.map(function (sprite) { return Object.assign({}, sprite, { url: absolute(sprite.url) }); });
      }
      self._tiles = maplibreGL({
        style: style,
        attributionControl: { customAttribution: CARBURANTS_OSM_ATTRIBUTION },
        // Same as the native map card: the token in a header keeps tile URLs, and the cache, stable.
        transformRequest: function (url) {
          var full = new URL(url, location.href);
          if (full.origin === location.origin && full.pathname.indexOf('/api/map_tiles/') === 0) {
            return { url: full.href, headers: { 'X-Map-Tiles-Token': self._mapToken } };
          }
          return { url: full.href };
        },
      });
      self._tiles.addTo(map);
      self._scheduleTokenRefresh();
    }).catch(fallback);
  }

  _scheduleTokenRefresh() {
    clearInterval(this._tokenTimer);
    if (!this._tiles) return;
    var self = this;
    if (this._tiles.getMaplibreMap) {
      // Vector: the request hook reads the current token.
      this._tokenTimer = setInterval(function () {
        self._hass.callWS({ type: 'map_tiles/access_token' }).then(function (res) { self._mapToken = res.token; }, function () {});
      }, 20 * 60 * 1000);
      return;
    }
    if (this._tiles._url.indexOf('/api/map_tiles/') !== 0) return;
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
    this._tilesLoadedKey = null;
  }

  // Real full screen where the browser allows it on an element; elsewhere (iPhone Safari and
  // the iOS app) the card covers the window instead.
  _addFullscreenControl(L) {
    var self = this;
    var mt = CarburantsMapI18n[carbLang(this._hass)];
    var Fullscreen = L.Control.extend({
      onAdd: function () {
        var bar = L.DomUtil.create('div', 'leaflet-bar carb-fs');
        var link = L.DomUtil.create('a', '', bar);
        link.href = '#';
        link.setAttribute('role', 'button');
        L.DomEvent.disableClickPropagation(bar);
        L.DomEvent.on(link, 'click', function (ev) {
          L.DomEvent.preventDefault(ev);
          self._toggleFullscreen();
        });
        self._fsLink = link;
        self._updateFullscreenButton(mt);
        return bar;
      },
    });
    new Fullscreen({ position: 'topleft' }).addTo(this._map);
    if (!this._onFsChange) {
      this._onFsChange = function () { self._fullscreenChanged(); };
      this._onFsKey = function (ev) { if (ev.key === 'Escape' && self._pseudoFs) self._toggleFullscreen(); };
      document.addEventListener('fullscreenchange', this._onFsChange);
      document.addEventListener('webkitfullscreenchange', this._onFsChange);
      document.addEventListener('keydown', this._onFsKey);
    }
  }

  _isFullscreen() {
    return this._pseudoFs || this._isNativeFullscreen();
  }

  // Not document.fullscreenElement: on a dashboard the card is deep in shadow roots, and the
  // document only sees the outermost host. The pseudo-class matches the card itself.
  _isNativeFullscreen() {
    for (var i = 0; i < CARBURANTS_FS_SELECTORS.length; i++) {
      try {
        if (this.matches(CARBURANTS_FS_SELECTORS[i])) return true;
      } catch (err) {
        // Selector unknown to this browser.
      }
    }
    return false;
  }

  _toggleFullscreen() {
    if (this._pseudoFs) {
      this._pseudoFs = false;
      this._fullscreenChanged();
      return;
    }
    if (this._isFullscreen()) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      return;
    }
    var request = this.requestFullscreen || this.webkitRequestFullscreen;
    var self = this;
    var pseudo = function () {
      self._pseudoFs = true;
      self._fullscreenChanged();
    };
    if (!request) {
      pseudo();
      return;
    }
    try {
      var result = request.call(this);
      if (result && result.catch) result.catch(pseudo);
    } catch (err) {
      pseudo();
    }
  }

  _fullscreenChanged() {
    var on = this._isFullscreen();
    var card = this._root && this._root.querySelector('ha-card');
    if (!card) return;
    card.classList.toggle('fullscreen', on);
    card.classList.toggle('pseudo', !!this._pseudoFs);
    this._updateFullscreenButton(CarburantsMapI18n[carbLang(this._hass)]);
    var self = this;
    // Leaflet and MapLibre resize to the new box, then the stations are fitted again.
    setTimeout(function () {
      self._fitted = false;
      self._invalidate();
    }, 50);
  }

  _updateFullscreenButton(mt) {
    if (!this._fsLink) return;
    var on = this._isFullscreen();
    var label = on ? mt.exit_fullscreen : mt.fullscreen;
    var path = on
      ? 'M14,14H19V16H16V19H14V14M5,14H10V19H8V16H5V14M8,5H10V10H5V8H8V5M19,8V10H14V5H16V8H19Z'
      : 'M5,5H10V7H7V10H5V5M14,5H19V10H17V7H14V5M17,14H19V19H14V17H17V14M10,17V19H5V14H7V17H10Z';
    this._fsLink.title = label;
    this._fsLink.setAttribute('aria-label', label);
    this._fsLink.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="' + path + '"/></svg>';
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

  // The fuel chosen in the editor, or null: each marker then shows its cheapest fuel in stock.
  _fuelKey(fuels) {
    var wanted = this._config.fuel;
    return wanted && fuels.some(function (f) { return f.key === wanted; }) ? wanted : null;
  }

  // The fuel a marker shows: the chosen one, else the cheapest in stock, else the most telling
  // unavailable one (shortage before no price), so "Rupture" only shows when nothing is in stock.
  _markerFuel(s, fuels, key) {
    if (key) return { key: key, fuel: s.fuels && s.fuels[key] };
    var cheapest = null;
    var fallback = null;
    fuels.forEach(function (f) {
      var fuel = s.fuels && s.fuels[f.key];
      if (!fuel || fuel.rupture === 'definitive') return;
      if (fuel.available) {
        if (!cheapest || fuel.price < cheapest.fuel.price) cheapest = { key: f.key, fuel: fuel };
      } else if (!fallback || (fuel.rupture && !fallback.fuel.rupture)) {
        fallback = { key: f.key, fuel: fuel };
      }
    });
    return cheapest || fallback || { key: null, fuel: null };
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
    var names = {};
    fuels.forEach(function (f) { names[f.key] = f.name; });
    var self = this;
    var now = new Date();
    var points = [];
    var signature = stations.map(function (s) { return s.station_id; }).join(',');
    if (signature !== this._signature) this._fitted = false;
    this._signature = signature;

    this._layer.clearLayers();
    stations.forEach(function (s) {
      var shown = self._markerFuel(s, fuels, key);
      var fuel = shown.fuel;
      var fuelName = names[shown.key] || '';
      var state = !fuel || fuel.rupture === 'definitive' ? 'none'
        : !fuel.available ? (fuel.rupture ? 'out' : 'nodata')
        : best[shown.key] === fuel.price && stations.length > 1 ? 'best' : 'ok';
      var label = state === 'ok' || state === 'best' ? self._price(fuel.price)
        : state === 'out' ? t.out_of_stock : state === 'nodata' ? t.no_price : '—';
      // Without a chosen fuel, say which one the price is for.
      var priceHtml = (!key && fuelName && (state === 'ok' || state === 'best') ? '<span class="pfuel">' + carbEsc(fuelName) + '</span> ' : '') + carbEsc(label);
      var logo = '';
      if (self._config.show_logo) {
        var name = s.brand || s.station_name || '';
        var known = carbLogo(s);
        logo = known
          ? '<img' + (known.own ? ' class="own"' : '') + ' src="' + carbEsc(known.src) + '" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'ini\',textContent:' +
            carbEsc(JSON.stringify(carbInitials(name))) + '}))">'
          : '<span class="ini" style="background:' + carbBrandColor(name || 'station') + '">' + carbEsc(carbInitials(name) || '⛽') + '</span>';
      }
      var icon = L.divIcon({
        className: 'carb-marker',
        html: '<div class="pin ' + state + '" title="' + carbEsc(s.station_name + ' · ' + fuelName) + '">' + logo +
          (self._config.show_name
            ? '<span class="ptext"><span class="pname-pin">' + carbEsc(s.station_name) + '</span><span class="price">' + priceHtml + '</span></span>'
            : '<span class="price">' + priceHtml + '</span>') +
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
      '.header { display: flex; align-items: center; gap: 12px; min-height: 40px; padding: 16px 16px 8px; }',
      '.hname { font-size: 18px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.icon-link { display: flex; flex: none; }',
      '.icon { width: 40px; height: 40px; display: block; }',
      '.header[hidden], .message[hidden] { display: none; }',
      '.message { padding: 12px 16px; color: var(--secondary-text-color); }',
      '.map { width: 100%; background: var(--secondary-background-color, #e5e5e5); z-index: 0; }',
      // Full screen: the card fills the screen, the map takes what the title leaves.
      ':host(:fullscreen) { background: var(--card-background-color, #fff); }',
      'ha-card.fullscreen { display: flex !important; flex-direction: column; width: 100%; height: 100vh; height: 100dvh; border-radius: 0; box-sizing: border-box; }',
      'ha-card.fullscreen .map { flex: 1; height: auto !important; }',
      'ha-card.pseudo { position: fixed; inset: 0; z-index: 9999; height: 100vh; height: 100dvh; padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box; }',
      '.carb-fs a { display: flex; align-items: center; justify-content: center; color: #333; cursor: pointer; }',
      '.leaflet-container { font: inherit; }',
      '.map.dark .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9); }',
      '.carb-marker { background: none; border: none; }',
      '.ptext { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }',
      '.pfuel { font-size: 10px; font-weight: 600; opacity: .75; }',
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
      '.leaflet-container a.pdir { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; padding: 8px 14px; border-radius: 10px; background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); text-decoration: none; font-weight: 500; font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,.25); }',
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
          { name: 'show_fullscreen', selector: { boolean: {} } },
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

