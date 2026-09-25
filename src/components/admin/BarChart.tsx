import { formatShortDay } from "@/lib/admin/format";

type BarChartProps = {
  title: string;
  data: { date: string; value: number }[];
  /** A CSS color (var(--color-...) or a hex) — bars are a single series,
   * so per the dataviz skill's mark specs this needs no legend, just the
   * title naming what's plotted. */
  color: string;
  totalLabel: string;
};

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 120;
const PLOT_HEIGHT = 92;
const MAX_BAR_WIDTH = 24;
const CORNER_RADIUS = 4;

/** A bar's outline with only its top two corners rounded (a flat square
 * baseline) — the dataviz skill's "4px rounded data-end, square at the
 * baseline" mark spec, which a plain SVG <rect rx> can't express since
 * that rounds all four corners. */
function barPath(x: number, y: number, width: number, height: number): string {
  if (height <= 0) return "";
  const r = Math.min(CORNER_RADIUS, height, width / 2);
  return [
    `M ${x} ${y + height}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    `L ${x + width} ${y + height}`,
    "Z",
  ].join(" ");
}

/** A single-series, day-by-day bar chart — signups/day and revenue/day
 * both use this. Thin, capped bars; a hairline recessive baseline; no
 * per-bar labels (the total and the latest day's value carry the
 * numbers, per "label selectively, never a number on every point"). */
export function BarChart({ title, data, color, totalLabel }: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const spacing = VIEW_WIDTH / Math.max(data.length, 1);
  const barWidth = Math.min(MAX_BAR_WIDTH, Math.max(2, spacing - 2));
  const latest = data[data.length - 1];

  return (
    <div className="rounded-2xl bg-paper border border-mist p-4 flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone">{title}</span>
        <span className="text-xs text-stone">{totalLabel}</span>
      </div>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${title} — ${totalLabel}`}
      >
        <line
          x1={0}
          y1={PLOT_HEIGHT + 0.5}
          x2={VIEW_WIDTH}
          y2={PLOT_HEIGHT + 0.5}
          stroke="var(--color-mist)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (PLOT_HEIGHT - 8);
          const x = i * spacing + (spacing - barWidth) / 2;
          const y = PLOT_HEIGHT - barHeight;
          return <path key={d.date} d={barPath(x, y, barWidth, barHeight)} fill={color} />;
        })}
      </svg>
      <div className="flex items-center justify-between text-[11px] text-stone">
        <span>{formatShortDay(data[0]?.date ?? "")}</span>
        <span>
          {formatShortDay(latest?.date ?? "")} · {latest?.value ?? 0}
        </span>
      </div>
    </div>
  );
}
