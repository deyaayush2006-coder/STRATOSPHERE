/* Flight data, from a pasted CSV to something a chart can draw.
 *
 * Runs on the server, inside the project page's render. That is deliberate: a
 * CanSat descent logged at 10Hz is thousands of rows, and none of the parsing
 * or the thinning below needs to happen in a visitor's browser — what crosses
 * the wire is the few hundred points that actually get drawn.
 *
 * Nothing here throws. The input is a textarea in the dashboard, so malformed
 * is the normal case, not the exceptional one: a bad column name, a trailing
 * blank line, a header row somebody pasted twice. Every one of those comes
 * back as "no series" and the section hides itself.
 */

/* Splits one CSV line, respecting quotes.
   A telemetry export usually has none — but a comment column ("apogee, chute
   out") turns a naive split on commas into a row with the wrong number of
   fields and silently shifts every value after it. */
function splitRow(line) {
  const out = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (quoted) {
      if (ch === '"') {
        // "" inside a quoted field is one literal quote
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(field.trim());
      field = "";
    } else {
      field += ch;
    }
  }

  out.push(field.trim());
  return out;
}

const isNumeric = (v) => v !== "" && Number.isFinite(Number(v));

/* CSV text -> { columns, rows }.
   Columns are the header names in order; rows are objects keyed by them, with
   anything that parses as a number stored as one. */
export function parseCsv(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");

  if (lines.length < 2) return { columns: [], rows: [] };

  const columns = splitRow(lines[0]).map((c, i) => c || `column ${i + 1}`);

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitRow(lines[i]);

    // A repeated header, which is what pasting two exports together produces.
    if (cells[0] === columns[0]) continue;

    const row = {};
    let anyValue = false;
    for (let c = 0; c < columns.length; c += 1) {
      const raw = cells[c] ?? "";
      row[columns[c]] = isNumeric(raw) ? Number(raw) : raw;
      if (raw !== "") anyValue = true;
    }
    if (anyValue) rows.push(row);
  }

  return { columns, rows };
}

/* Which columns hold numbers worth plotting.
   Judged on the data rather than on the header, and on a sample rather than on
   all of it — a column that is numeric for its first fifty rows is numeric. */
export function numericColumns(columns, rows) {
  const sample = rows.slice(0, 50);
  return columns.filter((col) =>
    sample.length > 0 && sample.every((r) => typeof r[col] === "number")
  );
}

const MAX_POINTS = 420;

/* Thins a long flight down to something a browser can draw smoothly.
 *
 * Plain decimation — every nth row — is what makes this cheap, and on its own
 * it is also what loses the apogee: the single highest sample has no special
 * claim to be the one that survives, and on a 4000-row descent it usually is
 * not. So the extremes of every plotted series are collected first and forced
 * back into the result. The curve is an approximation; the numbers you would
 * actually quote off it are not.
 */
export function thin(rows, fields) {
  if (rows.length <= MAX_POINTS) return rows;

  const keep = new Set();

  const stride = Math.ceil(rows.length / MAX_POINTS);
  for (let i = 0; i < rows.length; i += stride) keep.add(i);
  keep.add(rows.length - 1); // the last sample is the end of the flight

  for (const field of fields) {
    let lo = -1;
    let hi = -1;
    for (let i = 0; i < rows.length; i += 1) {
      const v = rows[i][field];
      if (typeof v !== "number") continue;
      if (lo < 0 || v < rows[lo][field]) lo = i;
      if (hi < 0 || v > rows[hi][field]) hi = i;
    }
    if (lo >= 0) keep.add(lo);
    if (hi >= 0) keep.add(hi);
  }

  return [...keep].sort((a, b) => a - b).map((i) => rows[i]);
}

/* The series slots from globals.css, handed out in order and never cycled.
   Left as var() rather than resolved: SVG reads custom properties, so a chart
   follows the theme toggle without anything re-rendering, and the light steps
   are a separate set chosen for a pale ground rather than the dark ones
   lightened. */
const SERIES_COLORS = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
  "var(--viz-5)",
  "var(--viz-6)",
];

/* Everything the dashboard needs, from what the committee typed.
 *
 * `charts` is the committee's own list — which columns to plot, what to call
 * them, what unit they are in. Left empty, every numeric column that is not
 * the x axis gets a chart of its own, so pasting a raw export and saving is
 * enough to see something.
 */
export function buildTelemetry({ csv, x, charts = [] }) {
  const { columns, rows } = parseCsv(csv);
  if (rows.length === 0) return null;

  const numeric = numericColumns(columns, rows);

  /* The x axis: what was asked for, else the first column that looks like a
     clock, else the first numeric column, else the first column there is. */
  const xField =
    (x && columns.includes(x) && x) ||
    columns.find((c) => /^(time|t|sec|seconds|ms|timestamp|elapsed)$/i.test(c)) ||
    numeric[0] ||
    columns[0];

  const requested = charts
    .map((c) => ({
      field: c.field,
      label: c.label || c.field,
      unit: c.unit || "",
    }))
    .filter((c) => c.field && columns.includes(c.field) && c.field !== xField);

  const series = (
    requested.length > 0
      ? requested
      : numeric.filter((c) => c !== xField).map((c) => ({ field: c, label: c, unit: "" }))
  ).map((c, i) => ({ ...c, color: SERIES_COLORS[i % SERIES_COLORS.length] }));

  if (series.length === 0) return null;

  return {
    xField,
    // Peak, floor and final value per series, measured on the full log rather
    // than on the thinned copy below — these are the figures the write-up
    // quotes, so they are not allowed to be an artefact of the decimation.
    series: series.map((s) => ({ ...s, ...summarise(rows, s.field) })),
    rows: thin(rows, series.map((s) => s.field)),
    sampleCount: rows.length,
  };
}

function summarise(rows, field) {
  let min = null;
  let max = null;
  let last = null;

  for (const row of rows) {
    const v = row[field];
    if (typeof v !== "number") continue;
    if (min === null || v < min) min = v;
    if (max === null || v > max) max = v;
    last = v;
  }

  return { min, max, last };
}
