"use client";

import dynamic from "next/dynamic";

/* Keeps recharts out of every project page that has no flight data on it.
 *
 * The import below is the only reference to it in the tree, so the library
 * lands in a chunk of its own and is fetched when a chart is actually about to
 * be drawn. ssr:false because ResponsiveContainer sizes itself by measuring
 * the box it is in, which on the server is nothing — it renders an empty div
 * during a server pass either way.
 *
 * The section around this already ships the same numbers as a table in the
 * server HTML, so nothing is lost while the chunk is in flight or if it never
 * arrives at all. */
const ChartGrid = dynamic(() => import("./TelemetryChartGrid"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
      <div className="h-72 rounded-2xl glass animate-pulse" />
      <div className="h-72 rounded-2xl glass animate-pulse" />
    </div>
  ),
});

export default function TelemetryCharts(props) {
  return <ChartGrid {...props} />;
}
