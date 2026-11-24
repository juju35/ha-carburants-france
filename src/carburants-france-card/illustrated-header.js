// ── Illustrated header (list, mini and map cards) ─────────────────────────────
// A fuel station on the right of a 90 px banner: price totem with the cheapest prices the card shows, canopy,
// two pumps and a car filling up, over a sky (sun or moon) and a 10 px road strip edge to edge at the bottom. The
// left of the banner is open sky for the icon, the title and the subtitle. Status of the data:
// ok (prices in stock: the car fills up), idle (no station to show), out (every fuel out of stock), off (no data).
// Short names on the totem, as at the pump.
import { carbBestPrices, carbEsc, carbPlural, carbUnavailable } from "./i18n-helpers.js";
import { CARBURANTS_FUEL_BADGES } from "./fuel-badges.js";

export var CARBURANTS_TOTEM_LABELS = { gazole: 'Gazole', sp95: 'SP95', sp98: 'SP98', e10: 'SP95-E10', e85: 'E85', gplc: 'GPLc' };
export var carbUidSeq = 0;
export function carbUid() {
  carbUidSeq += 1;
  return `cb${carbUidSeq}`;
}

// Night picture: forced by illustration_theme, else Home Assistant's dark theme alone (a light theme keeps the day
// picture after sunset).
export function carbIsNight(hass, config) {
  var theme = config?.illustration_theme;
  if (theme === 'night') return true;
  if (theme === 'day') return false;
  return !!hass?.themes?.darkMode;
}

// The totem rows: the cheapest price in stock of the first three fuels shown (`best` from carbBestPrices).
export function carbTotemRows(fuels, best, locale) {
  var fmt = new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return (fuels || []).slice(0, 3).map((f) => ({
    label: CARBURANTS_TOTEM_LABELS[f.key] || String(f.name || f.key || '').slice(0, 8),
    color: CARBURANTS_FUEL_BADGES[f.key]?.bg || '#8a96a3',
    price: best && best[f.key] != null ? fmt.format(best[f.key]) : null,
  }));
}

// Status of a set of stations: ok when a fuel shown is in stock somewhere, out when every one is out of stock.
export function carbStatus(st, stations, fuels) {
  if (!st || carbUnavailable(st)) return 'off';
  if (!stations || !stations.length) return 'idle';
  var best = carbBestPrices(stations, fuels || []);
  return Object.keys(best).some((k) => best[k] != null) ? 'ok' : 'out';
}

// The picture, drawn in a 320 × 78 frame of which x 150–320 is shown (viewBox), base line at y 78 (top of the
// road strip). The station is drawn at the 200 × 80 scale of its design, then scaled 1.18 into place.
export function carbSceneSvg(uid, status, rows) {
  var esc = carbEsc;
  var stars = [[158, 6, 0.7], [168, 24, 0.5], [190, 4, 0.6], [226, 22, 0.45], [252, 6, 0.7], [276, 14, 0.5], [298, 5, 0.6], [314, 16, 0.45]]
    .map(([x, y, r], i) => `<circle class="cb-star${i % 3 ? '' : ' tw'}" cx="${x}" cy="${y}" r="${r}"/>`).join('');
  var list = rows && rows.length ? rows : [{ label: '', color: '#8a96a3', price: null }];
  var h = 10 + list.length * 9.6;
  var totem = `<g class="cb-totem" transform="translate(96 ${56 - h})"><rect class="cb-pole" x="-1.5" y="${h - 4}" width="3" height="22"/>` +
    `<rect class="cb-tbox" x="-22" y="0" width="44" height="${h + 1}" rx="3"/><rect class="cb-thead" x="-22" y="0" width="44" height="7" rx="3"/><rect class="cb-thead" x="-22" y="4" width="44" height="3"/>` +
    '<text class="cb-tprix" y="5.3" text-anchor="middle">PRIX</text>' +
    list.map((r, i) => {
      var y = 9.6 + i * 9.6;
      return `<rect class="cb-trow" x="-19.5" y="${y}" width="39" height="8" rx="1"/><rect x="-19.5" y="${y}" width="2" height="8" fill="${esc(r.color)}"/>` +
        `<text class="cb-tlabel" x="-16" y="${y + 5.3}">${esc(r.label)}</text>` +
        `<text class="cb-tprice${r.price && status !== 'off' ? '' : ' none'}" x="18.4" y="${y + 5.9}" text-anchor="end">${esc(status === 'off' ? '' : r.price || '----')}</text>`;
    }).join('') + '</g>';
  var screen = (x) => {
    if (status === 'out') return '<text class="cb-digits out" y="-21.8" text-anchor="middle">----</text>';
    if (status === 'off') return '';
    if (status === 'ok' && x > 150) {
      return ['12.6', '24.1', '32.4'].map((v, i) => `<text class="cb-digits cb-n${i + 1}" y="-21.8" text-anchor="middle">${v}</text>`).join('');
    }
    return '<text class="cb-digits" y="-21.8" text-anchor="middle">0.00</text>';
  };
  var pump = (x) => `<g transform="translate(${x} 74)"><rect class="cb-pump" x="-7" y="-30" width="14" height="30" rx="2"/>` +
    `<rect class="cb-screen" x="-5" y="-27" width="10" height="7" rx="1"/>${screen(x)}` +
    '<rect class="cb-band" x="-7" y="-14" width="14" height="3"/><path class="cb-hose" d="M7 -18 q5 0 5 6 v8"/>' +
    (status === 'ok' && x > 150 ? '<path class="cb-flow" d="M7 -18 q5 0 5 6 v8"/>' : '') + '</g>';
  var car = status === 'ok'
    ? '<g class="cb-car" transform="translate(150 75.6)"><path class="cb-body" d="M0 -6 Q1 -11 8 -12 L14 -16 H26 L33 -12 Q40 -11 40 -6 V-2 H0Z"/>' +
      '<path class="cb-glass" d="M15 -15 H25 L30 -12 H11Z"/><rect class="cb-light" x="38" y="-8" width="2" height="1.6" rx=".6"/>' +
      '<circle class="cb-wheel" cx="9" cy="-2" r="3.4"/><circle class="cb-wheel" cx="31" cy="-2" r="3.4"/>' +
      '<circle class="cb-hub" cx="9" cy="-2" r="1.2"/><circle class="cb-hub" cx="31" cy="-2" r="1.2"/></g>'
    : '';
  return `<svg class="cb-scene" viewBox="150 0 170 78" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false">
    <defs><linearGradient id="cb-glow-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></linearGradient></defs>
    <g class="cb-day"><circle class="cb-sunhalo" cx="238" cy="9" r="7"/><circle class="cb-sun" cx="238" cy="9" r="4.4"/>
      <path class="cb-cloud" d="M158 14a3.4 3.4 0 0 1 5-2.8 4.2 4.2 0 0 1 8 1.2 2.6 2.6 0 0 1 .4 5H160a2.6 2.6 0 0 1-2-3.4Z"/></g>
    <g class="cb-night">${stars}<path class="cb-moon" d="M238 4a5 5 0 1 0 4.4 7.5 4 4 0 1 1-4.4-7.5Z"/></g>
    <path class="cb-hill" d="M150 78C186 70 214 64 252 62.6C278 61.8 300 62 320 62.4V78Z"/>
    <g transform="translate(320 78) scale(1.18) translate(-200 -74)">
      ${totem}
      <rect class="cb-roof" x="122" y="24" width="78" height="7" rx="1"/><rect class="cb-stripe ${status === 'off' ? 'dim' : ''}" x="122" y="29" width="78" height="3"/>
      <rect class="cb-lamp" x="124" y="32" width="76" height="42" fill="url(#cb-glow-${uid})"/>
      <rect class="cb-post" x="132" y="32" width="3" height="42"/><rect class="cb-post" x="190" y="32" width="3" height="42"/>
      ${pump(146)}${pump(178)}${car}
    </g>
  </svg>`;
}

export var CARBURANTS_SCENE_STYLE = [
  '.banner { position: relative; overflow: hidden; height: 90px; color: #0d2a45; container: carb-banner / inline-size; background: linear-gradient(90deg, #f1f8ff 0%, #e2f1fd 34%, #b9def8 70%, #9fd0f3 100%); }',
  '.banner.night { color: #fff; background: linear-gradient(90deg, #1b2f52 0%, #15284a 36%, #0f1f3d 72%, #0a1830 100%); }',
  // The road: a 10 px strip edge to edge, dashed centre line; the scene stands on it.
  '.cb-ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: #858c94; box-shadow: inset 0 1px 0 #6f767d; }',
  '.cb-ground::after { content: ""; position: absolute; left: 0; right: 0; top: calc(50% - .8px); height: 1.6px; background: repeating-linear-gradient(90deg, rgba(255,255,255,.85) 0 9px, transparent 9px 18px); }',
  '.night .cb-ground { background: #2c323b; box-shadow: inset 0 1px 0 #3a414b; }',
  '.night .cb-ground::after { background: repeating-linear-gradient(90deg, rgba(255,255,255,.45) 0 9px, transparent 9px 18px); }',
  '.cb-scene { position: absolute; right: 0; bottom: 10px; height: calc(100% - 10px); width: min(46cqw, 175px); overflow: hidden; }',
  // The text on the sky, left of the scene.
  '.banner .htext { position: absolute; left: 12px; top: 6px; bottom: 16px; right: calc(min(46cqw, 175px) + 4px); display: flex; align-items: center; gap: 10px; min-width: 0; }',
  '.banner .titles { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 1px; align-self: stretch; justify-content: center; }',
  // The status pill right after the title, centred on it (placed by carbFitPill); on a narrow card, its dot alone.
  '.banner .stpill { background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }',
  '.banner.night .stpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }',
  // Half a Sections view or narrower: a smaller station (the buttons keep the sky above it) and a smaller icon.
  '@container carb-banner (max-width: 300px) { .cb-scene { width: 34cqw; } .banner .htext { right: calc(34cqw + 2px); gap: 8px; }' +
    ' .banner .htext .hbadge { width: 34px; height: 34px; --mdc-icon-size: 20px; } .banner .stpill { position: relative; z-index: 1; } }',
  '@container carb-banner (max-width: 200px) { .banner .stpill { padding: 4px; } .banner .stpill .st-text { display: none; } }',
  '.banner .hname { color: inherit; font-weight: 600; }',
  // The subtitle wraps on two lines at most on a narrow card.
  '.banner .hsub { color: #3b5b78; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow-wrap: anywhere; }',
  '.banner.night .hsub { color: rgba(255,255,255,.78); }',
  '.banner .hbadge { position: relative; background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent); }',
  '.banner.night .hbadge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); color: color-mix(in srgb, var(--c) 62%, #fff); }',
  // Buttons on the sky, top right (refresh, detail).
  // 24 px frosted discs on the banner's top line: the detail button in the top-right corner, refresh at its left.
  '.banner .btools { position: absolute; z-index: 2; top: 5px; right: 5px; display: flex; gap: 4px; }',
  '.banner .btools > * { margin: 0 !important; box-sizing: border-box; color: #33506b !important; background: rgba(255,255,255,.55); border-radius: 50%;' +
    ' box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }',
  '.banner .btools > *:hover { background: rgba(255,255,255,.75); }',
  '.banner.night .btools > * { color: #fff !important; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }',
  '.banner.night .btools > *:hover { background: rgba(255,255,255,.22); }',
  '.banner .refresh-btn { --mdc-icon-button-size: 24px; --mdc-icon-size: 16px; --ha-icon-button-size: 24px; width: 24px !important; height: 24px !important; display: grid; place-items: center; }',
  '.banner .zoom { width: 24px; height: 24px; align-self: auto; }',
  // Narrow card: the scene shrinks with the card (meet), the text keeps at least half.
  '.cb-night, .night .cb-day { display: none; }',
  '.night .cb-night { display: inline; }',
  '.cb-sun { fill: #ffd65a; } .cb-sunhalo { fill: #ffd65a; opacity: .28; }',
  '.cb-cloud { fill: #fff; opacity: .9; animation: cb-drift 6s ease-in-out infinite alternate; }',
  '.cb-star { fill: #fff; opacity: .8; } .cb-star.tw { animation: cb-twinkle 3.2s ease-in-out infinite alternate; }',
  '.cb-moon { fill: #f3eed2; }',
  '.cb-hill { fill: #a7d39f; } .night .cb-hill { fill: #1d3a4a; }',
  '.cb-pole { fill: #5f6b7a; }',
  '.cb-tbox { fill: #1d3a5e; } .night .cb-tbox { fill: #1f2a36; }',
  '.cb-thead { fill: #e5484d; }',
  '.cb-tprix { font: 700 4.4px sans-serif; fill: #fff; }',
  '.cb-trow { fill: #0b0f14; }',
  '.cb-tlabel { font: 3.3px sans-serif; fill: #cfd6de; }',
  '.cb-tprice { font: 700 5px monospace; fill: #ffd65a; } .cb-tprice.none { fill: #8a96a3; }',
  '.night .cb-tprice { filter: drop-shadow(0 0 1px #ffb300); } .night .cb-tprice.none { filter: none; }',
  '.cb-roof { fill: #f6f8fa; } .night .cb-roof { fill: #e8ecf0; }',
  '.cb-stripe { fill: #e5484d; } .cb-stripe.dim { fill: #9aa3ae; }',
  '.cb-lamp { display: none; } .night .cb-lamp { display: inline; }',
  '.cb-post { fill: #c9ced6; } .night .cb-post { fill: #9aa3ae; }',
  '.cb-pump { fill: #fff; stroke: #c9ced6; stroke-width: .6; } .night .cb-pump { fill: #d8dce2; stroke: #9aa3ae; }',
  '.cb-screen { fill: #101418; }',
  '.cb-digits { font: 700 4px monospace; fill: #ffd65a; } .cb-digits.out { fill: #ff6b5e; }',
  '.cb-band { fill: #e5484d; }',
  '.cb-hose { stroke: #2a3038; stroke-width: 1.4; fill: none; }',
  '.cb-flow { stroke: #f5b400; stroke-width: .8; fill: none; stroke-dasharray: 1.4 2.2; animation: cb-flow .8s linear infinite; }',
  '.cb-body { fill: #2f80ed; } .cb-glass { fill: #cfe6f7; } .night .cb-glass { fill: #3b4b5e; }',
  '.cb-wheel { fill: #22262b; } .cb-hub { fill: #9aa3ae; }',
  '.cb-light { fill: #fff2c2; } .night .cb-light { fill: #fffbe6; filter: drop-shadow(0 0 1.4px #fff3b0); }',
  // The pump counter: 12.6, 24.1 then 32.4 litres, again and again.
  // Without animation (reduced motion, a still picture), the last count stays.
  '.cb-n1, .cb-n2 { opacity: 0; }',
  '.cb-n1 { animation: cb-c1 3s steps(1, end) infinite; } .cb-n2 { animation: cb-c2 3s steps(1, end) infinite; } .cb-n3 { animation: cb-c3 3s steps(1, end) infinite; }',
  '@keyframes cb-c1 { 0% { opacity: 1; } 33.34%, 100% { opacity: 0; } }',
  '@keyframes cb-c2 { 0% { opacity: 0; } 33.34% { opacity: 1; } 66.67%, 100% { opacity: 0; } }',
  '@keyframes cb-c3 { 0% { opacity: 0; } 66.67%, 100% { opacity: 1; } }',
  '@keyframes cb-flow { to { stroke-dashoffset: -3.6; } }',
  '@keyframes cb-drift { from { transform: translateX(-3px); } to { transform: translateX(3px); } }',
  '@keyframes cb-twinkle { from { opacity: .3; } to { opacity: 1; } }',
].join('\n');
// Reduced motion for the picture: inside each card's own reduced motion block, which comes last.
export var CARBURANTS_SCENE_REDUCED = '.cb-cloud, .cb-star.tw, .cb-flow, .cb-n1, .cb-n2, .cb-n3 { animation: none !important; }';

// Status colour of the header icon, day and night, banner or classic header.
export var CARBURANTS_STATUS_STYLE = [
  '.hbadge.st-ok { --c: var(--primary-color, #03a9f4); }',
  '.hbadge.st-idle { --c: var(--disabled-text-color, #8a96a3); }',
  '.hbadge.st-out { --c: var(--warning-color, #ffa600); }',
  '.hbadge.st-off { --c: var(--error-color, #db4437); }',
  // Brand badge on the header icon (mini card: the cheapest station's brand), on a white tile.
  '.hbadge .badge { position: absolute; right: -4px; bottom: -4px; width: 18px; height: 18px; border-radius: 5px; padding: 2px; box-sizing: border-box; display: grid; place-items: center; background: #fff; box-shadow: 0 0 0 1px rgba(13,42,69,.16), 0 1px 3px rgba(13,42,69,.18); }',
  '.hbadge .badge img { width: 100%; height: 100%; object-fit: contain; }',
  '.hbadge { position: relative; }',
  // The status pill after the title, in the header icon's colour (classic style; the banner restyles it).
  '.stpill { display: inline-flex; align-items: center; gap: 4px; flex: none; max-width: 100%; box-sizing: border-box; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;' +
    ' line-height: 16px; white-space: nowrap; background: color-mix(in srgb, var(--c) 15%, transparent); color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color)); }',
  '.stpill.st-ok { --c: var(--primary-color, #03a9f4); } .stpill.st-idle { --c: var(--disabled-text-color, #8a96a3); }',
  '.stpill.st-out { --c: var(--warning-color, #ffa600); } .stpill.st-off { --c: var(--error-color, #db4437); }',
  '.stpill .sdot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--c); }',
  '.stpill .st-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }',
  // The status pill right after the title, its whole label on one line, while the title stays whole beside it
  // (measured by the card, see carbFitPill); otherwise on its own line under a one-line subtitle, and with its dot
  // alone when even that does not fit the header.
  ':is(.tline, .ctline) { display: flex; align-items: center; gap: 8px; min-width: 0; }',
  ':is(.tline, .ctline) > .hname { flex: 0 1 auto; min-width: 0; }',
  ':is(.tline, .ctline) > .stpill { flex: none; max-width: none; }',
  ':is(.tline, .ctline) > .stpill .st-text { white-space: nowrap; overflow: visible; }',
  '.titles.below { display: grid; grid-template-columns: minmax(0, 1fr); align-content: center; }',
  '.titles.below > :is(.tline, .ctline) { display: contents; }',
  '.titles.below > :is(.tline, .ctline) > .stpill { order: 3; justify-self: start; align-self: start; margin-top: 3px; }',
  '.titles.below > .hsub { order: 2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
  '.titles.dot-only > :is(.tline, .ctline) { display: flex; }',
  '.titles.dot-only > :is(.tline, .ctline) > .stpill { order: 0; margin-top: 0; align-self: center; padding: 4px; }',
  '.titles.dot-only > :is(.tline, .ctline) > .stpill .st-text { display: none; }',
  '.titles.below > .hsub { display: block; }',
].join('\n');

// The status pill: the stations count, out of stock, or unavailable data, in the status colour.
export function carbPillLabel(t, status, n, locale) {
  if (status === 'off') return t.unavailable;
  if (status === 'out') return t.out_of_stock;
  var count = Number(n) || 0;
  return `${count} ${carbPlural(t, 'stations', count, locale)}`;
}
export function carbPill(status, label) {
  var l = carbEsc(label);
  return `<span class="stpill st-${status}" role="status" title="${l}" aria-label="${l}"><span class="sdot"></span><span class="st-text">${l}</span></span>`;
}

// The width of an element's whole text in fractional pixels, even while an ellipsis cuts it.
export const carbTextWidth = (el) => {
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width || el.scrollWidth;
};

// The header's status pill goes right after the title, on its row, only while the title stays whole and the
// pill's whole label fits beside it; otherwise it takes a line of its own under the subtitle (.below), the title
// whole on its row (cut only when it does not fit alone). There, in the banner, the subtitle keeps one line; if the
// text still does not fit above the ground strip, the pill keeps its dot alone (.dot-only, its label in its tooltip
// and for screen readers). Measured after each render and on each new width, whatever the language: no fixed
// width threshold.
export function carbFitPill(card, root) {
  // A new <ha-card> lays its content out only once it has rendered (a microtask later, Lit): fitted then again,
  // otherwise the pill keeps a place measured at 0 px.
  for (const hc of root?.querySelectorAll?.('ha-card') || []) {
    if (!hc.updateComplete || hc._carbFitWait) continue;
    hc._carbFitWait = true;
    hc.updateComplete.then(() => carbFitPill(card, root));
  }
  if (!card.isConnected) return;
  for (const t of root?.querySelectorAll?.('.titles') || []) {
    const row = t.querySelector('.tline, .ctline');
    const pills = row ? [...row.children].filter((n) => n.matches('.stpill')) : [];
    if (!pills.length || !pills[0].getBoundingClientRect) continue;
    t.classList.remove('below', 'dot-only');
    const name = row.querySelector('.hname');
    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    const title = name && getComputedStyle(name).display !== 'none' ? carbTextWidth(name) + gap : 0;
    // A card of 200 px or less: the dot alone beside the title (its label in its tooltip), as in the banner.
    if (card.getBoundingClientRect().width <= 200) {
      t.classList.add('dot-only');
      continue;
    }
    const need = pills.reduce((w, p) => w + p.getBoundingClientRect().width + gap, title - gap);
    if (need > t.getBoundingClientRect().width - 0.5) {
      t.classList.add('below');
      const banner = t.closest('.banner');
      if (banner) {
        const b = banner.getBoundingClientRect();
        // Each element as it shows: its box cut by its ancestors that hide their overflow (a clamped line).
        const out = [...t.querySelectorAll('*')].some((n) => {
          let { top, bottom } = n.getBoundingClientRect();
          for (let p = n.parentElement; p && p !== t; p = p.parentElement) {
            if (getComputedStyle(p).overflowY === 'visible') continue;
            top = Math.max(top, p.getBoundingClientRect().top);
            bottom = Math.min(bottom, p.getBoundingClientRect().bottom);
          }
          return bottom - top > 0.5 && (top < b.top - 0.5 || bottom > b.bottom - 10 + 0.5);
        });
        if (out) t.classList.add('dot-only');
      }
    }
    // A subtitle cut by its ellipsis keeps its whole text in its tooltip.
    const s = t.querySelector('.hsub');
    if (s && (!s.hasAttribute('title') || s.dataset.fit)) {
      const cut = s.scrollWidth > s.clientWidth + 1;
      s.toggleAttribute('data-fit', cut);
      if (cut) s.title = s.textContent.trim();
      else s.removeAttribute('title');
    }
  }
}

// A new width (or the web font loaded): the status pill is fitted again, in the next frame.
export function carbObserve(card) {
  if (typeof ResizeObserver === 'function') {
    card._resize = card._resize || new ResizeObserver((entries) => {
      const w = Math.round(entries[entries.length - 1].contentRect.width);
      if (w === card._fitWidth) return;
      card._fitWidth = w;
      cancelAnimationFrame(card._fitFrame);
      card._fitFrame = requestAnimationFrame(() => carbFitPill(card, card._root));
    });
    card._resize.observe(card);
  }
  document.fonts?.ready?.then(() => carbFitPill(card, card._root));
}

// Patches `cur` in place to the markup `html`: kept nodes keep their size, their running animations, a loaded
// <img> and the focus, so a state update does not make the card jump (an <img> created again has no height until
// it is decoded, and the sections grid reflows). Children are matched by `data-id`, else by position.
export function carbPatchAttrs(cur, next) {
  for (const { name } of [...cur.attributes]) if (!next.hasAttribute(name)) cur.removeAttribute(name);
  for (const { name, value } of next.attributes) if (cur.getAttribute(name) !== value) cur.setAttribute(name, value);
}
export function carbKey(n) {
  return n?.nodeType === 1 ? n.getAttribute('data-id') : null;
}
// A custom element with no markup inside (ha-icon) draws itself: it is kept as it is while its markup stays the same,
// and replaced by the new one when that changes (its own attributes and content are never compared).
export function carbLeaf(n) {
  return n.nodeType === 1 && n.localName.includes('-') && !n.childNodes.length;
}
export function carbSig(n) {
  return [...n.attributes].map((a) => `${a.name}=${a.value}`).join(' ');
}
export function carbMark(n) {
  if (n.nodeType !== 1) return;
  if (carbLeaf(n)) n._morphSig = carbSig(n);
  else for (const c of n.childNodes) carbMark(c);
}
export function carbPatchChildren(cur, next) {
  const old = [...cur.childNodes];
  const fresh = [...next.childNodes];
  const byKey = new Map();
  for (const o of old) {
    const k = carbKey(o);
    if (k !== null && !byKey.has(k)) byKey.set(k, o);
  }
  const used = new Set();
  fresh.forEach((n, i) => {
    const k = carbKey(n);
    let o = k !== null ? byKey.get(k) : old[i];
    if (!o || o.nodeType !== n.nodeType || o.nodeName !== n.nodeName || used.has(o) || (k === null && carbKey(o) !== null)) o = null;
    const ref = cur.childNodes[i] ?? null;
    if (o && carbLeaf(n) && o._morphSig !== carbSig(n)) o = null;
    if (!o) {
      carbMark(n);
      cur.insertBefore(n, ref);
      return;
    }
    used.add(o);
    if (o !== ref) cur.insertBefore(o, ref);
    if (n.nodeType === 1) {
      if (carbLeaf(n)) return;
      carbPatchAttrs(o, n);
      carbPatchChildren(o, n);
    } else if (o.nodeValue !== n.nodeValue) o.nodeValue = n.nodeValue;
  });
  while (cur.childNodes.length > fresh.length) cur.removeChild(cur.lastChild);
}
export function carbMorph(cur, html) {
  // Not a DOM node (a detached stand-in): written as a whole.
  if (!cur.childNodes) {
    cur.innerHTML = html;
    return;
  }
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  carbPatchChildren(cur, tpl.content);
}

// The banner: picture, road, then the icon and the titles on the sky, and `tools` at the top right.
export function carbBanner(o) {
  return `<div class="banner${o.night ? ' night' : ''} st-${o.status}"><div class="cb-ground" aria-hidden="true"></div>${carbSceneSvg(o.uid, o.status, o.rows)}` +
    `<div class="htext">${o.icon}<div class="titles">${o.titles}</div></div>${o.tools ? `<div class="btools">${o.tools}</div>` : ''}</div>`;
}

// Choices of the illustration_theme option, labelled from an editor table.
export function carbIllustrationThemes(editor) {
  return ['auto', 'day', 'night'].map((k) => ({ value: k, label: editor[`illustration_theme_${k}`] }));
}
