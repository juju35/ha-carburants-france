// ── Fuel badges (pump colours, EU identifier from EN 16942) ───────────────────
// label: the name at the pump, code: the EU identifier in its circle (none when it repeats the label).
// Dark text on the light colours (gazole) for contrast, white on the dark ones.
import { carbEsc } from "./i18n-helpers.js";

export var CARBURANTS_FUEL_BADGES = {
  gazole: { label: 'Gazole', code: 'B7', bg: '#E8A000', fg: '#1A1A1A' },
  sp95: { label: 'SP95', code: 'E5', bg: '#00A651', fg: '#FFFFFF' },
  sp98: { label: 'SP98', code: 'E5', bg: '#00703C', fg: '#FFFFFF' },
  e10: { label: 'SP95', code: 'E10', bg: '#009A3E', fg: '#FFFFFF' },
  e85: { label: 'E85', code: '', bg: '#0057A8', fg: '#FFFFFF' },
  gplc: { label: 'GPLc', code: '', bg: '#C62828', fg: '#FFFFFF' },
};

// Badge for a fuel; plain text for a key the card doesn't know.
export function carbFuelBadge(key, name) {
  var b = CARBURANTS_FUEL_BADGES[key];
  if (!b) return `<span class="ftext">${carbEsc(name)}</span>`;
  var title = b.code ? `${name} (${b.code})` : name;
  return '<span class="fbadge" role="img" aria-label="' + carbEsc(title) + '" title="' + carbEsc(title) + '" style="--fb-bg:' + b.bg + ';--fb-fg:' + b.fg + '">' +
    carbEsc(b.label) + (b.code ? `<span class="fcode">${carbEsc(b.code)}</span>` : '') + '</span>';
}

export var CARBURANTS_BADGE_STYLES = [
  '.fbadge { display: inline-flex; align-items: center; gap: 4px; height: 18px; padding: 0 2px 0 7px; border-radius: 9px; background: var(--fb-bg); color: var(--fb-fg); font-size: 11px; font-weight: 700; letter-spacing: .02em; line-height: 1; white-space: nowrap; box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); vertical-align: middle; }',
  '.fbadge:not(:has(.fcode)) { padding-right: 7px; }',
  '.fcode { display: inline-flex; align-items: center; justify-content: center; min-width: 14px; height: 14px; padding: 0 2px; box-sizing: border-box; border-radius: 7px; background: #fff; color: var(--fb-bg); font-size: 9px; font-weight: 700; letter-spacing: 0; }',
];

export function carbMinutes(hhmm) {
  var p = String(hhmm).split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
}

// Short weekday name in the card's locale ("lun.", "Mon", "Mo", "lun"), of a date given as UTC noon.
export function carbWeekday(date, locale) {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(date);
  } catch (_e) {
    return new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' }).format(date);
  }
}

// Opening hours are the station's local time: overseas departments by postcode, else mainland France
// (Corsica included), whatever the browser's time zone.
export var CARBURANTS_OVERSEAS_ZONES = {
  971: 'America/Guadeloupe',
  972: 'America/Martinique',
  973: 'America/Cayenne',
  974: 'Indian/Reunion',
  975: 'America/Miquelon',
  976: 'Indian/Mayotte',
};
export var CARBURANTS_WEEKDAYS = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function carbStationZone(station) {
  return CARBURANTS_OVERSEAS_ZONES[String(station?.postcode || '').slice(0, 3)] || 'Europe/Paris';
}

// Day of the week (Monday = 1), minutes since midnight and date of `now` in the station's time zone.
export function carbStationTime(station, now) {
  var p = {};
  try {
    new Intl.DateTimeFormat('en-US', {
      timeZone: carbStationZone(station),
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).formatToParts(now).forEach((part) => { p[part.type] = part.value; });
  } catch (_e) {
    p = {};
  }
  if (!CARBURANTS_WEEKDAYS[p.weekday]) {
    // No time zone data: the browser's clock.
    return { day: now.getDay() === 0 ? 7 : now.getDay(), minutes: now.getHours() * 60 + now.getMinutes(), y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }
  return { day: CARBURANTS_WEEKDAYS[p.weekday], minutes: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10), y: +p.year, m: +p.month, d: +p.day };
}

// Opening status from the feed's weekly hours: { key: open|closed|always|automate, text }.
export function carbOpening(station, t, now, locale) {
  var hours = station.hours || [];
  var local = carbStationTime(station, now);
  var day = local.day;
  var minutes = local.minutes;
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
      var start = d.ranges[0][0];
      if (k === 1) return { key: 'closed', text: `${t.closed} · ${t.opens_at} ${start}` };
      var dayName = carbWeekday(new Date(Date.UTC(local.y, local.m - 1, local.d + k, 12)), locale);
      var opens = t.opens_on ? t.opens_on.replace('{d}', dayName).replace('{t}', start) : `${t.opens_at} ${dayName} ${start}`;
      return { key: 'closed', text: `${t.closed} · ${opens}` };
    }
  }
  return { key: 'closed', text: t.closed };
}

export function carbRelative(iso, locale) {
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
