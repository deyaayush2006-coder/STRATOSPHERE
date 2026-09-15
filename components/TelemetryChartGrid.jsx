"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/* One chart per measurement, stacked.
 *
 * Not one chart with every series on it, and specifically not one chart with
 * two y-axes. Altitude is in metres, pressure in hectopascals, temperature in
 * degrees — put them on a shared scale and the temperature trace is a flat
 * line along the bottom; give them an axis each and the crossing point where
 * the two lines meet is an artefact of the scales, not a fact about the
 * flight. Separate panels over a shared x axis compare honestly.
 */

const AXIS = {
  stroke: "var(--viz-axis)",
  tick: { fill: "var(--viz-axis)", fontSize: 10, fontFamily: "var(--font-mono)" },
  tickLine: false,
};

/* Recharts' default tooltip is a white box with black text, which is wrong in
   both themes here. This one is the site's panel, and it names the series and
   its unit rather than repeating the raw column header. */
function ChartTooltip({ active, payload, label, xField, xUnit, series }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink/15 bg-panel px-3 py-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45 m-0">
        {xField} {label}
        {xUnit}
      </p>
      <p className="font-mono text-sm text-ink m-0 mt-1">
        {/* The swatch carries identity; the number stays in ink, never in the
            series colour — a coloured figure on a pale surface is the one that
            fails to be readable. */}
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 rounded-full align-middle mr-2"
          style={{ background: series.color }}
        />
        {payload[0].value}
        {series.unit ? ` ${series.unit}` : ""}
      </p>
    </div>
  );
}

export default function TelemetryChartGrid({ xField, xUnit = "", series, rows }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {series.map((s) => (
        <figure key={s.field} className="glass rounded-2xl p-4 pb-2 m-0">
          {/* The title names the one series in the panel, which is why there is
              no legend box: a legend for a single line repeats its own title.
              It is also the visible label the pale theme needs, where some of
              these hues fall under 3:1 against the surface. */}
          <figcaption className="flex items-baseline gap-2 px-1 pb-3">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-sm font-semibold text-ink tracking-[-0.01em]">{s.label}</span>
            {s.unit && (
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/40">
                {s.unit}
              </span>
            )}
          </figcaption>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 4, right: 12, bottom: 4, left: -8 }}>
                {/* Horizontal rules only, and faint. Vertical ones would fight
                    the crosshair, which is the line that is actually doing a
                    job here. */}
                <CartesianGrid stroke="var(--viz-grid)" vertical={false} />

                <XAxis
                  dataKey={xField}
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  {...AXIS}
                  minTickGap={28}
                />
                <YAxis {...AXIS} width={52} domain={["auto", "auto"]} />

                <Tooltip
                  cursor={{ stroke: "var(--viz-axis)", strokeWidth: 1, strokeDasharray: "3 3" }}
                  content={<ChartTooltip xField={xField} xUnit={xUnit} series={s} />}
                />

                <Line
                  type="monotone"
                  dataKey={s.field}
                  stroke={s.color}
                  strokeWidth={2}
                  /* No dot per sample — four hundred of them is a caterpillar,
                     not a line. The hover dot is the one that has to be big
                     enough to aim at. */
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--color-panel)" }}
                  isAnimationActive={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
      ))}
    </div>
  );
}
