function splitRow(line) {
  const out = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (quoted) {
      if (ch === '"') {
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

export function parseCsv(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");

  if (lines.length < 2) return { columns: [], rows: [] };

  const columns = splitRow(lines[0]).map((c, i) => c || `column ${i + 1}`);

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitRow(lines[i]);

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

export function numericColumns(columns, rows) {
  const sample = rows.slice(0, 50);
  return columns.filter((col) =>
    sample.length > 0 && sample.every((r) => typeof r[col] === "number")
  );
}

const MAX_POINTS = 420;

export function thin(rows, fields) {
  if (rows.length <= MAX_POINTS) return rows;

  const keep = new Set();

  const stride = Math.ceil(rows.length / MAX_POINTS);
  for (let i = 0; i < rows.length; i += stride) keep.add(i);
  keep.add(rows.length - 1);

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

const SERIES_COLORS = [
  "var(--viz-1)",
  "var(--viz-2)",
  "var(--viz-3)",
  "var(--viz-4)",
  "var(--viz-5)",
  "var(--viz-6)",
];

export function buildTelemetry({ csv, x, charts = [] }) {
  const { columns, rows } = parseCsv(csv);
  if (rows.length === 0) return null;

  const numeric = numericColumns(columns, rows);

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
