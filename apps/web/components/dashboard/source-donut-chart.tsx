"use client";

interface DonutDatum {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface SourceDonutChartProps {
  data: DonutDatum[];
  total: number;
}

/**
 * CSS conic-gradient donut -- no SVG arc math, no charting library. Slices
 * are ordered by `data` and computed as cumulative percentages of `total`.
 * Zero-count entries still get a legend row (greyed count) so the legend
 * doesn't silently drop a source the user hasn't tried yet.
 */
export function SourceDonutChart({ data, total }: SourceDonutChartProps) {
  let cursor = 0;
  const stops: string[] = [];
  for (const d of data) {
    if (d.count === 0) continue;
    const start = (cursor / Math.max(1, total)) * 360;
    cursor += d.count;
    const end = (cursor / Math.max(1, total)) * 360;
    stops.push(`${d.color} ${start}deg ${end}deg`);
  }
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "conic-gradient(hsl(var(--muted)) 0deg 360deg)";

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative h-32 w-32 shrink-0 rounded-full sm:h-36 sm:w-36"
        style={{ background: gradient }}
      >
        <div className="absolute inset-[14%] flex flex-col items-center justify-center rounded-full bg-card text-center">
          <span className="text-[10px] text-muted-foreground">Total</span>
          <span className="text-xl font-semibold tabular-nums text-foreground">{total}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-foreground">{d.label}</span>
            <span className="text-muted-foreground">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
