// ── carburants-france-card ────────────────────────────────────────────────────
import { CARBURANTS_SOURCE_URL } from "./card-picker.js";
import { CARBURANTS_DEFAULTS, CARBURANTS_FAILED_LOGOS, carbBestPrices, carbBrandColor, carbEsc, carbFuelColumns, carbInitials, carbLang, carbLocale, carbLogo, carbLogoClass, carbTitleCase, carbToggleLabel, carbUnavailable, carbVisibleStations, carbWatchOutside } from "./i18n-helpers.js";
import { CARBURANTS_BADGE_STYLES, carbFuelBadge, carbOpening, carbRelative, carbStationTime } from "./fuel-badges.js";
import { CARBURANTS_SCENE_REDUCED, CARBURANTS_SCENE_STYLE, CARBURANTS_STATUS_STYLE, carbBanner, carbFitPill, carbIsNight, carbMorph, carbObserve, carbPill, carbPillLabel, carbStatus, carbTotemRows, carbUid } from "./illustrated-header.js";
import { CarburantsI18n } from "./i18n/strings.js";

export class CarburantsFranceCard extends HTMLElement {
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
    // An unavailable sensor has no attributes (Home Assistant drops them): find it in the entity registry instead.
    var entities = hass.entities || {};
    var found = Object.keys(entities).find((id) => id.indexOf('sensor.') === 0 && hass.states[id] &&
      entities[id].platform === 'carburants_france' && entities[id].translation_key === 'stations');
    return found || null;
  }

  setConfig(config) {
    this._config = Object.assign({}, CARBURANTS_DEFAULTS, config || {});
    // show_title / show_subtitle: the header's title / subtitle, hidden by the stylesheet
    this.toggleAttribute?.('hide-title', config.show_title === false);
    this.toggleAttribute?.('hide-subtitle', config.show_subtitle === false);
    // Only one station is expanded at a time.
    this._expandedId = this._expandedId || null;
    // Read the current state now: a config change must redraw at once, not at the next hass update.
    this._lastState = this._hass && this._entityId() ? this._hass.states[this._entityId()] || null : null;
    this._renderedLocale = this._hass ? carbLocale(this._hass, this._config.language) : undefined;
    if (this._hass) this._render();
  }

  set hass(hass) {
    var first = !this._hass;
    this._hass = hass;
    var entityId = this._entityId();
    var st = entityId ? hass.states[entityId] : null;
    var dark = !!hass.themes?.darkMode;
    // The illustration turns to night with the dark theme.
    var night = carbIsNight(hass, this._config);
    // language: auto follows the Home Assistant language (and region, for numbers), which can change without a reload.
    var locale = carbLocale(hass, this._config?.language);
    if (first || st !== this._lastState || dark !== this._darkMode || night !== this._night || locale !== this._renderedLocale) {
      this._lastState = st;
      this._darkMode = dark;
      this._night = night;
      this._renderedLocale = locale;
      this._render();
    }
  }

  connectedCallback() {
    carbObserve(this);
    this._timer = setInterval(() => { this._render(); }, 60000);
    // A click elsewhere collapses the station and hides the out of stock ones again.
    this._outsideWatch = this._outsideWatch || carbWatchOutside(this, () => {
      if (this._expandedId === null && !this._showAll) return;
      this._expandedId = null;
      this._showAll = false;
      this._render();
    });
    this._outsideWatch.on();
    // Back on the page after leaving it: drawn again in its default state.
    if (this._left && this._hass && this._config) this._render();
    this._left = false;
  }

  disconnectedCallback() {
    this._resize?.disconnect();
    this._fitWidth = null;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
    clearInterval(this._timer);
    this._outsideWatch?.off();
    // Left (another dashboard view, a conditional card hidden): back to its default state, station folded and the
    // out of stock ones hidden again.
    this._left = true;
    this._expandedId = null;
    this._showAll = false;
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
    // 9 of 12 columns: at least ~240 px in a Sections view (320 px section), where the stations reflow and their
    // names stay readable; half a section (~160 px) only left a few letters of each name.
    return { columns: 12, min_columns: 9, rows: 'auto' };
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
    this._root.querySelector('.list').addEventListener('keydown', this._onListKey.bind(this));
    this._root.querySelector('.list').addEventListener('error', this._onLogoError.bind(this), true);
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
    // The last refresh error stays in the button's tooltip until the next refresh.
    var refreshTitle = this._refreshError ? `${t.refresh_failed} ${this._refreshError}` : t.refresh;
    header.classList?.toggle('illus', this._config.illustration !== false);

    if (!st) {
      this._headerHtml = null;
      this._listHtml = null;
      carbMorph(header, this._headerMarkup({ title: title, status: 'off', pill: t.unavailable, tools: this._zoomButton() }));
      carbFitPill(this, this._root);
      carbMorph(list, `<div class="empty">${carbEsc(t.no_entity)}</div>`);
      this._footerHtml = null;
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
    if (footer.hidden !== !hidden) footer.hidden = !hidden;
    var footerHtml = hidden
      ? '<button type="button" class="toggle"><ha-icon icon="' + (this._showAll ? 'mdi:eye-off-outline' : 'mdi:eye-outline') + '"></ha-icon>' +
        carbEsc(carbToggleLabel(t, this._showAll, hidden)) + '</button>'
      : '';
    // Patched only when it changes: no node created again on a state update.
    if (footerHtml !== this._footerHtml) {
      this._footerHtml = footerHtml;
      carbMorph(footer, footerHtml);
    }

    var unavailable = carbUnavailable(st);
    var status = carbStatus(st, all, fuels);
    var headerHtml = this._headerMarkup({
      title: title,
      // The stations count (or the data's state) in the status pill.
      pill: carbPillLabel(t, status, st.state, this._locale()),
      status: status,
      rows: carbTotemRows(fuels, best, this._locale()),
      tools: (this._config.show_refresh
        ? '<ha-icon-button class="refresh-btn' + (this._refreshing ? ' spinning' : '') + '" label="' + carbEsc(t.refresh) +
          '" title="' + carbEsc(refreshTitle) + '"><ha-icon icon="mdi:refresh"></ha-icon></ha-icon-button>'
        : '') + this._zoomButton(),
    });
    if (headerHtml !== this._headerHtml) {
      this._headerHtml = headerHtml;
      // Patched in place: the picture keeps its nodes and running animations, the card its height.
      carbMorph(header, headerHtml);
      carbFitPill(this, this._root);
      var refreshBtn = header.querySelector('.refresh-btn');
      if (refreshBtn && !refreshBtn._carbBound) {
        refreshBtn._carbBound = true;
        refreshBtn.addEventListener('click', this._refresh.bind(this));
      }
    }

    var now = new Date();
    var listHtml = stations.length
      ? stations.map((s) => this._renderStation(s, fuels, best, t, now, stations.length > 1)).join('')
      : `<div class="empty">${carbEsc(hidden ? t.all_out : unavailable ? t.unavailable_hint : t.empty)}</div>`;
    // The minute timer only refreshes the relative ages and the opening status: when nothing
    // changed, leave the DOM alone (keeps a text selection, no listeners to re-attach).
    if (listHtml === this._listHtml) return;
    this._listHtml = listHtml;
    // Patched in place, rows matched by station: a price that changes rewrites its text only, the logos stay
    // loaded (no row losing its height for a frame) and the focused row keeps the focus.
    carbMorph(list, listHtml);
  }

  // A brand logo that fails to load (listened on the list, in the capture phase: error does not bubble) becomes
  // the brand's initials on its colour.
  _onLogoError(ev) {
    var img = ev.target;
    if (img?.localName !== 'img' || !img.classList.contains('logo')) return;
    CARBURANTS_FAILED_LOGOS.add(img.getAttribute('src'));
    var badge = document.createElement('div');
    badge.className = 'logo badge';
    badge.style.background = img.dataset.color;
    badge.textContent = img.dataset.initials;
    img.replaceWith(badge);
  }

  // Hook for the mini card: its detail button at the right of the header.
  _zoomButton() {
    return '';
  }

  // The header icon, tinted with the status of the data, opening the government data page (`link`).
  _iconHtml(status, badge, link) {
    if (!this._config.show_icon) return '';
    var icon = `<span class="icon hbadge st-${status}"><ha-icon icon="mdi:gas-station"></ha-icon>${badge || ''}</span>`;
    return link === false ? icon
      : `<a class="icon-link" href="${CARBURANTS_SOURCE_URL}" target="_blank" rel="noopener" title="data.economie.gouv.fr">${icon}</a>`;
  }

  // The header: the illustrated banner (title and subtitle on its sky, `tools` at its top right), or the classic one.
  // o: { title, titleHtml, sub, status, rows, tools, badge, link }
  _headerMarkup(o) {
    var icon = this._iconHtml(o.status, o.badge, o.link);
    var pill = o.pill ? carbPill(o.status, o.pill) : '';
    var sub = o.sub ? `<div class="hsub"${o.subTitle ? ` title="${carbEsc(o.sub)}"` : ''}>${carbEsc(o.sub)}</div>` : '';
    var name = `<div class="hname">${o.titleHtml || carbEsc(o.title)}</div>`;
    if (this._config.illustration === false) return `<div class="title">${icon}<div class="titles"><div class="ctline">${name}${pill}</div>${sub}</div></div>${o.tools || ''}`;
    var titles = `<div class="tline">${name}${pill}</div>${sub}`;
    this._uid = this._uid || carbUid();
    return carbBanner({ uid: this._uid, night: carbIsNight(this._hass, this._config), status: o.status, rows: o.rows, icon: icon, titles: titles, tools: o.tools });
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
        var outTitle = !since ? t.out_of_stock : t.out_since ? t.out_since.replace('{s}', since) : `${t.out_of_stock} ${t.since} ${since}`;
        return '<div class="fuel out" title="' + carbEsc(outTitle) + '">' +
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
      // A button for the keyboard too: Enter or Space expands the station (_onListKey).
      '<div class="row" role="button" tabindex="0" aria-expanded="' + expanded + '">' + this._logoHtml(s) +
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
    var today = carbStationTime(s, now).day;
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
    this._toggleStation(item.getAttribute('data-id'));
  }

  // Enter or Space on a station row, as a click on it. Keys typed elsewhere (a link of the details) pass.
  _onListKey(ev) {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    var item = ev.target.closest('.station');
    if (!item || item.querySelector('.row') !== ev.target) return;
    ev.preventDefault();
    this._toggleStation(item.getAttribute('data-id'));
  }

  _toggleStation(id) {
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
      // ha-card is an inline-size container (no width of its own): in a container sized by its content (layout-card,
      // inline-block, grid column `auto`) the card takes 220 px, under the 234 px of its narrowest Sections view size.
      // That width comes from an empty grid whose only track is minmax(0, 220px): 220 px as max-content, 0 as
      // min-content, so in a `1fr 1fr` grid (wrapped in a div or not) the card still shrinks to its track. A min-width
      // or contain-intrinsic-* on the host would be a minimum and overflow there.
      ':host { display: block; }',
      ':host::before { content: ""; display: grid; grid-template-columns: minmax(0, 220px); height: 0; }',
      // Status texts: the state colour mixed with the text colour, so that they reach 4.5:1 on the card in light
      // and dark themes (the plain colours stay on borders, pins and dots).
      ':host { --carb-success-text: color-mix(in srgb, var(--success-color, #43a047) 55%, var(--primary-text-color, #212121)); --carb-info-text: color-mix(in srgb, var(--info-color, #039be5) 55%, var(--primary-text-color, #212121)); --carb-error-text: color-mix(in srgb, var(--error-color, #db4437) 55%, var(--primary-text-color, #212121)); --carb-warning-text: color-mix(in srgb, var(--warning-color, #ffa600) 50%, var(--primary-text-color, #212121)); }',
      // A container, so that the stations reflow on a narrow card (see the end of the list).
      'ha-card { padding: 0 0 8px; overflow: hidden; container: carb-card / inline-size; }',
      // Icon 12 px from the top and left edges; the first station's own 8 px padding sets the body 8 px below.
      // Narrow card: the title keeps the icon and 5 letters; below that the refresh button wraps instead of leaving the card.
      '.header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 10px; padding: 12px 12px 0; }',
      // Illustrated header: the banner edge to edge, the first station 8 px below it.
      '.header.illus { display: block; padding: 0 0 4px; }',
      CARBURANTS_SCENE_STYLE,
      CARBURANTS_STATUS_STYLE,
      '.banner .fprice { color: inherit; }',
      '.title { flex: 1 1 0; display: flex; align-items: center; gap: 10px; }',
      '.titles { flex: 1 1 0; min-width: 5ch; contain: inline-size; }',
      ':host([hide-title]) .titles > .hname, :host([hide-title]) .titles > :is(.ctline, .tline) > .hname, :host([hide-subtitle]) .titles > .hsub { display: none; }',
      '.hname { font-size: 16px; font-weight: 500; line-height: 1.25; color: var(--primary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      // The subtitle wraps rather than being cut ("Podaci nisu dostupni" on a 234 px card).
      '.hsub { font-size: 12px; color: var(--secondary-text-color); white-space: normal; overflow-wrap: anywhere; }',
      '.icon-link { display: flex; flex: none; }',
      // Generic fuel pump in a round badge tinted with the theme's primary colour.
      '.hbadge { --c: var(--primary-color, #03a9f4); width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; flex: none; background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); --mdc-icon-size: 24px; }',
      // The 48 px button would make the row taller than the 40 px icon: it overlaps the padding instead.
      '.refresh-btn { flex: none; margin: -4px -4px -4px auto; }',
      '.refresh-btn.spinning ha-icon { animation: carb-spin 1s linear infinite; }',
      '@keyframes carb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '.empty { padding: 12px 16px; color: var(--secondary-text-color); }',
      '.station { padding: 8px 12px; cursor: pointer; border-top: 1px solid var(--divider-color, rgba(0,0,0,.12)); }',
      '.station:first-child { border-top: none; }',
      '.row { display: flex; align-items: center; gap: 10px; border-radius: 8px; }',
      '.row:focus { outline: none; }',
      '.row:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 2px; }',
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
      '.opening.open, .opening.always { color: var(--carb-success-text); }',
      '.opening.automate { color: var(--carb-info-text); }',
      '.opening.closed { color: var(--carb-error-text); }',
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
      '.fuel.best .fprice, .fuel.best .fname ha-icon { color: var(--carb-success-text); }',
      '.fuel.out { border-color: var(--warning-color, #ffa600); background: color-mix(in srgb, var(--warning-color, #ffa600) 8%, transparent); }',
      '.fuel.out .fprice { font-size: 13px; color: var(--carb-warning-text); }',
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
      // Narrow card (half a Sections view section): the fuel tiles wrap two or one per row under the station instead of
      // overflowing, the opening status goes under the name (which keeps the whole width) and wraps, so do the hours. !important: the tile columns are an inline style (carbFuelColumns).
      '@container carb-card (max-width: 299px) { .fuels { grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)) !important; margin-left: 0; } .details { margin-left: 0; } .line1 { flex-flow: column nowrap; align-items: stretch; gap: 0; } .opening { white-space: normal; } .fuel.empty { display: none; } }',
      // Last, so that it outranks the rules above. Reduced motion: no spin nor swing; a dimmed icon still says a refresh is running.
      `@media (prefers-reduced-motion: reduce) { .refresh-btn.spinning ha-icon { animation: none; opacity: .5; } .chevron { transition: none; } ${CARBURANTS_SCENE_REDUCED} }`,
    ].join('\n');
  }
}
