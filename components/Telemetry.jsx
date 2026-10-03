import TelemetryCharts from "./TelemetryCharts";
import { buildTelemetry } from "@/lib/telemetry";

const figure = (v) =>
  v === null || v === undefined
    ? "—"
    : Number.isInteger(v)
      ? String(v)
      : v.toFixed(Math.abs(v) >= 100 ? 0 : 2);

function Readout({ label, value, unit }) {
  return (
    <div>
      <dt className="font-sans text-xs font-medium tracking-wide text-ink/45">{label}</dt>
      <dd className="font-mono text-base text-ink m-0 mt-1 tabular-nums">
        {value}
        {unit && <span className="text-ink/45 text-xs ml-1">{unit}</span>}
      </dd>
    </div>
  );
}

export default function Telemetry({ telemetry, title, blurb }) {
  const data = buildTelemetry(telemetry ?? {});

  if (!data) return null;

  const { xField, series, rows, sampleCount } = data;

  return (
    <section className="mt-12">
      <header className="mb-6">
        <span className="font-sans text-xs font-medium tracking-wide text-aurora2">Flight data</span>
        <h2 className="text-2xl md:text-3xl text-ink font-semibold mt-3 tracking-[-0.02em]">
          {title || "Telemetry"}
        </h2>
        {blurb && <p className="text-ink/60 mt-3 max-w-2xl leading-relaxed">{blurb}</p>}
        <p className="font-mono text-[11px] text-ink/35 mt-3">
          {sampleCount.toLocaleString("en-IN")} samples · {series.length}{" "}
          {series.length === 1 ? "channel" : "channels"} · against {xField}
        </p>
      </header>

      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-8 pb-8 border-b border-ink/10">
        {series.map((s) => (
          <div key={s.field} className="flex flex-col gap-3">
            <p className="flex items-center gap-2 m-0">
              <span
                aria-hidden="true"
                className="h-[3px] w-3 shrink-0 rounded-full"
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
