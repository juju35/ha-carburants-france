// ── carburants-france-mini-card ───────────────────────────────────────────────
// Styles of the mini card in both views. Only the compact view's ha-card is a size container; the empty grid before
// the host gives it up to 240 px in a parent sized by its content, and no minimum.
import { pickerDefine } from "./card-picker.js";
import { CARBURANTS_FAILED_LOGOS, CARBURANTS_MINI_DEFAULTS, carbBestPrices, carbCheapest, carbEsc, carbLogo, carbUnavailable, carbWatchOutside } from "./i18n-helpers.js";
import { carbFuelBadge } from "./fuel-badges.js";
import { carbFitPill, carbMorph, carbPill, carbPillLabel, carbStatus, carbTotemRows } from "./illustrated-header.js";
import { CarburantsFranceCard } from "./card.js";
import { CarburantsFranceCardEditor } from "./editor.js";

export var CARBURANTS_MINI_STYLE = [
  ':host([mini])::before { grid-template-columns: minmax(0, 240px); }',
  'ha-card.mini { padding: 12px; container: carb-mini / inline-size; }',
  // Illustrated: the 90 px banner is the whole compact card.
  'ha-card.mini.illus { padding: 0; }',
  '.banner .mprice .fprice { font-size: 16px; }',
  // Narrow compact card: the price alone on the sky (the totem shows the chosen fuel first).
  '@container carb-banner (max-width: 340px) { .banner .mprice .fbadge { display: none; } }',
  '.mrow { display: flex; align-items: center; gap: 10px; min-width: 0; }',
  '.mrow .titles { min-width: 4ch; display: flex; flex-direction: column; }',
  '.mrow .hsub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
  '.mprice { display: flex; align-items: center; gap: 6px; min-width: 0; }',
  '.mprice .fprice { font-size: 16px; }',
  '.mprice .out { color: var(--carb-warning-text); }',
  // Detail button: a bare icon at the top right, never a filled button.
  '.zoom { all: unset; flex: none; cursor: pointer; width: 24px; height: 24px; margin: -4px -4px -4px 0; border-radius: 50%; align-self: flex-start; display: grid; place-items: center; color: var(--secondary-text-color); }',
  '.zoom ha-icon { color: inherit; --mdc-icon-size: 16px; }',
  '.zoom:hover { background: color-mix(in srgb, var(--secondary-text-color) 14%, transparent); color: var(--primary-text-color); }',
  '.zoom:focus-visible { outline: 2px solid var(--primary-color, #03a9f4); outline-offset: 1px; }',
  '.header .zoom { margin: -4px -4px -4px 0; }',
  // Very narrow (6 columns of a phone section): tighter gaps, 4 px taken from the padding, a 14 px price.
  // Tighter still (4 columns): the price alone, the fuel badge would be cut.
  '@container carb-mini (max-width: 180px) { .mrow { gap: 6px; margin: 0 -4px; } .mprice .fprice { font-size: 14px; } }',
  '@container carb-mini (max-width: 150px) { .mprice .fbadge { display: none; } }',
].join('\n');

// A click in a dialog opened from the page (a more-info, say) is not a click outside the card.
export function carbInDialog(ev) {
  return ev.composedPath().some((n) => ['ha-more-info-dialog', 'ha-dialog', 'dialog'].includes(n.localName));
}

// The mini card extends the list card: one row with the header badge, the cheapest price of one fuel and the station
// selling it. Its detail button (top right, `zoom: false` removes it) switches it to the full list card, same
// configuration; the button or a click anywhere outside the card brings it back.
export class CarburantsFranceMiniCard extends CarburantsFranceCard {
  static getConfigElement() {
    return document.createElement('carburants-france-mini-card-editor');
  }

  setConfig(config) {
    // The host attribute behind the mini card's styles; never set in the constructor (not allowed there).
    this.setAttribute?.('mini', '');
    this._zoomed = !!this._zoomed;
    super.setConfig(Object.assign({}, CARBURANTS_MINI_DEFAULTS, config || {}));
  }

  connectedCallback() {
    super.connectedCallback();
    this._onOutsideZoom = this._onOutsideZoom || ((ev) => {
      if (this._zoomed && !ev.composedPath().includes(this) && !carbInDialog(ev)) this._setZoom(false);
    });
    (this._zoomWatch = this._zoomWatch || carbWatchOutside(this, (ev) => this._onOutsideZoom(ev))).on();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._zoomWatch?.off();
    // Left the page: compact again when it comes back.
    this._zoomed = false;
  }

  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  getGridOptions() {
    return this._zoomed ? super.getGridOptions() : { columns: 6, min_columns: 6, rows: 'auto' };
  }

  // The fuel shown: the `fuel` option, else the sort fuel, else the first fuel of the sensor.
  _miniFuel() {
    var all = this._lastState?.attributes?.fuels || [];
    var wanted = this._config.fuel || this._config.sort_fuel;
    return all.find((f) => f.key === wanted) || all[0] || null;
  }

  _ensureShell() {
    if (this._root) return;
    super._ensureShell();
    var style = document.createElement('style');
    style.textContent = CARBURANTS_MINI_STYLE;
    this._root.appendChild(style);
    var mini = document.createElement('ha-card');
    mini.className = 'mini';
    this._root.appendChild(mini);
    this._root.addEventListener('click', (ev) => {
      if (!ev.target.closest?.('.zoom')) return;
      ev.stopPropagation();
      // A keyboard activation of a button is a click without a click count.
      this._setZoom(!this._zoomed, ev.detail === 0);
    });
  }

  _zoomButton() {
    if (this._config?.zoom === false) return '';
    var label = carbEsc(this._t()[this._zoomed ? 'zoom_out' : 'zoom_in']);
    return `<button type="button" class="zoom" title="${label}" aria-label="${label}"><ha-icon icon="mdi:${this._zoomed ? 'arrow-collapse' : 'arrow-expand'}"></ha-icon></button>`;
  }

  // keyboard: activated with Enter / Space, the focus goes to the button of the new view, without scrolling.
  _setZoom(zoomed, keyboard) {
    this._zoomed = zoomed;
    this._render();
    // Home Assistant lays the card out again (grid options, size).
    this.dispatchEvent(new Event('card-resized', { bubbles: true, composed: true }));
    if (keyboard) {
      var view = this._root.querySelector(zoomed ? 'ha-card:not(.mini)' : 'ha-card.mini');
      view?.querySelector('.zoom')?.focus({ preventScroll: true });
    }
  }

  _render() {
    if (!this._config || !this._hass) return;
    this._ensureShell();
    var full = this._root.querySelector('ha-card:not(.mini)');
    var mini = this._root.querySelector('ha-card.mini');
    full.style.display = this._zoomed ? '' : 'none';
    mini.style.display = this._zoomed ? 'none' : '';
    if (this._zoomed) {
      super._render();
      return;
    }
    mini.classList?.toggle('illus', this._config.illustration !== false);
    var html = this._miniHtml();
    // Unchanged (the minute timer): the picture keeps its running animations.
    if (html !== this._miniCache) {
      this._miniCache = html;
      carbMorph(mini, html);
      carbFitPill(this, this._root);
    }
  }

  _miniHtml() {
    var t = this._t();
    var st = this._lastState;
    var title = this._config.title || t.default_title;
    var fuel = st && !carbUnavailable(st) ? this._miniFuel() : null;
    var station = fuel ? carbCheapest(st.attributes.stations || [], fuel.key) : null;
    var line1 = carbEsc(title);
    var sub = !st ? t.no_entity : carbUnavailable(st) ? t.unavailable : !fuel ? t.empty : '';
    if (fuel) {
      var price = station
        ? `<span class="fprice">${this._price(station.fuels[fuel.key].price)}</span>`
        : `<span class="fprice out">${carbEsc(t.out_of_stock)}</span>`;
      line1 = `<span class="mprice">${price}${carbFuelBadge(fuel.key, fuel.name)}</span>`;
      sub = station ? station.station_name : title;
      if (station && this._config.show_distance && station.distance != null) {
        sub += ` · ${new Intl.NumberFormat(this._locale(), { maximumFractionDigits: 1 }).format(station.distance)} km`;
      }
    }
    var status = carbStatus(st, st?.attributes?.stations, this._fuels());
    if (this._config.illustration !== false) {
      // The chosen fuel first on the totem, then the others shown.
      var fuels = this._fuels();
      if (fuel) fuels = [fuel].concat(fuels.filter((f) => f.key !== fuel.key));
      var known = station && this._config.show_logo ? carbLogo(station) : null;
      var badge = known && !CARBURANTS_FAILED_LOGOS.has(known.src)
        ? `<span class="badge" title="${carbEsc(station.brand || '')}"><img src="${carbEsc(known.src)}" alt="" referrerpolicy="no-referrer"></span>`
        : '';
      return this._headerMarkup({
        title: title,
        titleHtml: line1,
        sub: sub === t.unavailable ? '' : sub,
        pill: carbPillLabel(t, status, st?.state, this._locale()),
        status: status,
        rows: carbTotemRows(fuels, st && !carbUnavailable(st) ? carbBestPrices(st.attributes.stations || [], fuels) : null, this._locale()),
        subTitle: true,
        tools: this._zoomButton(),
        badge: badge,
        link: false,
      });
    }
    var icon = this._iconHtml(status, '', false);
    var mpill = carbPill(status, carbPillLabel(t, status, st?.state, this._locale()));
    return '<div class="mrow">' + icon +
      '<div class="titles"><div class="ctline"><div class="hname">' + line1 + '</div>' + mpill + '</div>' +
      (sub && sub !== t.unavailable ? `<div class="hsub" title="${carbEsc(sub)}">${carbEsc(sub)}</div>` : '') + '</div>' +
      this._zoomButton() + '</div>';
  }
}

export class CarburantsFranceMiniCardEditor extends CarburantsFranceCardEditor {
  static get mini() {
    return true;
  }
}

if (!customElements.get('carburants-france-mini-card-editor')) {
  pickerDefine('carburants-france-mini-card-editor', CarburantsFranceMiniCardEditor);
}

if (!customElements.get('carburants-france-mini-card')) {
  pickerDefine('carburants-france-mini-card', CarburantsFranceMiniCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'carburants-france-mini-card',
    name: 'Carburants France Mini',
    description: 'Compact: the cheapest price of one fuel and its station, with a button to show the full card.',
    preview: true,
    documentationURL: 'https://github.com/juju35/ha-carburants-france',
  });
}
