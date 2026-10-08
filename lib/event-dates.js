// Turns the free-text date/time labels editors type ("10–11 April 2026",
// "10:00 AM - 5:00 PM") into real dates. Returns null when a label can't be
// read, so the site simply hides "Add to calendar" instead of guessing.
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const IST = "+05:30";

const pad = (n) => String(n).padStart(2, "0");

function parseDays(label) {
  const text = String(label ?? "").trim().toLowerCase().replace(/[–—]/g, "-").replace(/,/g, " ").replace(/\s+/g, " ");
  const m = text.match(/^(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s+([a-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS.findIndex((name) => name.startsWith(m[3].slice(0, 3)) && m[3].length >= 3);
  if (month < 0) return null;
  const year = Number(m[4]);
  const first = Number(m[1]);
  const last = m[2] ? Number(m[2]) : first;
  if (first < 1 || last > 31 || last < first) return null;
  return { year, month: month + 1, first, last };
}

function parseClock(text) {
  const m = String(text).trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2] ?? 0);
  if (m[3] === "pm" && hour < 12) hour += 12;
  if (m[3] === "am" && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function parseTimes(label) {
  const parts = String(label ?? "").replace(/[–—]/g, "-").split(/\s+-\s+|\s+to\s+/i);
  if (parts.length !== 2) return null;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  return start && end ? { start, end } : null;
}

const at = (y, mo, d, h, mi) => new Date(`${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:00${IST}`);

export function eventSchedule(event) {
  const days = parseDays(event?.date);
  if (!days) return null;
  const times = parseTimes(event?.time);
  const { year, month, first, last } = days;
  if (times) {
    return {
      allDay: false,
      start: at(year, month, first, times.start.hour, times.start.minute),
      end: at(year, month, last, times.end.hour, times.end.minute),
    };
  }
  return { allDay: true, start: at(year, month, first, 0, 0), end: at(year, month, last + 1, 0, 0), days };
}

const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (text) => String(text ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function eventIcs(event, siteUrl, now = new Date()) {
  const schedule = eventSchedule(event);
  if (!schedule) return null;
  const when = schedule.allDay
    ? [
        `DTSTART;VALUE=DATE:${schedule.days.year}${pad(schedule.days.month)}${pad(schedule.days.first)}`,
        `DTEND;VALUE=DATE:${stamp(schedule.end).slice(0, 8)}`,
      ]
    : [`DTSTART:${stamp(schedule.start)}`, `DTEND:${stamp(schedule.end)}`];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Stratosphere JU//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.slug}@stratosphere-ju`,
    `DTSTAMP:${stamp(now)}`,
    ...when,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(`${event.body ?? ""}\n\n${siteUrl}/events/${event.slug}`)}`,
    ...(event.location ? [`LOCATION:${escape(event.location)}`] : []),
    `URL:${siteUrl}/events/${event.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
