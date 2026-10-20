var CARBURANTS_CARD_VERSION = '0.1.0';

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
    not_sold: 'Non vendu',
    since: 'depuis',
    best: 'Meilleur prix',
    updated: 'Mis à jour',
    hours: 'Horaires',
    services: 'Services',
    directions: 'Itinéraire',
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
      show_address: 'Adresse',
      show_distance: 'Distance',
      show_hours: 'Ouverture',
      show_updated: 'Date des prix',
      show_out_of_stock: 'Carburants en rupture',
      highlight_best: 'Meilleur prix en vert',
      show_refresh: 'Bouton Actualiser',
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
    not_sold: 'Not sold',
    since: 'since',
    best: 'Best price',
    updated: 'Updated',
    hours: 'Opening hours',
    services: 'Services',
    directions: 'Directions',
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
      show_address: 'Address',
      show_distance: 'Distance',
      show_hours: 'Opening status',
      show_updated: 'Price date',
      show_out_of_stock: 'Out of stock fuels',
      highlight_best: 'Best price in green',
      show_refresh: 'Refresh button',
    },
    sort_options: { price: 'Price', distance: 'Distance', name: 'Name', config: 'Configuration order' },
  },
};

var CARBURANTS_DEFAULTS = {
  sort: 'price',
  max_stations: 0,
  show_icon: true,
  show_logo: true,
  show_address: true,
  show_distance: true,
  show_hours: true,
  show_updated: true,
  show_out_of_stock: true,
  highlight_best: true,
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
    this._expanded = this._expanded || {};
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
  }

  disconnectedCallback() {
    clearInterval(this._timer);
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
      '<ha-card><div class="header"></div><div class="list"></div></ha-card>';
    this._root.querySelector('.list').addEventListener('click', this._onListClick.bind(this));
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
    var icon = this._config.show_icon ? '<img class="icon" src="' + CARBURANTS_ICON + '" alt="">' : '';

    if (!st) {
      header.innerHTML = '<div class="title">' + icon + carbEsc(title) + '</div>';
      list.innerHTML = '<div class="empty">' + carbEsc(t.no_entity) + '</div>';
      return;
    }

    var fuels = this._fuels();
    var stations = (st.attributes.stations || []).slice();
    var best = this._bestPrices(stations, fuels);
    stations = this._sorted(stations, fuels);
    if (this._config.max_stations > 0) stations = stations.slice(0, this._config.max_stations);

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
      list.innerHTML = '<div class="empty">' + carbEsc(t.empty) + '</div>';
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
    if (s.logo) {
      return '<img class="logo" src="' + carbEsc(s.logo) + '" alt="' + carbEsc(label) + '" loading="lazy" referrerpolicy="no-referrer"' +
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
    var expanded = !!this._expanded[id];
    var opening = cfg.show_hours ? carbOpening(s, t, now) : null;
    var self = this;

    var meta = [];
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
    if (ev.target.closest('a')) return;
    var item = ev.target.closest('.station');
    if (!item) return;
    var id = item.getAttribute('data-id');
    this._expanded[id] = !this._expanded[id];
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
      '.icon { width: 28px; height: 28px; margin-right: 10px; flex: none; }',
      '.count { font-size: 0.8em; font-weight: 400; color: var(--secondary-text-color); margin-left: 6px; }',
      '.refresh-btn.spinning ha-icon { animation: carb-spin 1s linear infinite; }',
      '@keyframes carb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '.empty { padding: 12px 16px; color: var(--secondary-text-color); }',
      '.station { padding: 10px 16px; cursor: pointer; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.station:first-child { border-top: none; }',
      '.row { display: flex; align-items: center; gap: 12px; }',
      '.logo { width: 40px; height: 40px; flex: none; border-radius: 10px; object-fit: contain; background: #fff; padding: 3px; box-sizing: border-box; border: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.logo.badge { display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.95em; letter-spacing: .5px; border: none; }',
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
      '.details { margin: 10px 0 2px 52px; font-size: 0.85em; color: var(--primary-text-color); }',
      '.dtitle { font-weight: 500; margin: 8px 0 4px; color: var(--secondary-text-color); }',
      '.details table { border-collapse: collapse; }',
      '.details td { padding: 1px 12px 1px 0; }',
      '.details tr.today td { font-weight: 600; }',
      '.services { display: flex; flex-wrap: wrap; gap: 4px; }',
      '.services span { border: 1px solid var(--divider-color, rgba(0,0,0,.12)); border-radius: 10px; padding: 1px 8px; font-size: 0.9em; }',
      '.directions { display: inline-flex; align-items: center; gap: 4px; margin-top: 10px; color: var(--primary-color); text-decoration: none; font-weight: 500; }',
      '.directions ha-icon { --mdc-icon-size: 18px; }',
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
          { name: 'show_address', selector: { boolean: {} } },
          { name: 'show_distance', selector: { boolean: {} } },
          { name: 'show_hours', selector: { boolean: {} } },
          { name: 'show_updated', selector: { boolean: {} } },
          { name: 'show_out_of_stock', selector: { boolean: {} } },
          { name: 'highlight_best', selector: { boolean: {} } },
          { name: 'show_refresh', selector: { boolean: {} } },
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
