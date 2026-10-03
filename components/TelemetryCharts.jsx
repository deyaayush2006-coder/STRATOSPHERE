"use client";

import dynamic from "next/dynamic";

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
