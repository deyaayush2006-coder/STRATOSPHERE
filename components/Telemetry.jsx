import TelemetryCharts from "./TelemetryCharts";
import { buildTelemetry } from "@/lib/telemetry";

/* The flight, as data.
 *
 * A server component: the CSV is parsed, thinned and summarised here, so what
 * reaches the browser is a few hundred points and a set of finished figures
 * rather than a raw log and a parser to run over it.
 *
 * The readouts and the table are in the server HTML, always. The charts are
 * the layer on top — which is the right way round for three separate reasons
 * that happen to want the same thing: the figures stay readable in the pale
 * theme where some series colours fall under 3:1 against the surface, they are
 * there for anyone reading this without the chart chunk, and a number somebody
 * wants to quote should be selectable text rather than a point on a line.
 */

/* Enough precision to be worth reading, not so much that a sensor's noise
   floor ends up on the page. */
const figure = (v) =>
  v === null || v === undefined
    ? "—"
    : Number.isInteger(v)
      ? String(v)
      : v.toFixed(Math.abs(v) >= 100 ? 0 : 2);

function Readout({ label, value, unit }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/35">{label}</dt>
      <dd className="font-mono text-base text-ink m-0 mt-1 tabular-nums">
        {value}
        {unit && <span className="text-ink/45 text-xs ml-1">{unit}</span>}
      </dd>
    </div>
  );
}

export default function Telemetry({ telemetry, title, blurb }) {
  const data = buildTelemetry(telemetry ?? {});

  // Nothing pasted, nothing numeric in it, or every column is the x axis.
  if (!data) return null;

  const { xField, series, rows, sampleCount } = data;

  return (
    <section className="mt-12">
      <header className="mb-6">
        <span className="mono-label">Flight data</span>
        <h2 className="text-2xl md:text-3xl text-ink font-semibold mt-3 tracking-[-0.02em]">
          {title || "Telemetry"}
        </h2>
        {blurb && <p className="text-ink/60 mt-3 max-w-2xl leading-relaxed">{blurb}</p>}
        <p className="font-mono text-[11px] text-ink/35 mt-3">
          {sampleCount.toLocaleString("en-IN")} samples · {series.length}{" "}
          {series.length === 1 ? "channel" : "channels"} · against {xField}
        </p>
      </header>

      {/* Peak, floor and final, per channel. The headline numbers off the
          flight, before anyone has to read a curve to find them. */}
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8 pb-8 border-b border-ink/10">
        {series.map((s) => (
          <div key={s.field} className="flex flex-col gap-3">
            <p className="flex items-center gap-2 m-0">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-[13px] font-semibold text-ink truncate">{s.label}</span>
            </p>
            <Readout label="Peak" value={figure(s.max)} unit={s.unit} />
            <Readout label="Min" value={figure(s.min)} unit={s.unit} />
            <Readout label="Final" value={figure(s.last)} unit={s.unit} />
          </div>
        ))}
      </dl>

      <TelemetryCharts xField={xField} series={series} rows={rows} />

      {/* The same data as text. Closed by default because it is long, open to
          anyone who wants the numbers rather than the shape — and present in
          the HTML either way, which is what makes the charts optional. */}
      <details className="mt-6 glass rounded-2xl overflow-hidden group">
        <summary className="cursor-pointer select-none px-5 py-4 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/50 hover:text-aurora2 transition-colors">
          Show the data table
        </summary>

        <div className="max-h-96 overflow-auto border-t border-ink/10">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-panel">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium text-ink/45 whitespace-nowrap">
                  {xField}
                </th>
                {series.map((s) => (
                  <th
                    key={s.field}
                    scope="col"
                    className="px-4 py-2.5 font-medium text-ink/45 whitespace-nowrap"
                  >
                    {s.label}
                    {s.unit ? ` (${s.unit})` : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-ink/[0.06]">
                  <td className="px-4 py-1.5 text-ink/45 tabular-nums">{row[xField]}</td>
                  {series.map((s) => (
                    <td key={s.field} className="px-4 py-1.5 text-ink/75 tabular-nums">
                      {row[s.field]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
