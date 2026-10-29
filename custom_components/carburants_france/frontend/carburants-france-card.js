var CARBURANTS_CARD_VERSION = '1.9.0';

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
    refresh_failed: 'Actualisation impossible :',
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
    since: 'depuis',
    best: 'Meilleur prix',
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
      language: 'Langue',
      language_auto: 'Selon Home Assistant',
    },
    sort_options: { price: 'Prix', distance: 'Distance', name: 'Nom', config: 'Ordre de configuration' },
  },
  en: {
    default_title: 'Fuel',
    stations: 'stations',
    empty: 'No station to show',
    no_entity: 'Stations sensor not found. Add the Carburants France integration or set "entity".',
    refresh: 'Refresh',
    refresh_failed: 'Refresh failed:',
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
    since: 'since',
    best: 'Best price',
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
      language: 'Language',
      language_auto: 'Home Assistant language',
    },
    sort_options: { price: 'Price', distance: 'Distance', name: 'Name', config: 'Configuration order' },
  },
  de: {
    default_title: 'Kraftstoffe',
    stations: 'Tankstellen',
    empty: 'Keine Tankstelle anzuzeigen',
    no_entity: 'Sensor „Tankstellen“ nicht gefunden. Füge die Integration Carburants France hinzu oder setze „entity“.',
    refresh: 'Aktualisieren',
    refresh_failed: 'Aktualisierung fehlgeschlagen:',
    open: 'Geöffnet',
    closed: 'Geschlossen',
    closes_at: 'schließt um',
    opens_at: 'öffnet um',
    always_open: '24/7',
    automate: 'Tankautomat 24/7',
    out_of_stock: 'Nicht verfügbar',
    no_price: 'Kein Preis',
    no_price_hint: 'Noch weder Preis noch Engpass veröffentlicht',
    rupture_ended: 'Engpass behoben',
    since: 'seit',
    best: 'Bester Preis',
    hours: 'Öffnungszeiten',
    services: 'Leistungen',
    directions: 'Route',
    show_all_one: 'Die nicht verfügbare Tankstelle anzeigen',
    show_all: 'Die {n} nicht verfügbaren Tankstellen anzeigen',
    hide_out: 'Nicht verfügbare Tankstellen ausblenden',
    all_out: 'Alle beobachteten Kraftstoffe sind an diesen Tankstellen nicht verfügbar.',
    highway: 'Autobahn',
    days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    editor: {
      entity: 'Sensor Tankstellen',
      title: 'Titel',
      fuels: 'Angezeigte Kraftstoffe (alle, wenn leer)',
      sort: 'Sortierung',
      sort_fuel: 'Kraftstoff für die Sortierung nach Preis',
      max_stations: 'Maximale Anzahl Tankstellen (0 = alle)',
      show_icon: 'Symbol',
      show_logo: 'Markenlogos',
      show_brand: 'Marke',
      show_address: 'Adresse',
      show_distance: 'Entfernung',
      show_hours: 'Öffnungsstatus',
      show_updated: 'Preisdatum',
      show_out_of_stock: 'Nicht verfügbare Kraftstoffe',
      highlight_best: 'Bester Preis in Grün',
      show_refresh: 'Schaltfläche Aktualisieren',
      hide_out_of_stock_stations: 'Nicht verfügbare Tankstellen ausblenden',
      language: 'Sprache',
      language_auto: 'Wie Home Assistant',
    },
    sort_options: { price: 'Preis', distance: 'Entfernung', name: 'Name', config: 'Reihenfolge der Konfiguration' },
  },
  es: {
    default_title: 'Carburantes',
    stations: 'estaciones',
    empty: 'No hay ninguna estación que mostrar',
    no_entity: 'No se encuentra el sensor Estaciones. Añade la integración Carburants France o indica «entity».',
    refresh: 'Actualizar',
    refresh_failed: 'Error al actualizar:',
    open: 'Abierta',
    closed: 'Cerrada',
    closes_at: 'cierra a las',
    opens_at: 'abre a las',
    always_open: '24 h',
    automate: 'Autoservicio 24 h',
    out_of_stock: 'Agotado',
    no_price: 'Sin precio',
    no_price_hint: 'Aún no se ha publicado ni precio ni desabastecimiento',
    rupture_ended: 'desabastecimiento terminado',
    since: 'desde',
    best: 'Mejor precio',
    hours: 'Horario',
    services: 'Servicios',
    directions: 'Cómo llegar',
    show_all_one: 'Mostrar la estación agotada',
    show_all: 'Mostrar las {n} estaciones agotadas',
    hide_out: 'Ocultar las estaciones agotadas',
    all_out: 'Todos los carburantes seguidos están agotados en estas estaciones.',
    highway: 'Autopista',
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    editor: {
      entity: 'Sensor Estaciones',
      title: 'Título',
      fuels: 'Carburantes mostrados (todos si está vacío)',
      sort: 'Orden',
      sort_fuel: 'Carburante para ordenar por precio',
      max_stations: 'Número máximo de estaciones (0 = todas)',
      show_icon: 'Icono',
      show_logo: 'Logotipos de las marcas',
      show_brand: 'Marca',
      show_address: 'Dirección',
      show_distance: 'Distancia',
      show_hours: 'Estado de apertura',
      show_updated: 'Fecha de los precios',
      show_out_of_stock: 'Carburantes agotados',
      highlight_best: 'Mejor precio en verde',
      show_refresh: 'Botón Actualizar',
      hide_out_of_stock_stations: 'Ocultar las estaciones agotadas',
      language: 'Idioma',
      language_auto: 'Según Home Assistant',
    },
    sort_options: { price: 'Precio', distance: 'Distancia', name: 'Nombre', config: 'Orden de configuración' },
  },
};

var CARBURANTS_DEFAULTS = {
  language: 'auto',
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
  return String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Card language: the `language` option when set (en/fr/de/es), else Home Assistant's language.
function carbLang(hass, language) {
  if (language && CarburantsI18n[language]) return language;
  var lang = ((hass && (hass.locale?.language || hass.language)) || navigator.language || 'en').slice(0, 2);
  return CarburantsI18n[lang] ? lang : 'en';
}

// Number and date locale: the configured language wins over Home Assistant's.
function carbLocale(hass, language) {
  if (language && CarburantsI18n[language]) return language;
  return (hass?.locale?.language) || navigator.language || 'fr';
}

// Choices of the editors' `language` option, each language in its own name.
function carbLanguageOptions(autoLabel) {
  return [{ value: 'auto', label: autoLabel }].concat(
    [['en', 'English'], ['fr', 'Français'], ['de', 'Deutsch'], ['es', 'Español']].map((l) => ({ value: l[0], label: l[1] })),
  );
}

function carbTitleCase(s) {
  s = String(s || '');
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s'-])\S/g, (m) => m.toUpperCase()) : s;
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
  return !fuels.some((f) => {
    var fuel = station.fuels?.[f.key];
    return fuel?.available;
  });
}

// Lowest price in stock per fuel key, over the given stations.
function carbBestPrices(stations, fuels) {
  var best = {};
  fuels.forEach((f) => {
    stations.forEach((s) => {
      var fuel = s.fuels?.[f.key];
      if (fuel?.available && (best[f.key] == null || fuel.price < best[f.key])) best[f.key] = fuel.price;
    });
  });
  return best;
}

// Stations shown: the out of stock ones are left out unless asked (hide_out_of_stock_stations).
// hidden: how many were left out (the "show all" button).
function carbVisibleStations(stations, fuels, config, showAll) {
  var hidden = config.hide_out_of_stock_stations ? stations.filter((s) => carbAllOut(s, fuels)).length : 0;
  var shown = hidden && !showAll ? stations.filter((s) => !carbAllOut(s, fuels)) : stations.slice();
  return { shown: shown, hidden: hidden };
}

function carbToggleLabel(t, showAll, hidden) {
  if (showAll) return t.hide_out;
  return hidden === 1 ? t.show_all_one : t.show_all.replace('{n}', hidden);
}

// Gives ha-form a schema only when it differs from the current one (the fuels follow the entity).
function carbSetSchema(form, schema) {
  var key = JSON.stringify(schema);
  if (form._carbSchemaKey === key) return;
  form._carbSchemaKey = key;
  form.schema = schema;
}

// Calls onOutside for a click anywhere outside the element (shadow DOM aware). A click, not a
// pointerdown: collapsing on press would shift the layout under the pointer before the click.
function carbOutsideListener(element, onOutside) {
  return (ev) => {
    var path = ev.composedPath ? ev.composedPath() : [];
    if (path.indexOf(element) === -1) onOutside();
  };
}

// Brand logos shipped with the integration (frontend/brands, the logo pack of aaos-carburants), found
// from the brand, then the station name. keys: names in lower case without accents nor punctuation; a key
// matches the whole name, or its start when 4 letters or more; the longest key wins ("totalaccess" before
// "total"). dark: white logo, drawn on a dark tile. tile: the logo is a tile of its own, drawn as is.
var CARBURANTS_BRAND_LOGOS = [
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
var CARBURANTS_LOGO_KEYS = [];
CARBURANTS_BRAND_LOGOS.forEach((b) => {
  b.keys.forEach((key) => { CARBURANTS_LOGO_KEYS.push({ key: key, brand: b }); });
});
CARBURANTS_LOGO_KEYS.sort((a, b) => b.key.length - a.key.length);

function carbBrandKey(name) {
  return String(name || '').normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function carbShippedLogo(name) {
  var key = carbBrandKey(name);
  if (!key) return null;
  var hit = CARBURANTS_LOGO_KEYS.find((e) => key === e.key || (e.key.length >= 4 && key.indexOf(e.key) === 0));
  return hit ? hit.brand : null;
}

// The station's logo: { src, own, tile, dark }, own when shipped with the integration, else the Wikidata one.
function carbLogo(s) {
  var brand = carbShippedLogo(s.brand) || carbShippedLogo(s.station_name);
  if (brand) {
    return { src: `/carburants_france_static/brands/${brand.file}.png?v=${CARBURANTS_CARD_VERSION}`, own: true, tile: !!brand.tile, dark: !!brand.dark };
  }
  return s.logo ? { src: s.logo, own: false } : null;
}

// Logo URLs that failed to load once: drawn as an initials badge right away on the next
// renders, so the browser does not replay the failing request on every redraw.
var CARBURANTS_FAILED_LOGOS = new Set();

// Extra classes of a logo <img>: own for a tile drawn as is, dark for a white logo.
function carbLogoClass(known) {
  return (known.tile ? ' own' : '') + (known.dark ? ' dark' : '');
}

// Fuel tile columns: 150 px tiles with one or two fuels, three in a row, four as 2 × 2 on a
// narrow card (in a row once there is room), more wrap on their own.
function carbFuelColumns(count) {
  var columns = count <= 2 ? `repeat(${count},minmax(0,150px))`
    : count === 3 ? 'repeat(3,minmax(0,1fr))'
      : count === 4 ? 'repeat(auto-fill,minmax(max(140px,calc((100% - 18px) / 4)),1fr))' : '';
  return columns ? ` style="grid-template-columns:${columns}"` : '';
}

// ── Fuel badges (pump colours, EU identifier from EN 16942) ───────────────────
// label: the name at the pump, code: the EU identifier in its circle (none when it repeats the label).
// Dark text on the light colours (gazole) for contrast, white on the dark ones.
var CARBURANTS_FUEL_BADGES = {
  gazole: { label: 'Gazole', code: 'B7', bg: '#E8A000', fg: '#1A1A1A' },
  sp95: { label: 'SP95', code: 'E5', bg: '#00A651', fg: '#FFFFFF' },
  sp98: { label: 'SP98', code: 'E5', bg: '#00703C', fg: '#FFFFFF' },
  e10: { label: 'SP95', code: 'E10', bg: '#009A3E', fg: '#FFFFFF' },
  e85: { label: 'E85', code: '', bg: '#0057A8', fg: '#FFFFFF' },
  gplc: { label: 'GPLc', code: '', bg: '#C62828', fg: '#FFFFFF' },
};

// Badge for a fuel; plain text for a key the card doesn't know.
function carbFuelBadge(key, name) {
  var b = CARBURANTS_FUEL_BADGES[key];
  if (!b) return `<span class="ftext">${carbEsc(name)}</span>`;
  var title = b.code ? `${name} (${b.code})` : name;
  return '<span class="fbadge" role="img" aria-label="' + carbEsc(title) + '" title="' + carbEsc(title) + '" style="--fb-bg:' + b.bg + ';--fb-fg:' + b.fg + '">' +
    carbEsc(b.label) + (b.code ? `<span class="fcode">${carbEsc(b.code)}</span>` : '') + '</span>';
}

var CARBURANTS_BADGE_STYLES = [
  '.fbadge { display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 2px 0 7px; border-radius: 9px; background: var(--fb-bg); color: var(--fb-fg); font-size: 11px; font-weight: 700; letter-spacing: .02em; line-height: 1; white-space: nowrap; box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); vertical-align: middle; }',
  '.fbadge:not(:has(.fcode)) { padding-right: 7px; }',
  '.fcode { display: inline-flex; align-items: center; justify-content: center; min-width: 14px; height: 14px; padding: 0 2px; box-sizing: border-box; border-radius: 7px; background: #fff; color: var(--fb-bg); font-size: 9px; font-weight: 700; letter-spacing: 0; }',
];

function carbMinutes(hhmm) {
  var p = String(hhmm).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
}

// Short weekday name in the card's locale ("lun.", "Mon", "Mo", "lun").
function carbWeekday(date, locale) {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
  } catch (_e) {
    return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date);
  }
}

// Opening status from the feed's weekly hours: { key: open|closed|always|automate, text }.
function carbOpening(station, t, now, locale) {
  var hours = station.hours || [];
  var day = now.getDay() === 0 ? 7 : now.getDay();
  var minutes = now.getHours() * 60 + now.getMinutes();
  var always = hours.length === 7 && hours.every((d) => !d.closed && d.ranges.some((r) => r[0] === '00:00' && carbMinutes(r[1]) >= 23 * 60 + 59));
  if (always) return { key: 'always', text: t.always_open };
  var today = hours.filter((d) => d.day === day)[0];
  // A range crossing midnight (e.g. Friday 22:00 → 02:00, end <= start) is open from its start on its own
  // day, and until its end on the next day: the small hours belong to the previous day's ranges.
  var yesterday = hours.filter((d) => d.day === ((day + 5) % 7) + 1)[0];
  var current = [];
  if (yesterday && !yesterday.closed) {
    yesterday.ranges.forEach((r) => {
      if (carbMinutes(r[1]) <= carbMinutes(r[0]) && minutes < carbMinutes(r[1])) current.push(r);
    });
  }
  if (today && !today.closed) {
    today.ranges.forEach((r) => {
      var start = carbMinutes(r[0]);
      var end = carbMinutes(r[1]);
      if (end <= start ? minutes >= start : minutes >= start && minutes < end) current.push(r);
    });
  }
  if (current.length) {
    return { key: 'open', text: `${t.open} · ${t.closes_at} ${current[0][1]}` };
  }
  if (station.automate_24_24) return { key: 'automate', text: t.automate };
  if (!hours.length) return null;
  // Next opening today, else the next open day.
  if (today && !today.closed) {
    var later = today.ranges.filter((r) => carbMinutes(r[0]) > minutes)[0];
    if (later) return { key: 'closed', text: `${t.closed} · ${t.opens_at} ${later[0]}` };
  }
  for (var k = 1; k <= 7; k++) {
    var d = hours.filter((x) => x.day === ((day - 1 + k) % 7) + 1)[0];
    if (d && !d.closed && d.ranges.length) {
      var label = k === 1 ? '' : `${carbWeekday(new Date(now.getFullYear(), now.getMonth(), now.getDate() + k), locale)} `;
      return { key: 'closed', text: `${t.closed} · ${t.opens_at} ${label}${d.ranges[0][0]}` };
    }
  }
  return { key: 'closed', text: t.closed };
}

function carbRelative(iso, locale) {
  var ts = Date.parse(iso || '');
  if (Number.isNaN(ts)) return '';
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
    if (!hass?.states) return null;
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
    var dark = !!hass.themes?.darkMode;
    if (first || st !== this._lastState || dark !== this._darkMode) {
      this._lastState = st;
      this._darkMode = dark;
      this._render();
    }
  }

  connectedCallback() {
    this._timer = setInterval(() => { this._render(); }, 60000);
    // A click elsewhere collapses the station and hides the out of stock ones again.
    this._onOutside = this._onOutside || carbOutsideListener(this, () => {
      if (this._expandedId === null && !this._showAll) return;
      this._expandedId = null;
      this._showAll = false;
      this._render();
    });
    document.addEventListener('click', this._onOutside, true);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
    document.removeEventListener('click', this._onOutside, true);
  }

  getCardSize() {
    var st = this._lastState;
    if (!this._config || !st?.attributes || !Array.isArray(st.attributes.stations)) return 1;
    var visible = carbVisibleStations(st.attributes.stations, this._fuels(), this._config, this._showAll);
    var n = visible.shown.length;
    if (this._config.max_stations > 0) n = Math.min(n, this._config.max_stations);
    return 1 + n * 2 + (visible.hidden ? 1 : 0);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  _entityId() {
    return (this._config?.entity) || CarburantsFranceCard._findEntity(this._hass);
  }

  _t() {
    return CarburantsI18n[carbLang(this._hass, this._config?.language)];
  }

  _locale() {
    return carbLocale(this._hass, this._config?.language);
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
    var all = (this._lastState?.attributes.fuels) || [];
    var wanted = this._config.fuels;
    if (!Array.isArray(wanted) || !wanted.length) return all;
    return all.filter((f) => wanted.indexOf(f.key) !== -1);
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
        '<span class="icon hbadge"><ha-icon icon="mdi:gas-station"></ha-icon></span></a>'
      : '';
    // The last refresh error stays in the button's tooltip until the next refresh.
    var refreshTitle = this._refreshError ? `${t.refresh_failed} ${this._refreshError}` : t.refresh;

    if (!st) {
      this._headerHtml = null;
      this._listHtml = null;
      header.innerHTML = `<div class="title">${icon}<div class="titles"><div class="hname">${carbEsc(title)}</div></div></div>`;
      list.innerHTML = `<div class="empty">${carbEsc(t.no_entity)}</div>`;
      this._root.querySelector('.footer').hidden = true;
      return;
    }

    var fuels = this._fuels();
    var all = st.attributes.stations || [];
    var best = carbBestPrices(all, fuels);
    var visible = carbVisibleStations(all, fuels, this._config, this._showAll);
    var hidden = visible.hidden;
    var stations = this._sorted(visible.shown, fuels);
    if (this._config.max_stations > 0) stations = stations.slice(0, this._config.max_stations);
    var footer = this._root.querySelector('.footer');
    footer.hidden = !hidden;
    footer.innerHTML = hidden
      ? '<button type="button" class="toggle"><ha-icon icon="' + (this._showAll ? 'mdi:eye-off-outline' : 'mdi:eye-outline') + '"></ha-icon>' +
        carbEsc(carbToggleLabel(t, this._showAll, hidden)) + '</button>'
      : '';

    var headerHtml =
      '<div class="title">' + icon + '<div class="titles"><div class="hname">' + carbEsc(title) + '</div>' +
      '<div class="hsub">' + carbEsc(st.state) + ' ' + carbEsc(t.stations) + '</div></div></div>' +
      (this._config.show_refresh
        ? '<ha-icon-button class="refresh-btn' + (this._refreshing ? ' spinning' : '') + '" label="' + carbEsc(t.refresh) +
          '" title="' + carbEsc(refreshTitle) + '"><ha-icon icon="mdi:refresh"></ha-icon></ha-icon-button>'
        : '');
    if (headerHtml !== this._headerHtml) {
      this._headerHtml = headerHtml;
      header.innerHTML = headerHtml;
      var refreshBtn = header.querySelector('.refresh-btn');
      if (refreshBtn) refreshBtn.addEventListener('click', this._refresh.bind(this));
    }

    var now = new Date();
    var listHtml = stations.length
      ? stations.map((s) => this._renderStation(s, fuels, best, t, now, stations.length > 1)).join('')
      : `<div class="empty">${carbEsc(hidden ? t.all_out : t.empty)}</div>`;
    // The minute timer only refreshes the relative ages and the opening status: when nothing
    // changed, leave the DOM alone (keeps a text selection, no listeners to re-attach).
    if (listHtml === this._listHtml) return;
    this._listHtml = listHtml;
    list.innerHTML = listHtml;
    list.querySelectorAll('img.logo').forEach((img) => {
      img.addEventListener('error', () => {
        CARBURANTS_FAILED_LOGOS.add(img.getAttribute('src'));
        var badge = document.createElement('div');
        badge.className = 'logo badge';
        badge.style.background = img.dataset.color;
        badge.textContent = img.dataset.initials;
        img.replaceWith(badge);
      });
    });
  }

  _sorted(stations, fuels) {
    var sort = this._config.sort;
    if (sort === 'config') return stations;
    if (sort === 'name') return stations.sort((a, b) => String(a.station_name).localeCompare(String(b.station_name)));
    var byDistance = (a, b) => {
      var da = a.distance == null ? Infinity : a.distance, db = b.distance == null ? Infinity : b.distance;
      return da - db;
    };
    if (sort === 'distance') return stations.sort(byDistance);
    var key = this._config.sort_fuel || (fuels[0]?.key);
    return stations.sort((a, b) => {
      var fa = a.fuels?.[key], fb = b.fuels?.[key];
      var pa = fa?.available ? fa.price : Infinity, pb = fb?.available ? fb.price : Infinity;
      return pa - pb || byDistance(a, b);
    });
  }

  _logoHtml(s) {
    if (!this._config.show_logo) return '';
    var label = s.brand || s.station_name || '';
    var color = carbBrandColor(label || 'station');
    var initials = carbInitials(label);
    var known = carbLogo(s);
    var failed = known && CARBURANTS_FAILED_LOGOS.has(known.src);
    if (known && !failed) {
      return '<img class="logo' + carbLogoClass(known) + '" src="' + carbEsc(known.src) + '" alt="' + carbEsc(label) + '" loading="lazy" referrerpolicy="no-referrer"' +
        ' data-color="' + color + '" data-initials="' + carbEsc(initials) + '">';
    }
    if (initials && (s.brand || failed)) return `<div class="logo badge" style="background:${color}">${carbEsc(initials)}</div>`;
    return '<div class="logo badge neutral"><ha-icon icon="mdi:gas-station"></ha-icon></div>';
  }

  _price(value) {
    return `${new Intl.NumberFormat(this._locale(), { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value)} €`;
  }

  _renderStation(s, fuels, best, t, now, many) {
    var cfg = this._config;
    var id = String(s.station_id);
    var expanded = this._expandedId === id;
    var opening = cfg.show_hours ? carbOpening(s, t, now, this._locale()) : null;

    var meta = [];
    if (cfg.show_brand && s.brand) meta.push(`<span class="brand">${carbEsc(s.brand)}</span>`);
    if (cfg.show_address) meta.push(`${carbEsc(s.address)}, ${carbEsc(carbTitleCase(s.city))}`);
    if (cfg.show_distance && s.distance != null) {
      meta.push(`${new Intl.NumberFormat(this._locale(), { maximumFractionDigits: 1 }).format(s.distance)} km`);
    }
    if (s.highway) meta.push(carbEsc(t.highway));

    // Empty slot, so each fuel stays in the same column from one station to the next.
    var slot = '<div class="fuel empty"></div>';
    var chipList = fuels.map((f) => {
      var fuel = s.fuels?.[f.key];
      if (!fuel) return slot;
      if (!fuel.available && !fuel.rupture) {
        // Shortage just lifted, or no price published yet: the fuel is still sold here.
        var ended = fuel.rupture_end ? carbRelative(fuel.rupture_end, this._locale()) : '';
        return '<div class="fuel nodata" title="' + carbEsc(t.no_price_hint) + '">' +
          '<span class="fname">' + carbFuelBadge(f.key, f.name) + '</span><span class="fprice">' + carbEsc(t.no_price) + '</span>' +
          (cfg.show_updated && ended ? `<span class="fage">${carbEsc(`${t.rupture_ended} ${ended}`)}</span>` : '') + '</div>';
      }
      if (!fuel.available) {
        if (!cfg.show_out_of_stock || fuel.rupture === 'definitive') return slot;
        var since = fuel.rupture_since ? carbRelative(fuel.rupture_since, this._locale()) : '';
        return '<div class="fuel out" title="' + carbEsc(t.out_of_stock + (since ? ` ${t.since} ${since}` : '')) + '">' +
          '<span class="fname">' + carbFuelBadge(f.key, f.name) + '</span><span class="fprice">' + carbEsc(t.out_of_stock) + '</span>' +
          (cfg.show_updated && since ? `<span class="fage">${carbEsc(since)}</span>` : '') + '</div>';
      }
      // Same criterion as the map card: more than one station actually shown.
      var isBest = cfg.highlight_best && best[f.key] === fuel.price && many;
      return '<div class="fuel' + (isBest ? ' best' : '') + '"' + (isBest ? ` title="${carbEsc(t.best)}"` : '') + '>' +
        '<span class="fname">' + carbFuelBadge(f.key, f.name) + (isBest ? ' <ha-icon icon="mdi:star"></ha-icon>' : '') + '</span>' +
        '<span class="fprice">' + this._price(fuel.price) + '</span>' +
        (cfg.show_updated ? `<span class="fage">${carbEsc(carbRelative(fuel.updated, this._locale()))}</span>` : '') +
        '</div>';
    });
    var chips = chipList.join('');
    var hasChips = chipList.some((c) => c !== slot);

    var html =
      '<div class="station" data-id="' + carbEsc(id) + '">' +
      '<div class="row">' + this._logoHtml(s) +
      '<div class="main">' +
      '<div class="line1"><span class="name">' + carbEsc(s.station_name) + '</span>' +
      (opening ? `<span class="opening ${opening.key}">${carbEsc(opening.text)}</span>` : '') + '</div>' +
      (meta.length ? `<div class="meta">${meta.join(' · ')}</div>` : '') +
      '</div>' +
      '<ha-icon class="chevron' + (expanded ? '' : ' closed') + '" icon="mdi:chevron-down"></ha-icon>' +
      '</div>' +
      (hasChips
        ? `<div class="fuels"${carbFuelColumns(fuels.length)}>${chips}</div>`
        : '');

    if (expanded) html += this._renderDetails(s, t, now);
    return `${html}</div>`;
  }

  _renderDetails(s, t, now) {
    var today = now.getDay() === 0 ? 7 : now.getDay();
    var rows = (s.hours || []).map((d) => {
      var value = d.closed || !d.ranges.length
        ? t.closed
        : d.ranges.map((r) => `${r[0]}–${r[1]}`).join(', ');
      return `<tr${d.day === today ? ' class="today"' : ''}><td>${carbEsc(t.days[d.day - 1])}</td><td>${carbEsc(value)}</td></tr>`;
    }).join('');
    var html = '<div class="details">';
    if (rows) html += `<div class="dtitle"><ha-icon icon="mdi:clock-outline"></ha-icon>${carbEsc(t.hours)}${s.automate_24_24 ? ` · ${carbEsc(t.automate)}` : ''}</div><table>${rows}</table>`;
    if (s.services?.length) {
      html += '<div class="dtitle"><ha-icon icon="mdi:storefront-outline"></ha-icon>' + carbEsc(t.services) + '</div><div class="services">' +
        s.services.map((x) => `<span>${carbEsc(x)}</span>`).join('') + '</div>';
    }
    if (s.latitude != null) {
      html += '<a class="directions" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' +
        encodeURIComponent(`${s.latitude},${s.longitude}`) + '"><ha-icon icon="mdi:directions"></ha-icon>' + carbEsc(t.directions) + '</a>';
    }
    return `${html}</div>`;
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
    if (st?.attributes.config_entry_id) data.config_entry_id = st.attributes.config_entry_id;
    this._refreshing = true;
    this._refreshError = null;
    this._render();
    var t = this._t();
    this._hass.callService('carburants_france', 'refresh', data).catch((err) => {
      this._refreshError = String((err?.message) || err);
      var btn = this._root.querySelector('.refresh-btn');
      if (btn) btn.title = `${t.refresh_failed} ${this._refreshError}`;
      // Home Assistant's toast, as the button tooltip alone goes unnoticed.
      this.dispatchEvent(new CustomEvent('hass-notification', {
        detail: { message: `${t.refresh_failed} ${this._refreshError}` }, bubbles: true, composed: true,
      }));
    }).finally(() => {
      this._refreshing = false;
      var btn = this._root.querySelector('.refresh-btn');
      if (btn) btn.classList.remove('spinning');
    });
  }

  static _styles() {
    return [
      ':host { display: block; }',
      'ha-card { padding: 0 0 8px; overflow: hidden; }',
      // Icon 12 px from the top and left edges; the first station's own 8 px padding sets the body 8 px below.
      '.header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 12px 0; }',
      '.title { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; }',
      '.titles { min-width: 0; }',
      '.hname { font-size: 16px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.hsub { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.icon-link { display: flex; flex: none; }',
      // Generic fuel pump in a round badge tinted with the theme's primary colour.
      '.hbadge { --c: var(--primary-color, #03a9f4); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); --mdc-icon-size: 24px; }',
      // The 48 px button would make the row taller than the 40 px icon: it overlaps the padding instead.
      '.refresh-btn { flex: none; margin: -4px -4px -4px 0; }',
      '.refresh-btn.spinning ha-icon { animation: carb-spin 1s linear infinite; }',
      '@keyframes carb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '.empty { padding: 12px 16px; color: var(--secondary-text-color); }',
      '.station { padding: 8px 12px; cursor: pointer; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.station:first-child { border-top: none; }',
      '.row { display: flex; align-items: center; gap: 10px; }',
      '.logo { width: 36px; height: 36px; flex: none; border-radius: 10px; object-fit: contain; background: #fff; padding: 3px; box-sizing: border-box; border: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.logo.badge { display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 13px; letter-spacing: .5px; border: none; }',
      // A logo that is a tile of its own (Total Access) keeps its own rounded corners.
      '.logo.own { padding: 0; border: none; background: none; border-radius: 0; }',
      '.logo.dark { background: #1f2a37; border-color: transparent; }',
      '.meta .brand { color: var(--primary-text-color); font-weight: 500; }',
      '.logo.badge.neutral { background: var(--secondary-background-color, #eee); color: var(--secondary-text-color); }',
      '.main { flex: 1; min-width: 0; }',
      '.line1 { display: flex; align-items: baseline; gap: 8px; justify-content: space-between; flex-wrap: wrap; }',
      '.name { font-weight: 500; color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.opening { font-size: 12px; white-space: nowrap; }',
      '.opening.open, .opening.always { color: var(--success-color, #43a047); }',
      '.opening.automate { color: var(--info-color, #039be5); }',
      '.opening.closed { color: var(--error-color, #db4437); }',
      '.meta { font-size: 12px; color: var(--secondary-text-color); margin-top: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }',
      '.chevron { flex: none; color: var(--secondary-text-color); --mdc-icon-size: 20px; transition: transform .2s ease; }',
      '.chevron.closed { transform: rotate(-90deg); }',
      '.fuels { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 6px; margin: 6px 0 0 46px; }',
      '.fuel { display: grid; flex-direction: column; padding: 4px 8px; border-radius: 10px; background: var(--secondary-background-color, rgba(127,127,127,.08)); border: 1px solid transparent; grid-template-columns: auto auto; justify-content: space-between; align-items: center; column-gap: 4px; row-gap: 2px; }',
      '.fname { font-size: 11px; color: var(--secondary-text-color); display: flex; align-items: center; gap: 3px; grid-column: 1; grid-row: 1; white-space: nowrap; }',
      '.fname ha-icon { --mdc-icon-size: 12px; }',
      ...CARBURANTS_BADGE_STYLES,
      '.fprice { font-size: 14px; font-weight: 500; color: var(--primary-text-color); font-variant-numeric: tabular-nums; grid-column: 1 / -1; grid-row: 2; white-space: nowrap; }',
      '.fage { font-size: 10px; color: var(--secondary-text-color); grid-column: 1 / -1; grid-row: 3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      // Wide tile (one or two fuels, 150 px wide): the age goes back next to the badge, two lines instead of three.
      '.fuel { container-type: inline-size; }',
      '@container (min-width: 130px) { .fage { grid-column: 2; grid-row: 1; justify-self: end; } }',
      '.fuel.empty { visibility: hidden; }',
      '.fuel.best { border-color: var(--success-color, #43a047); background: color-mix(in srgb, var(--success-color, #43a047) 10%, transparent); }',
      '.fuel.best .fprice, .fuel.best .fname ha-icon { color: var(--success-color, #43a047); }',
      '.fuel.out { opacity: .85; border-color: var(--warning-color, #ffa600); background: color-mix(in srgb, var(--warning-color, #ffa600) 8%, transparent); }',
      '.fuel.out .fprice { font-size: 13px; color: var(--warning-color, #ffa600); }',
      '.fuel.nodata { border-style: dashed; border-color: var(--divider-color, rgba(0,0,0,.2)); }',
      '.fuel.nodata .fprice { font-size: 13px; font-weight: 500; color: var(--secondary-text-color); }',
      '.details { margin: 8px 0 2px 46px; font-size: 12px; color: var(--primary-text-color); }',
      // Section title of the details (hours, services), as in the other ha-* cards.
      '.dtitle { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; color: var(--secondary-text-color); margin: 8px 0 6px; }',
      '.dtitle ha-icon { --mdc-icon-size: 16px; }',
      '.details table { border-collapse: collapse; }',
      '.details td { padding: 1px 12px 1px 0; }',
      '.details tr.today td { font-weight: 500; }',
      '.services { display: flex; flex-wrap: wrap; gap: 4px; }',
      '.services span { border-radius: 12px; padding: 2px 10px; font-size: 12px; font-weight: 500; background: var(--secondary-background-color, rgba(127,127,127,.12)); color: var(--secondary-text-color); }',
      '.directions { display: inline-flex; align-items: center; gap: 6px; margin-top: 8px; padding: 6px 14px; border-radius: 10px; background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent); color: var(--primary-color, #03a9f4); text-decoration: none; font-weight: 500; font-size: 15px; }',
      '.directions:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent); }',
      '.directions ha-icon { --mdc-icon-size: 20px; }',
      '.footer { padding: 2px 12px 0; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.footer[hidden] { display: none; }',
      '.toggle { display: inline-flex; align-items: center; gap: 6px; font: inherit; font-size: 12px; font-weight: 500; padding: 4px 0; border: none; background: none; color: var(--primary-color); cursor: pointer; }',
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
      this._setSchema();
    } else {
      this._render();
    }
  }

  // A new schema array re-renders ha-form: only when it changes, not on every hass update.
  _setSchema() {
    carbSetSchema(this._form, this._schema());
  }

  _fuelOptions() {
    var entity = this._config.entity || CarburantsFranceCard._findEntity(this._hass);
    var st = entity && this._hass.states[entity];
    var fuels = (st?.attributes.fuels) || [];
    return fuels.map((f) => ({ value: f.key, label: f.name }));
  }

  _schema() {
    var t = CarburantsI18n[carbLang(this._hass, this._config?.language)];
    var fuels = this._fuelOptions();
    var sorts = ['price', 'distance', 'name', 'config'].map((k) => ({ value: k, label: t.sort_options[k] }));
    return [
      { name: 'entity', selector: { entity: { domain: 'sensor', integration: 'carburants_france' } } },
      { name: 'title', selector: { text: {} } },
      { name: 'language', selector: { select: { mode: 'dropdown', options: carbLanguageOptions(t.editor.language_auto) } } },
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
      this._form = document.createElement('ha-form');
      // Read at each render: the labels follow the `language` option picked in this editor.
      this._form.computeLabel = (field) => CarburantsI18n[carbLang(this._hass, this._config?.language)].editor[field.name] || field.name;
      this._form.addEventListener('value-changed', this._valueChanged.bind(this));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._setSchema();
    // Show the defaults as set, so the toggles match what the card does.
    this._form.data = Object.assign({}, CARBURANTS_DEFAULTS, this._config);
  }

  _valueChanged(ev) {
    var value = Object.assign({}, ev.detail.value);
    // Keep the YAML short: drop options left at their default.
    Object.keys(CARBURANTS_DEFAULTS).forEach((key) => {
      if (value[key] === CARBURANTS_DEFAULTS[key]) delete value[key];
    });
    ['title', 'entity', 'sort_fuel'].forEach((key) => { if (!value[key]) delete value[key]; });
    if (Array.isArray(value.fuels) && !value.fuels.length) delete value.fuels;
    var rebuild = value.entity !== this._config.entity || value.language !== this._config.language;
    this._config = value;
    if (rebuild) this._setSchema();
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
    documentationURL: 'https://github.com/juju35/ha-carburants-france',
  });
  console.info(`%c CARBURANTS-FRANCE-CARD %c v${CARBURANTS_CARD_VERSION} `, 'color:#fff;background:#0e7c66;font-weight:700', 'color:#0e7c66;background:#fff');
}

// ── carburants-france-map-card ────────────────────────────────────────────────
// Leaflet ships with the integration: no CDN, only the map tiles come from the network.
var CARBURANTS_STATIC = '/carburants_france_static';
var CARBURANTS_MAP_DEFAULTS = { language: 'auto', height: 400, show_icon: true, show_fullscreen: true, show_home: true, show_logo: true, show_name: true, map_style: 'ha', theme: 'auto', hide_out_of_stock_stations: true, show_locate: true, show_search: true, radius: 5 };
// Radius choices of the nearby search, in km (the configured default is added when missing).
var CARBURANTS_RADII = [1, 2, 5, 10, 15, 20, 30, 50];
// Search icons, same drawings as ha-system-monitor-card.
var CARBURANTS_SEARCH_PATH = 'M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z';
var CARBURANTS_CLOSE_PATH = 'M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z';
function carbSvg(path) {
  return `<svg class="svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}

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
    attribution: `&copy; <a href="https://www.openstreetmap.fr" target="_blank" rel="noopener">OpenStreetMap France</a> | ${CARBURANTS_OSM_ATTRIBUTION}`,
  },
  ign: {
    url: `${CARBURANTS_IGN_WMTS}&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&FORMAT=image/png`,
    maxNativeZoom: 19,
    maxZoom: 20,
    attribution: 'Plan IGN &copy; <a href="https://www.ign.fr" target="_blank" rel="noopener">IGN</a>',
  },
  ign_photo: {
    url: `${CARBURANTS_IGN_WMTS}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&FORMAT=image/jpeg`,
    maxNativeZoom: 19,
    maxZoom: 20,
    photo: true,
    attribution: 'Photographies aériennes &copy; <a href="https://www.ign.fr" target="_blank" rel="noopener">IGN</a>',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 17,
    attribution: `${CARBURANTS_OSM_ATTRIBUTION}, SRTM | &copy; <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA)`,
  },
  cyclosm: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    maxZoom: 20,
    attribution: `<a href="https://www.cyclosm.org" target="_blank" rel="noopener">CyclOSM</a> | ${CARBURANTS_OSM_ATTRIBUTION}`,
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
    locate: 'Me localiser : stations autour de moi',
    back_to_followed: 'Revenir aux stations suivies',
    radius: 'Rayon de recherche',
    near_title: 'Stations à moins de {r} km',
    near_home_title: 'Stations à moins de {r} km du domicile',
    city_title: 'Stations : {q}',
    you: 'Vous êtes ici',
    search_city: 'Rechercher une ville ou un code postal',
    clear_search: 'Effacer la recherche',
    no_results: 'Aucune station trouvée.',
    no_position: 'Position indisponible.',
    followed: 'Station suivie',
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
      show_locate: 'Bouton « Me localiser »',
      show_search: 'Recherche par ville',
      radius: 'Rayon par défaut (km)',
      language: 'Langue',
      language_auto: 'Selon Home Assistant',
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
    locate: 'Locate me: stations around me',
    back_to_followed: 'Back to the followed stations',
    radius: 'Search radius',
    near_title: 'Stations within {r} km',
    near_home_title: 'Stations within {r} km of home',
    city_title: 'Stations: {q}',
    you: 'You are here',
    search_city: 'Search a town or postcode',
    clear_search: 'Clear the search',
    no_results: 'No station found.',
    no_position: 'Position unavailable.',
    followed: 'Followed station',
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
      show_locate: '"Locate me" button',
      show_search: 'Search by town',
      radius: 'Default radius (km)',
      language: 'Language',
      language_auto: 'Home Assistant language',
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
  de: {
    default_title: 'Tankstellenkarte',
    home: 'Zuhause',
    fullscreen: 'Vollbild',
    exit_fullscreen: 'Vollbild beenden',
    locate: 'Meinen Standort finden: Tankstellen in meiner Nähe',
    back_to_followed: 'Zurück zu den beobachteten Tankstellen',
    radius: 'Suchradius',
    near_title: 'Tankstellen im Umkreis von {r} km',
    near_home_title: 'Tankstellen im Umkreis von {r} km um das Zuhause',
    city_title: 'Tankstellen: {q}',
    you: 'Du bist hier',
    search_city: 'Ort oder Postleitzahl suchen',
    clear_search: 'Suche löschen',
    no_results: 'Keine Tankstelle gefunden.',
    no_position: 'Standort nicht verfügbar.',
    followed: 'Beobachtete Tankstelle',
    editor: {
      entity: 'Sensor Tankstellen',
      title: 'Titel (leer für keinen)',
      fuel: 'Kraftstoff auf den Markierungen (leer = günstigster verfügbarer)',
      height: 'Höhe (px)',
      zoom: 'Zoom (leer = an die Tankstellen angepasst)',
      map_style: 'Hintergrundkarte',
      theme: 'Design der Hintergrundkarte',
      tile_url: 'Kachel-URL ({z}, {x}, {y})',
      tile_attribution: 'Kachel-Quellenangabe',
      show_icon: 'Symbol',
      show_fullscreen: 'Schaltfläche Vollbild',
      show_home: 'Zuhause',
      show_logo: 'Markenlogos',
      show_name: 'Tankstellennamen auf den Markierungen',
      hide_out_of_stock_stations: 'Nicht verfügbare Tankstellen ausblenden',
      show_locate: 'Schaltfläche „Meinen Standort finden“',
      show_search: 'Suche nach Ort',
      radius: 'Standardradius (km)',
      language: 'Sprache',
      language_auto: 'Wie Home Assistant',
    },
    themes: { auto: 'Design folgen', light: 'Hell', dark: 'Dunkel' },
    styles: {
      ha: 'Home Assistant',
      osm: 'OpenStreetMap',
      osm_fr: 'OpenStreetMap France',
      ign: 'IGN-Karte',
      ign_photo: 'IGN-Luftbilder',
      topo: 'OpenTopoMap (Gelände)',
      cyclosm: 'CyclOSM (Fahrrad)',
      satellite: 'Satellit (Esri)',
      custom: 'Benutzerdefiniert (URL)',
    },
  },
  es: {
    default_title: 'Mapa de estaciones',
    home: 'Casa',
    fullscreen: 'Pantalla completa',
    exit_fullscreen: 'Salir de pantalla completa',
    locate: 'Localizarme: estaciones a mi alrededor',
    back_to_followed: 'Volver a las estaciones seguidas',
    radius: 'Radio de búsqueda',
    near_title: 'Estaciones a menos de {r} km',
    near_home_title: 'Estaciones a menos de {r} km de casa',
    city_title: 'Estaciones: {q}',
    you: 'Estás aquí',
    search_city: 'Buscar un municipio o código postal',
    clear_search: 'Borrar la búsqueda',
    no_results: 'No se ha encontrado ninguna estación.',
    no_position: 'Ubicación no disponible.',
    followed: 'Estación seguida',
    editor: {
      entity: 'Sensor Estaciones',
      title: 'Título (vacío para ninguno)',
      fuel: 'Carburante mostrado en los marcadores (vacío = el más barato disponible)',
      height: 'Altura (px)',
      zoom: 'Zoom (vacío = ajustado a las estaciones)',
      map_style: 'Mapa base',
      theme: 'Tema del mapa base',
      tile_url: 'URL de las teselas ({z}, {x}, {y})',
      tile_attribution: 'Atribución de las teselas',
      show_icon: 'Icono',
      show_fullscreen: 'Botón de pantalla completa',
      show_home: 'Casa',
      show_logo: 'Logotipos de las marcas',
      show_name: 'Nombre de las estaciones en los marcadores',
      hide_out_of_stock_stations: 'Ocultar las estaciones agotadas',
      show_locate: 'Botón «Localizarme»',
      show_search: 'Búsqueda por municipio',
      radius: 'Radio predeterminado (km)',
      language: 'Idioma',
      language_auto: 'Según Home Assistant',
    },
    themes: { auto: 'Según el tema', light: 'Claro', dark: 'Oscuro' },
    styles: {
      ha: 'Home Assistant',
      osm: 'OpenStreetMap',
      osm_fr: 'OpenStreetMap France',
      ign: 'Mapa IGN',
      ign_photo: 'Fotos aéreas IGN',
      topo: 'OpenTopoMap (relieve)',
      cyclosm: 'CyclOSM (bicicleta)',
      satellite: 'Satélite (Esri)',
      custom: 'Personalizado (URL)',
    },
  },
};

var carbLeafletPromise = null;
function carbLoadLeaflet() {
  if (window.L?.map) return Promise.resolve(window.L);
  if (!carbLeafletPromise) {
    carbLeafletPromise = new Promise((resolve, reject) => {
      var script = document.createElement('script');
      script.src = `${CARBURANTS_STATIC}/leaflet/leaflet.js?v=1.9.4`;
      script.onload = () => { resolve(window.L); };
      script.onerror = () => { carbLeafletPromise = null; reject(new Error('Leaflet could not be loaded')); };
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
    carbMaplibrePromise = import(`${CARBURANTS_STATIC}/maplibre/maplibre-gl.mjs?v=6.14.0`).then((module) => {
      window.maplibregl = window.maplibregl || module;
      if (window.MaplibreGLLeaflet?.maplibreGL) return window.MaplibreGLLeaflet.maplibreGL;
      return new Promise((resolve, reject) => {
        var script = document.createElement('script');
        script.src = `${CARBURANTS_STATIC}/maplibre/leaflet-maplibre-gl.js?v=0.1.4`;
        script.onload = () => { resolve(window.MaplibreGLLeaflet.maplibreGL); };
        script.onerror = () => { reject(new Error('MapLibre adapter could not be loaded')); };
        document.head.appendChild(script);
      });
    }).catch((err) => {
      carbMaplibrePromise = null;
      throw err;
    });
  }
  return carbMaplibrePromise;
}

function carbSupportsWebGL2() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch (_err) {
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
    // A new default radius in the editor replaces the one picked in the header.
    if (previous && previous.radius !== this._config.radius) this._radius = null;
    if (previous && !!previous.show_fullscreen !== !!this._config.show_fullscreen) this._applyFullscreenOption();
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
    // A click elsewhere closes the popup and hides the out of stock stations again.
    this._onOutside = this._onOutside || carbOutsideListener(this, () => {
      if (!this._map) return;
      this._map.closePopup();
      if (this._showAll) {
        this._showAll = false;
        this._drawMarkers(window.L);
      }
    });
    document.addEventListener('click', this._onOutside, true);
    // Re-attached before the delayed teardown ran (view switch, editor preview): keep the map.
    clearTimeout(this._destroyTimer);
    // Detached in native full screen: the browser left it, but fullscreenchange came after
    // disconnectedCallback removed the listener.
    var card = this._root?.querySelector('ha-card');
    if (card && card.classList.contains('fullscreen') !== this._isFullscreen()) this._fullscreenChanged();
    if (!this._map) {
      // Torn down while detached, or never built: build it now.
      if (this._config && this._hass) this._update();
      return;
    }
    // Removed by disconnectedCallback: Home Assistant reuses card elements across views.
    if (this._config.show_fullscreen) this._listenFullscreen();
    if (this._resizeObserver) this._resizeObserver.observe(this._root.querySelector('.map'));
    this._scheduleTokenRefresh();
    // The token may have expired while the card was detached.
    if (this._tiles?.getMaplibreMap) {
      this._hass.callWS({ type: 'map_tiles/access_token' }).then((res) => { this._mapToken = res.token; }, () => {});
    } else if (this._tiles && this._tiles._url.indexOf('/api/map_tiles/') === 0) {
      this._tileUrl().then((url) => { if (this._tiles) this._tiles.setUrl(url); });
    }
    setTimeout(this._invalidate.bind(this), 0);
  }

  disconnectedCallback() {
    if (this._resizeObserver) this._resizeObserver.disconnect();
    clearInterval(this._tokenTimer);
    clearTimeout(this._searchTimer);
    document.removeEventListener('click', this._onOutside, true);
    this._unlistenFullscreen();
    if (this._pseudoFs) {
      // Escape no longer reaches the card once detached: leave the pseudo full screen now,
      // otherwise the card comes back covering the window with nothing to close it.
      this._pseudoFs = false;
      this._fullscreenChanged();
    }
    // Frees Leaflet and the WebGL context of the vector map unless the card comes straight back.
    clearTimeout(this._destroyTimer);
    this._destroyTimer = setTimeout(() => {
      if (!this.isConnected) this._destroyMap();
    }, 1000);
  }

  getCardSize() {
    return Math.ceil((this._config ? this._config.height : 400) / 50) + 1;
  }

  // jscpd:ignore-start
  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: 'auto' };
  }

  _entityId() {
    return (this._config?.entity) || CarburantsFranceCard._findEntity(this._hass);
  }

  _t() {
    return CarburantsI18n[carbLang(this._hass, this._config?.language)];
  }

  _locale() {
    return carbLocale(this._hass, this._config?.language);
  }
  // jscpd:ignore-end

  _dark(config) {
    var theme = (config || this._config).theme;
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return !!(this._hass?.themes?.darkMode);
  }

  _style() {
    var style = this._config.map_style;
    if (style === 'custom' && !this._config.tile_url) style = 'osm';
    return CARBURANTS_MAP_STYLES[style] ? style : 'osm';
  }

  // What the base layer depends on; the vector style also has a light and a dark version.
  _tilesKey(config) {
    var vector = CARBURANTS_MAP_STYLES[config.map_style || CARBURANTS_MAP_DEFAULTS.map_style]?.vector;
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
      '<ha-card><div class="header" hidden></div><div class="searchbar" hidden></div><div class="message" hidden></div><div class="map"></div></ha-card>';
    var header = this._root.querySelector('.header');
    header.addEventListener('click', (ev) => {
      if (ev.target.closest('.locate')) this._toggleNearby();
    });
    // A marker logo that fails to load becomes its initials. error does not bubble: capture phase.
    this._root.querySelector('.map').addEventListener('error', (ev) => {
      var img = ev.target;
      if (img.tagName !== 'IMG' || !img.closest('.pin')) return;
      CARBURANTS_FAILED_LOGOS.add(img.getAttribute('src'));
      var badge = document.createElement('span');
      badge.className = 'ini';
      badge.textContent = img.dataset.initials || '';
      img.replaceWith(badge);
    }, true);
    header.addEventListener('change', (ev) => {
      if (!ev.target.classList.contains('radius')) return;
      this._radius = Number(ev.target.value);
      if (this._results?.mode === 'near') this._searchNearby();
    });
  }

  _mt() {
    return CarburantsMapI18n[carbLang(this._hass, this._config?.language)];
  }

  // Radius of the nearby search: picked in the header, else the configured default.
  _currentRadius() {
    return this._radius || Number(this._config.radius) || CARBURANTS_MAP_DEFAULTS.radius;
  }

  _title(mt) {
    var results = this._results;
    if (results?.mode === 'near') {
      return (results.home ? mt.near_home_title : mt.near_title).replace('{r}', String(results.radius));
    }
    if (results?.mode === 'city') return mt.city_title.replace('{q}', results.place || results.query);
    return this._config.title === undefined ? mt.default_title : this._config.title;
  }

  // Rewritten only when something in it changes, so the radius list stays open across updates.
  _renderHeader() {
    var mt = this._mt();
    var header = this._root.querySelector('.header');
    var title = this._title(mt);
    // Same icon as the list card, opening the government data page.
    var icon = this._config.show_icon
      ? '<a class="icon-link" href="' + CARBURANTS_SOURCE_URL + '" target="_blank" rel="noopener" title="data.economie.gouv.fr">' +
        '<span class="icon hbadge"><ha-icon icon="mdi:gas-station"></ha-icon></span></a>'
      : '';
    var tools = '';
    if (this._config.show_locate) {
      var radius = this._currentRadius();
      var radii = CARBURANTS_RADII.indexOf(radius) === -1
        ? CARBURANTS_RADII.concat(radius).sort((a, b) => a - b)
        : CARBURANTS_RADII;
      var active = this._results?.mode === 'near';
      var label = active ? mt.back_to_followed : mt.locate;
      tools = '<div class="tools">' +
        `<select class="radius" title="${carbEsc(mt.radius)}" aria-label="${carbEsc(mt.radius)}">` +
        radii.map((r) => `<option value="${r}"${r === radius ? ' selected' : ''}>${r} km</option>`).join('') +
        '</select>' +
        `<button type="button" class="locate${active ? ' active' : ''}${this._busy === 'near' ? ' busy' : ''}" title="${carbEsc(label)}" aria-label="${carbEsc(label)}" aria-pressed="${active}">` +
        `<ha-icon icon="${active ? 'mdi:crosshairs-off' : 'mdi:crosshairs-gps'}"></ha-icon></button></div>`;
    }
    var html = `${icon}<span class="hname">${carbEsc(title || '')}</span>${tools}`;
    header.hidden = !title && !icon && !tools;
    if (html !== this._headerHtml) {
      this._headerHtml = html;
      header.innerHTML = html;
    }
  }

  // Built once: re-rendering would lose the focus and the caret while typing.
  _renderSearchbar() {
    var bar = this._root.querySelector('.searchbar');
    bar.hidden = !this._config.show_search;
    if (!this._config.show_search || bar.firstChild) return;
    var mt = this._mt();
    bar.innerHTML = `<label class="search">${carbSvg(CARBURANTS_SEARCH_PATH)}` +
      `<input type="search" placeholder="${carbEsc(mt.search_city)}" aria-label="${carbEsc(mt.search_city)}" autocomplete="off" spellcheck="false">` +
      `<span class="clear empty" role="button" tabindex="-1" title="${carbEsc(mt.clear_search)}" aria-label="${carbEsc(mt.clear_search)}">${carbSvg(CARBURANTS_CLOSE_PATH)}</span></label>`;
    var input = bar.querySelector('input');
    var clear = bar.querySelector('.clear');
    var sync = () => {
      var empty = !input.value;
      clear.classList.toggle('empty', empty);
      clear.tabIndex = empty ? -1 : 0;
    };
    input.addEventListener('input', () => {
      sync();
      clearTimeout(this._searchTimer);
      var query = input.value.trim();
      if (!query) {
        if (this._results?.mode === 'city') this._resetResults();
        return;
      }
      // Typing a town turns "Locate me" off at once, before the search answers.
      this._stopNearby();
      // Waits for a pause in typing: one request per word, not per letter.
      if (query.length >= 2) this._searchTimer = setTimeout(() => { this._searchCity(query); }, 600);
    });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && input.value.trim()) {
        clearTimeout(this._searchTimer);
        this._searchCity(input.value.trim());
      } else if (ev.key === 'Escape' && input.value) {
        ev.preventDefault();
        this._clearSearch();
      }
    });
    var onClear = (ev) => {
      if (ev.type === 'keydown' && ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      this._clearSearch();
      input.focus();
    };
    clear.addEventListener('click', onClear);
    clear.addEventListener('keydown', onClear);
    this._searchInput = input;
    this._syncClear = sync;
  }

  _clearSearch() {
    clearTimeout(this._searchTimer);
    if (!this._searchInput) return;
    this._searchInput.value = '';
    this._syncClear();
    if (this._results?.mode === 'city') this._resetResults();
  }

  // Back to the followed stations, as stored in the integration.
  _resetResults() {
    this._seq = (this._seq || 0) + 1;
    this._results = null;
    this._busy = null;
    this._error = null;
    this._fitted = false;
    this._update();
  }

  _nearbyOn() {
    return this._results?.mode === 'near' || this._busy === 'near';
  }

  // Leaves "Locate me": back to the followed stations, position forgotten, a pending locate ignored.
  _stopNearby() {
    if (!this._nearbyOn()) return;
    this._position = null;
    this._resetResults();
  }

  _toggleNearby() {
    if (this._nearbyOn()) {
      this._stopNearby();
      return;
    }
    // "Locate me" replaces the town search: field emptied, a search being typed or running dropped.
    this._clearSearch();
    if (this._busy === 'city') this._resetResults();
    this._busy = 'near';
    this._position = null;
    this._error = null;
    this._update();
    var seq = (this._seq = (this._seq || 0) + 1);
    this._locate().then((pos) => {
      if (seq !== this._seq) return;
      this._position = pos;
      this._searchNearby();
    }, () => {
      if (seq !== this._seq) return;
      this._busy = null;
      this._showError(this._mt().no_position);
    });
  }

  // The browser position (HTTPS or the companion app), else the user's person entity, else home.
  _locate() {
    var hass = this._hass;
    var fallback = () => {
      var person = Object.values(hass.states).find((st) => st.entity_id.indexOf('person.') === 0 &&
        st.attributes.user_id === hass.user?.id && st.attributes.latitude != null);
      if (person) return { latitude: person.attributes.latitude, longitude: person.attributes.longitude };
      var home = hass.states['zone.home'];
      if (home?.attributes.latitude != null) return { latitude: home.attributes.latitude, longitude: home.attributes.longitude, home: true };
      throw new Error('no position');
    };
    if (!navigator.geolocation) return Promise.resolve().then(fallback);
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (p) => { resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }); },
        () => { try { resolve(fallback()); } catch (err) { reject(err); } },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  _searchNearby() {
    var pos = this._position;
    if (!pos) return;
    var radius = this._currentRadius();
    this._busy = 'near';
    this._renderHeader();
    this._search({ latitude: pos.latitude, longitude: pos.longitude, radius: radius },
      { mode: 'near', radius: radius, home: !!pos.home, latitude: pos.latitude, longitude: pos.longitude });
  }

  _searchCity(query) {
    this._busy = 'city';
    this._search({ query: query }, { mode: 'city', query: query });
  }

  // Asks the integration (it knows the community names and the followed stations' logos):
  // nothing is added to it, the stations are only shown until the map is reset.
  _search(params, results) {
    var seq = (this._seq = (this._seq || 0) + 1);
    this._error = null;
    var fuels = (this._lastState?.attributes.fuels || []).map((f) => f.key);
    var msg = Object.assign({ type: 'carburants_france/search' }, params);
    if (fuels.length) msg.fuels = fuels;
    this._hass.callWS(msg).then((res) => {
      if (seq !== this._seq) return;
      this._busy = null;
      // The town as the feed spells it ("Rennes" for "renn"), the map then focuses on its stations.
      this._results = Object.assign(results, { stations: res.stations, fuels: res.fuels, place: res.place });
      this._showAll = false;
      this._fitted = false;
      this._signature = null;
      this._update();
    }, (err) => {
      if (seq !== this._seq) return;
      this._busy = null;
      this._showError(String(err?.message || err));
    });
  }

  // Kept until the next search or reset, so a sensor update does not wipe it.
  _showError(text) {
    this._error = text;
    this._update();
  }

  // Stations and fuels shown: the search results, else the integration's Stations sensor.
  _data() {
    if (this._results) return this._results;
    var attrs = this._lastState?.attributes || {};
    return { stations: attrs.stations || [], fuels: attrs.fuels || [] };
  }

  _update() {
    if (!this._config || !this._hass) return;
    this._ensureShell();
    this._renderHeader();
    this._renderSearchbar();
    var mapEl = this._root.querySelector('.map');
    mapEl.style.height = `${Math.max(150, Number(this._config.height) || 400)}px`;
    // Follows the Home Assistant theme live when theme is auto.
    mapEl.classList.toggle('dark', this._darkTiles());
    this._reloadTilesIfNeeded();
    var message = this._root.querySelector('.message');
    if (!this._lastState && !this._results) {
      message.hidden = false;
      message.textContent = this._t().no_entity;
      return;
    }
    var text = this._error || (this._results && !this._results.stations.length ? this._mt().no_results : '');
    message.hidden = !text;
    message.textContent = text;
    carbLoadLeaflet().then((L) => {
      // Detached: no new map (and WebGL context) until connectedCallback comes back.
      if (!this._map && !this.isConnected) return;
      this._ensureMap(L);
      this._drawMarkers(L);
    }).catch((err) => {
      message.hidden = false;
      message.textContent = String((err?.message) || err);
    });
  }

  _ensureMap(L) {
    if (this._map) return;
    var mapEl = this._root.querySelector('.map');
    this._map = L.map(mapEl, { zoomControl: true, attributionControl: true, scrollWheelZoom: false, zoomSnap: 0.25 });
    mapEl.classList.toggle('dark', this._darkTiles());
    this._loadTiles(L);
    this._layer = L.layerGroup().addTo(this._map);
    var Toggle = L.Control.extend({
      onAdd: () => {
        var el = L.DomUtil.create('button', 'carb-toggle');
        el.type = 'button';
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.on(el, 'click', () => {
          this._showAll = !this._showAll;
          this._drawMarkers(L);
        });
        return el;
      },
    });
    this._toggle = new Toggle({ position: 'topright' }).addTo(this._map);
    if (this._config.show_fullscreen) this._addFullscreenControl(L);
    this._fitted = false;
    if (window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => { this._invalidate(); });
      this._resizeObserver.observe(mapEl);
    }
  }

  // OpenStreetMap tiles through Home Assistant's own Map tiles proxy (2026.9+), like the
  // native map card. Its access token rotates every 30 minutes, two being valid at once.
  _tileUrl() {
    var hass = this._hass;
    return Promise.resolve()
      .then(() => hass.callWS({ type: 'map_tiles/access_token' }))
      .then((res) => `/api/map_tiles/raster/{z}/{x}/{y}.png?token=${encodeURIComponent(res.token)}`)
      .catch(() => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  }

  _loadTiles(L) {
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
    url.then((resolved) => {
      // The map was rebuilt or the style changed while the token was loading.
      if (this._map !== map || this._tilesKey(this._config) !== key) return;
      this._tiles = L.tileLayer(resolved, options).addTo(map);
      this._tiles.bringToBack();
      this._scheduleTokenRefresh();
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
    var dark = this._dark();
    var hass = this._hass;
    var fallback = (err) => {
      if (this._map !== map || this._tilesKey(this._config) !== key) return;
      // eslint-disable-next-line no-console
      console.info('carburants-france-map-card: Home Assistant map style unavailable, using raster tiles', err);
      this._vectorFailed = true;
      this._loadTiles(L);
    };
    if (!carbSupportsWebGL2()) {
      fallback(new Error('WebGL2 not supported'));
      return;
    }
    Promise.all([
      carbLoadMaplibre(),
      hass.callWS({ type: 'map_tiles/access_token' }),
      fetch(`/static/map/${dark ? 'dark' : 'light'}.json`).then((resp) => {
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
      }),
    ]).then((results) => {
      if (this._map !== map || this._tilesKey(this._config) !== key) return;
      var maplibreGL = results[0];
      var style = results[2];
      this._mapToken = results[1].token;
      var absolute = (url) => new URL(url, location.href).href;
      if (typeof style.sprite === 'string') style.sprite = absolute(style.sprite);
      else if (Array.isArray(style.sprite)) {
        style.sprite = style.sprite.map((sprite) => Object.assign({}, sprite, { url: absolute(sprite.url) }));
      }
      this._tiles = maplibreGL({
        style: style,
        attributionControl: { customAttribution: CARBURANTS_OSM_ATTRIBUTION },
        // Same as the native map card: the token in a header keeps tile URLs, and the cache, stable.
        transformRequest: (url) => {
          var full = new URL(url, location.href);
          if (full.origin === location.origin && full.pathname.indexOf('/api/map_tiles/') === 0) {
            return { url: full.href, headers: { 'X-Map-Tiles-Token': this._mapToken } };
          }
          return { url: full.href };
        },
      });
      this._tiles.addTo(map);
      this._scheduleTokenRefresh();
    }).catch(fallback);
  }

  _scheduleTokenRefresh() {
    clearInterval(this._tokenTimer);
    if (!this._tiles) return;
    if (this._tiles.getMaplibreMap) {
      // Vector: the request hook reads the current token.
      this._tokenTimer = setInterval(() => {
        this._hass.callWS({ type: 'map_tiles/access_token' }).then((res) => { this._mapToken = res.token; }, () => {});
      }, 20 * 60 * 1000);
      return;
    }
    if (this._tiles._url.indexOf('/api/map_tiles/') !== 0) return;
    this._tokenTimer = setInterval(() => {
      this._tileUrl().then((url) => {
        // No redraw: tiles already shown stay, new ones use the new token.
        if (this._tiles) this._tiles.setUrl(url, true);
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
    this._toggle = null;
    this._fsControl = null;
    this._fsLink = null;
    this._resizeObserver = null;
    this._signature = null;
  }

  // Real full screen where the browser allows it on an element; elsewhere (iPhone Safari and
  // the iOS app) the card covers the window instead.
  _addFullscreenControl(L) {
    var mt = CarburantsMapI18n[carbLang(this._hass, this._config?.language)];
    var Fullscreen = L.Control.extend({
      onAdd: () => {
        var bar = L.DomUtil.create('div', 'leaflet-bar carb-fs');
        var link = L.DomUtil.create('a', '', bar);
        link.href = '#';
        link.setAttribute('role', 'button');
        L.DomEvent.disableClickPropagation(bar);
        L.DomEvent.on(link, 'click', (ev) => {
          L.DomEvent.preventDefault(ev);
          this._toggleFullscreen();
        });
        this._fsLink = link;
        this._updateFullscreenButton(mt);
        return bar;
      },
    });
    this._fsControl = new Fullscreen({ position: 'topleft' }).addTo(this._map);
    this._listenFullscreen();
  }

  // show_fullscreen changed in the editor: add or remove the button on the map already built.
  _applyFullscreenOption() {
    if (!this._map) return;
    if (this._config.show_fullscreen) {
      if (!this._fsControl) this._addFullscreenControl(window.L);
      return;
    }
    if (this._isNativeFullscreen()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    if (this._isFullscreen()) {
      // The listeners go away below: leave full screen now rather than on fullscreenchange.
      this._pseudoFs = false;
      this._root.querySelector('ha-card').classList.remove('fullscreen', 'pseudo');
      setTimeout(this._invalidate.bind(this), 50);
    }
    if (this._fsControl) this._fsControl.remove();
    this._fsControl = null;
    this._fsLink = null;
    this._unlistenFullscreen();
  }

  _unlistenFullscreen() {
    if (!this._onFsChange) return;
    document.removeEventListener('fullscreenchange', this._onFsChange);
    document.removeEventListener('webkitfullscreenchange', this._onFsChange);
    document.removeEventListener('keydown', this._onFsKey);
    this._onFsChange = null;
  }

  _listenFullscreen() {
    if (!this._onFsChange) {
      this._onFsChange = () => { this._fullscreenChanged(); };
      this._onFsKey = (ev) => { if (ev.key === 'Escape' && this._pseudoFs) this._toggleFullscreen(); };
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
      } catch (_err) {
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
    var pseudo = () => {
      this._pseudoFs = true;
      this._fullscreenChanged();
    };
    if (!request) {
      pseudo();
      return;
    }
    try {
      var result = request.call(this);
      if (result?.catch) result.catch(pseudo);
    } catch (_err) {
      pseudo();
    }
  }

  _fullscreenChanged() {
    var on = this._isFullscreen();
    var card = this._root?.querySelector('ha-card');
    if (!card) return;
    card.classList.toggle('fullscreen', on);
    card.classList.toggle('pseudo', !!this._pseudoFs);
    this._updateFullscreenButton(CarburantsMapI18n[carbLang(this._hass, this._config?.language)]);
    // Leaflet and MapLibre resize to the new box, then the stations are fitted again.
    setTimeout(() => {
      this._fitted = false;
      this._invalidate();
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
    this._fsLink.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
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
      // Pins are centred on their point and ~120 px wide: leave room on every side.
      var side = this._config.show_name ? 110 : 80;
      this._map.fitBounds(this._bounds, { paddingTopLeft: [side, 40], paddingBottomRight: [side, 40], maxZoom: 15 });
    }
    this._fitted = true;
  }

  // The fuel chosen in the editor, or null: each marker then shows its cheapest fuel in stock.
  _fuelKey(fuels) {
    var wanted = this._config.fuel;
    return wanted && fuels.some((f) => f.key === wanted) ? wanted : null;
  }

  // The fuel a marker shows: the chosen one, else the cheapest in stock, else the most telling
  // unavailable one (shortage before no price), so "Rupture" only shows when nothing is in stock.
  _markerFuel(s, fuels, key) {
    if (key) return { key: key, fuel: s.fuels?.[key] };
    var cheapest = null;
    var fallback = null;
    fuels.forEach((f) => {
      var fuel = s.fuels?.[f.key];
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
    var data = this._data();
    var fuels = data.fuels || [];
    var key = this._fuelKey(fuels);
    var stations = (data.stations || []).filter((s) => s.latitude != null && s.longitude != null);
    var best = carbBestPrices(stations, fuels);
    var visible = carbVisibleStations(stations, fuels, this._config, this._showAll);
    var hidden = visible.hidden;
    stations = visible.shown;
    var toggle = this._toggle.getContainer();
    toggle.hidden = !hidden;
    toggle.textContent = carbToggleLabel(t, this._showAll, hidden);
    var names = {};
    fuels.forEach((f) => { names[f.key] = f.name; });
    var now = new Date();
    var points = [];
    var signature = stations.map((s) => s.station_id).join(',');
    if (signature !== this._signature) this._fitted = false;
    this._signature = signature;

    // The open popup survives the redraw (sensor update every 15 min by default).
    var openId = null;
    this._layer.eachLayer((layer) => {
      if (layer.isPopupOpen?.() && layer.options.stationId != null) openId = layer.options.stationId;
    });
    var reopen = null;
    this._layer.clearLayers();
    stations.forEach((s) => {
      var shown = this._markerFuel(s, fuels, key);
      var fuel = shown.fuel;
      var fuelName = names[shown.key] || '';
      var state = !fuel || fuel.rupture === 'definitive' ? 'none'
        : !fuel.available ? (fuel.rupture ? 'out' : 'nodata')
        : best[shown.key] === fuel.price && stations.length > 1 ? 'best' : 'ok';
      var label = state === 'ok' || state === 'best' ? this._price(fuel.price)
        : state === 'out' ? t.out_of_stock : state === 'nodata' ? t.no_price : '—';
      // Without a chosen fuel, say which one the price is for.
      var priceHtml = (!key && fuelName && (state === 'ok' || state === 'best') ? `<span class="pfuel">${carbFuelBadge(shown.key, fuelName)}</span> ` : '') + carbEsc(label);
      var logo = '';
      if (this._config.show_logo) {
        var name = s.brand || s.station_name || '';
        var known = carbLogo(s);
        if (known && CARBURANTS_FAILED_LOGOS.has(known.src)) known = null;
        logo = known
          ? '<img class="' + carbLogoClass(known).trim() + '" src="' + carbEsc(known.src) + '" alt="" referrerpolicy="no-referrer" data-initials="' +
            carbEsc(carbInitials(name)) + '">'
          : `<span class="ini" style="background:${carbBrandColor(name || 'station')}">${carbEsc(carbInitials(name) || '⛽')}</span>`;
      }
      var icon = L.divIcon({
        className: 'carb-marker',
        html: '<div class="pin ' + state + '" title="' + carbEsc(`${s.station_name} · ${fuelName}`) + '">' + logo +
          (this._config.show_name
            ? `<span class="ptext"><span class="pname-pin">${carbEsc(s.station_name)}</span><span class="price">${priceHtml}</span></span>`
            : `<span class="price">${priceHtml}</span>`) +
          '</div>',
        iconSize: null,
        iconAnchor: [0, 0],
      });
      var marker = L.marker([s.latitude, s.longitude], {
        icon: icon, riseOnHover: true, zIndexOffset: state === 'best' ? 1000 : 0, stationId: String(s.station_id),
      });
      marker.bindPopup(this._popup(s, fuels, best, t, now), { maxWidth: 280, minWidth: 220 });
      marker.addTo(this._layer);
      if (openId === String(s.station_id)) reopen = marker;
      points.push([s.latitude, s.longitude]);
    });

    var mt = this._mt();
    var results = this._results;
    var bounds = null;
    if (results?.mode === 'near') {
      // The search area, and where the search started from.
      var circle = L.circle([results.latitude, results.longitude], {
        // Colours in the styles: SVG attributes don't take the theme's CSS variables.
        radius: results.radius * 1000, interactive: false, className: 'carb-area',
      }).addTo(this._layer);
      bounds = circle.getBounds();
      L.marker([results.latitude, results.longitude], {
        icon: L.divIcon({ className: 'carb-marker', html: `<div class="me" title="${carbEsc(results.home ? mt.home : mt.you)}"></div>`, iconSize: null, iconAnchor: [0, 0] }),
        zIndexOffset: -1000,
        keyboard: false,
      }).addTo(this._layer);
    }
    var home = this._hass.states['zone.home'];
    // Home only with the followed stations: a town far away would be zoomed out to fit it.
    if (this._config.show_home && !results && home && home.attributes.latitude != null) {
      L.marker([home.attributes.latitude, home.attributes.longitude], {
        icon: L.divIcon({ className: 'carb-marker', html: `<div class="home" title="${carbEsc(mt.home)}"><ha-icon icon="mdi:home"></ha-icon></div>`, iconSize: null, iconAnchor: [0, 0] }),
        zIndexOffset: -1000,
        keyboard: false,
      }).addTo(this._layer);
      points.push([home.attributes.latitude, home.attributes.longitude]);
    }

    this._bounds = points.length ? L.latLngBounds(points) : null;
    if (bounds) this._bounds = this._bounds ? this._bounds.extend(bounds) : bounds;
    if (!this._fitted) this._fit();
    if (reopen) reopen.openPopup();
  }

  _price(value) {
    return `${new Intl.NumberFormat(this._locale(), { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value)} €`;
  }

  _popup(s, fuels, best, t, now) {
    var opening = carbOpening(s, t, now, this._locale());
    var rows = fuels.map((f) => {
      var fuel = s.fuels?.[f.key];
      if (!fuel || fuel.rupture === 'definitive') return '';
      var value = fuel.available
        ? `<b${best[f.key] === fuel.price ? ' class="best"' : ''}>${this._price(fuel.price)}</b>`
        : fuel.rupture
          ? `<span class="out">${carbEsc(t.out_of_stock)}</span>`
          : `<span class="nodata">${carbEsc(t.no_price)}</span>`;
      var age = fuel.available ? carbRelative(fuel.updated, this._locale())
        : carbRelative(fuel.rupture ? fuel.rupture_since : fuel.rupture_end, this._locale());
      return `<tr><td>${carbFuelBadge(f.key, f.name)}</td><td>${value}</td><td class="age">${carbEsc(age)}</td></tr>`;
    }).join('');
    return '<div class="popup">' +
      '<div class="pname">' + carbEsc(s.station_name) + '</div>' +
      (s.brand ? `<div class="pbrand">${carbEsc(s.brand)}</div>` : '') +
      (this._results && s.followed ? `<div class="pfollowed"><ha-icon icon="mdi:star"></ha-icon>${carbEsc(this._mt().followed)}</div>` : '') +
      '<div class="paddr">' + carbEsc(s.address) + ', ' + carbEsc(carbTitleCase(s.city)) +
      (s.distance != null ? ` · ${new Intl.NumberFormat(this._locale(), { maximumFractionDigits: 1 }).format(s.distance)} km` : '') + '</div>' +
      (opening ? `<div class="popening ${opening.key}">${carbEsc(opening.text)}</div>` : '') +
      (rows ? `<table>${rows}</table>` : '') +
      '<a class="pdir" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' +
      encodeURIComponent(`${s.latitude},${s.longitude}`) + '"><ha-icon icon="mdi:directions"></ha-icon>' + carbEsc(t.directions) + '</a></div>';
  }

  static _styles() {
    return [
      ':host { display: block; }',
      'ha-card { overflow: hidden; }',
      '.header { display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 12px 12px 8px; }',
      '.hname { min-width: 0; font-size: 16px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      '.icon-link { display: flex; flex: none; }',
      // Generic fuel pump in a round badge tinted with the theme's primary colour.
      '.hbadge { --c: var(--primary-color, #03a9f4); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); --mdc-icon-size: 24px; }',
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
      '.pfuel { display: inline-flex; margin-right: 2px; }',
      ...CARBURANTS_BADGE_STYLES,
      // Compact badge on the markers, so they stay about as tall as with plain text.
      '.pin .fbadge { height: 14px; padding-left: 5px; gap: 2px; border-radius: 7px; font-size: 9px; box-shadow: none; }',
      '.pin .fbadge:not(:has(.fcode)) { padding-right: 5px; }',
      '.pin .fcode { min-width: 11px; height: 11px; border-radius: 6px; font-size: 7px; }',
      '.pname-pin { max-width: 130px; overflow: hidden; text-overflow: ellipsis; font-size: 11px; font-weight: 500; color: var(--primary-text-color, #212121); }',
      '.pin { position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 5px; padding: 3px 8px 3px 3px; border-radius: 16px; background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121); border: 2px solid var(--secondary-text-color, #727272); box-shadow: 0 1px 4px rgba(0,0,0,.35); white-space: nowrap; font-weight: 500; font-size: 13px; font-variant-numeric: tabular-nums; cursor: pointer; }',
      '.pin.best { border-color: var(--success-color, #43a047); color: var(--success-color, #43a047); }',
      '.pin.out { border-color: var(--warning-color, #ffa600); color: var(--warning-color, #ffa600); }',
      '.pin.none { opacity: .6; }',
      // Leaflet forces width:auto and max-width:none on marker images: these selectors must outrank it.
      // Rounded corners stay small: a pill shape would cut the corners of wide logos (Avia).
      '.leaflet-container .leaflet-marker-pane .pin img { flex: none; box-sizing: border-box; height: 22px !important; width: auto !important; max-width: 52px !important; max-height: 22px !important; padding: 3px 5px !important; border-radius: 6px; object-fit: contain; background: #fff; }',
      '.leaflet-container .leaflet-marker-pane .pin img.own { width: 22px !important; padding: 0 !important; border-radius: 0; background: none; }',
      '.leaflet-container .leaflet-marker-pane .pin img.dark { background: #1f2a37; }',
      '.pin .ini { width: 22px; height: 22px; border-radius: 50%; flex: none; }',
      '.pin .ini { display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 700; background: #607d8b; }',
      '.home { position: absolute; transform: translate(-50%, -50%); width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary-color, #03a9f4); color: #fff; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); --mdc-icon-size: 18px; }',
      '.leaflet-popup-content-wrapper, .leaflet-popup-tip { background: var(--card-background-color, #fff); color: var(--primary-text-color, #212121); }',
      '.leaflet-popup-content { margin: 10px 12px; font-size: 13px; }',
      '.pname { font-weight: 500; font-size: 14px; }',
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
      '.popup .out { color: var(--warning-color, #ffa600); font-weight: 500; }',
      '.popup .nodata { color: var(--secondary-text-color, #727272); }',
      '.carb-toggle { font: inherit; font-size: 12px; font-weight: 500; padding: 5px 10px; border-radius: 4px; border: 2px solid rgba(0,0,0,.2); background: var(--card-background-color, #fff); color: var(--primary-color, #03a9f4); cursor: pointer; background-clip: padding-box; }',
      '.carb-toggle[hidden] { display: none; }',
      // Header tools: radius of the nearby search and "locate me".
      '.tools { margin-left: auto; display: flex; align-items: center; gap: 6px; flex: none; }',
      '.radius { font: inherit; font-size: 13px; height: 32px; padding: 0 6px; border-radius: 10px; border: 1px solid var(--divider-color, rgba(127,127,127,.3)); background: var(--secondary-background-color, rgba(127,127,127,.08)); color: var(--primary-text-color); cursor: pointer; }',
      '.locate { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--secondary-text-color); cursor: pointer; --mdc-icon-size: 22px; }',
      '.locate:hover { background: var(--divider-color, rgba(127,127,127,.25)); color: var(--primary-text-color); }',
      '.locate.active { background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent); color: var(--primary-color, #03a9f4); }',
      '.locate.active:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent); color: var(--primary-color, #03a9f4); }',
      '.locate.busy ha-icon { animation: carb-pulse 1s ease-in-out infinite; }',
      '@keyframes carb-pulse { 50% { opacity: .3; } }',
      // Search field, as in ha-system-monitor-card.
      '.searchbar { padding: 0 16px 8px; }',
      '.searchbar[hidden] { display: none; }',
      '.search { display: flex; align-items: center; gap: 6px; padding: 0 10px; height: 34px; border-radius: 10px; background: var(--secondary-background-color, rgba(127,127,127,.08)); color: var(--secondary-text-color); cursor: text; }',
      '.search:focus-within { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: -2px; }',
      '.search .svg { width: 16px; height: 16px; flex: none; }',
      '.search input { flex: 1; min-width: 0; border: 0; outline: 0; background: none; font: inherit; font-size: 13px; color: var(--primary-text-color); }',
      '.search input::placeholder { color: var(--secondary-text-color); }',
      '.search input::-webkit-search-cancel-button { display: none; }',
      '.search .clear { flex: none; width: 24px; height: 24px; margin-right: -4px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; color: var(--secondary-text-color); }',
      '.search .clear.empty { opacity: .35; pointer-events: none; }',
      '.search .clear:hover { background: var(--divider-color, rgba(127,127,127,.25)); color: var(--primary-text-color); }',
      '.search .clear .svg { width: 16px; height: 16px; }',
      // Nearby search: area and starting point.
      '.leaflet-container path.carb-area { stroke: var(--primary-color, #03a9f4); stroke-width: 1.5; stroke-opacity: .7; fill: var(--primary-color, #03a9f4); fill-opacity: .06; }',
      '.me { position: absolute; transform: translate(-50%, -50%); width: 16px; height: 16px; border-radius: 50%; background: var(--primary-color, #03a9f4); border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(3,169,244,.25), 0 1px 4px rgba(0,0,0,.35); }',
      '.pfollowed { display: flex; align-items: center; gap: 4px; margin-top: 2px; font-size: 12px; color: var(--primary-color, #03a9f4); --mdc-icon-size: 14px; }',
      // Leaflet colours every link in the map: the selector must outrank '.leaflet-container a'.
      '.leaflet-container a.pdir { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 10px; padding: 8px 14px; border-radius: 10px; background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent); color: var(--primary-color, #03a9f4); text-decoration: none; font-weight: 500; font-size: 14px; }',
      '.leaflet-container a.pdir:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 24%, transparent); }',
      '.pdir ha-icon { --mdc-icon-size: 18px; }',
    ].join('\n');
  }
}

class CarburantsFranceMapCardEditor extends HTMLElement {
  // jscpd:ignore-start
  setConfig(config) {
    this._config = Object.assign({}, config);
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) {
      this._form.hass = hass;
      this._setSchema();
    } else {
      this._render();
    }
  }
  // jscpd:ignore-end

  _setSchema() {
    carbSetSchema(this._form, this._schema());
  }

  _schema() {
    var mt = CarburantsMapI18n[carbLang(this._hass, this._config?.language)];
    var entity = this._config.entity || CarburantsFranceCard._findEntity(this._hass);
    var st = entity && this._hass.states[entity];
    var fuels = ((st?.attributes.fuels) || []).map((f) => ({ value: f.key, label: f.name }));
    var themes = ['auto', 'light', 'dark'].map((k) => ({ value: k, label: mt.themes[k] }));
    var languages = carbLanguageOptions(mt.editor.language_auto);
    var styles = Object.keys(CARBURANTS_MAP_STYLES).map((k) => ({ value: k, label: mt.styles[k] }));
    var custom = this._config.map_style === 'custom'
      ? [
          { name: 'tile_url', selector: { text: { type: 'url' } } },
          { name: 'tile_attribution', selector: { text: {} } },
        ]
      : [];
    return [
      { name: 'entity', selector: { entity: { domain: 'sensor', integration: 'carburants_france' } } },
      { name: 'title', selector: { text: {} } },
      { name: 'language', selector: { select: { mode: 'dropdown', options: languages } } },
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
          { name: 'show_search', selector: { boolean: {} } },
          { name: 'show_locate', selector: { boolean: {} } },
        ],
      },
    ], this._config.show_locate === false ? [] : [
      { name: 'radius', selector: { number: { min: 1, max: 50, step: 1, mode: 'box', unit_of_measurement: 'km' } } },
    ]);
  }

  // jscpd:ignore-start
  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement('ha-form');
      // Read at each render: the labels follow the `language` option picked in this editor.
      this._form.computeLabel = (field) => CarburantsMapI18n[carbLang(this._hass, this._config?.language)].editor[field.name] || field.name;
      this._form.addEventListener('value-changed', this._valueChanged.bind(this));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._setSchema();
    this._form.data = Object.assign({}, CARBURANTS_MAP_DEFAULTS, this._config);
  }
  // jscpd:ignore-end

  _valueChanged(ev) {
    var value = Object.assign({}, ev.detail.value);
    Object.keys(CARBURANTS_MAP_DEFAULTS).forEach((key) => {
      if (value[key] === CARBURANTS_MAP_DEFAULTS[key]) delete value[key];
    });
    ['entity', 'fuel', 'zoom', 'tile_url', 'tile_attribution'].forEach((key) => { if (!value[key]) delete value[key]; });
    if (value.map_style !== 'custom') {
      delete value.tile_url;
      delete value.tile_attribution;
    }
    // An empty title hides the header: keep it as "" rather than dropping it.
    var rebuild = value.entity !== this._config.entity || value.map_style !== this._config.map_style ||
      value.show_locate !== this._config.show_locate || value.language !== this._config.language;
    // jscpd:ignore-start
    this._config = value;
    if (rebuild) this._setSchema();
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: value }, bubbles: true, composed: true }));
  }
}
// jscpd:ignore-end

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
    documentationURL: 'https://github.com/juju35/ha-carburants-france',
  });
}
