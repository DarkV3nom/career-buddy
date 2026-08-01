"use client";

interface BarDatum {
  label: string;
  count: number;
}

interface ApplicationsBarChartProps {
  data: BarDatum[];
}

/**
 * Plain-div bar chart (no charting library) -- this session's Vercel
 * deployment saga (Prisma resolution breaking across multiple versions)
 * made a strong case for not adding another npm dependency just for a
 * handful of bars. Height is computed from the max value in `data`, so it
 * rescales automatically as more weeks of history come in.
 */
export function ApplicationsBarChart({ data }: ApplicationsBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="flex h-48 items-end gap-3 sm:h-56 sm:gap-4">
      {data.map((d) => {
        const heightPct = Math.max(4, Math.round((d.count / max) * 100));
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end rounded-md bg-muted/60">
              <div
                className="w-full rounded-md bg-secondary transition-all"
                style={{ height: `${heightPct}%` }}
                title={`${d.count} in ${d.label}`}
              />
            </div>
            <p className="text-sm font-semibold tabular-nums text-foreground">{d.count}</p>
            <p className="text-[11px] text-muted-foreground">{d.label}</p>
          </div>
        );
      })}
    </div>
  );
}
