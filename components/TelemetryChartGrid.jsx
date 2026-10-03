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

const AXIS = {
  stroke: "var(--viz-axis)",
  tick: { fill: "var(--viz-axis)", fontSize: 10, fontFamily: "var(--font-mono)" },
  tickLine: false,
};

function ChartTooltip({ active, payload, label, xField, xUnit, series }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink/15 bg-panel px-3 py-2 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45 m-0">
        {xField} {label}
        {xUnit}
      </p>
      <p className="font-mono text-sm text-ink m-0 mt-1">
        <span
          aria-hidden="true"
          className="inline-block h-[2px] w-3 rounded-full align-middle mr-2"
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
          <figcaption className="flex items-baseline gap-2 px-1 pb-3">
            <span
              aria-hidden="true"
              className="h-[3px] w-3 shrink-0 rounded-full"
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
