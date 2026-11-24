// ── carburants-france-card-editor ─────────────────────────────────────────────
import { CARBURANTS_CARD_VERSION, pickerDefine } from "./card-picker.js";
import { CARBURANTS_DEFAULTS, CARBURANTS_MINI_DEFAULTS, carbLang, carbLanguageOptions, carbSetSchema } from "./i18n-helpers.js";
import { carbIllustrationThemes } from "./illustrated-header.js";
import { CarburantsFranceCard } from "./card.js";
import { CarburantsI18n } from "./i18n/strings.js";

export class CarburantsFranceCardEditor extends HTMLElement {
  // The mini card's editor adds its fuel and detail button options.
  static get mini() {
    return false;
  }

  _defaults() {
    return Object.assign({}, CARBURANTS_DEFAULTS, this.constructor.mini ? CARBURANTS_MINI_DEFAULTS : {});
  }

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
      ...(this.constructor.mini ? [{ name: 'fuel', selector: { select: { mode: 'dropdown', options: fuels } } }] : []),
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
          { name: 'illustration', selector: { boolean: {} } },
          { name: 'illustration_theme', selector: { select: { mode: 'dropdown', options: carbIllustrationThemes(t.editor) } } },
        ],
      },
      {
        type: 'grid',
        name: '',
        schema: [
          { name: 'show_title', selector: { boolean: {} } },
          { name: 'show_subtitle', selector: { boolean: {} } },
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
          ...(this.constructor.mini ? [{ name: 'zoom', selector: { boolean: {} } }] : []),
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
    this._form.data = Object.assign(this._defaults(), this._config);
  }

  _valueChanged(ev) {
    var value = Object.assign({}, ev.detail.value);
    // Keep the YAML short: drop options left at their default.
    var defaults = this._defaults();
    Object.keys(defaults).forEach((key) => {
      if (value[key] === defaults[key]) delete value[key];
    });
    ['title', 'entity', 'sort_fuel', 'fuel'].forEach((key) => { if (!value[key]) delete value[key]; });
    if (Array.isArray(value.fuels) && !value.fuels.length) delete value.fuels;
    var rebuild = value.entity !== this._config.entity || value.language !== this._config.language;
    this._config = value;
    if (rebuild) this._setSchema();
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: value }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('carburants-france-card-editor')) {
  pickerDefine('carburants-france-card-editor', CarburantsFranceCardEditor);
}

if (!customElements.get('carburants-france-card')) {
  pickerDefine('carburants-france-card', CarburantsFranceCard);
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
