/** "1,284" / "12.9K" / "1.2M" — the admin dashboard's stat-tile values,
 * kept auto-compact so a growing user base doesn't blow out the tile
 * layout the way a plain toLocaleString() eventually would. */
export function formatCompactNumber(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** "$1,284" / "$12.9K" — same compact shape as formatCompactNumber, with a
 * currency prefix, for revenue/cost figures. */
export function formatCompactUsd(n: number): string {
  if (Math.abs(n) < 1000) return `$${n.toFixed(2)}`;
  return `$${formatCompactNumber(n)}`;
}

/** "$1,284.00" — full precision, for table rows (never the tile values,
 * which stay compact). */
export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/** "12%" — a ratio (0..1) as a whole-percent string; "—" for null (no
 * denominator, e.g. a lesson nobody has started yet). */
export function formatPercent(ratio: number | null): string {
  if (ratio === null) return "—";
  return `${Math.round(ratio * 100)}%`;
}

/** "MM/DD" from a "YYYY-MM-DD" day key — the compact axis label the
 * dashboard's bar charts use. */
export function formatShortDay(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  return `${month}/${day}`;
}
