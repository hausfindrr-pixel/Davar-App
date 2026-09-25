type StatTileProps = {
  label: string;
  value: string;
  sublabel?: string;
};

/** A single summary number — label/value/optional sublabel, per the
 * dataviz skill's stat-tile contract. No delta/sparkline: the trend
 * charts below already cover "how did we get here" for the metrics that
 * have one. */
export function StatTile({ label, value, sublabel }: StatTileProps) {
  return (
    <div className="rounded-2xl bg-paper border border-mist p-4 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-stone">{label}</span>
      <span className="text-2xl font-bold text-ink">{value}</span>
      {sublabel ? <span className="text-xs text-stone">{sublabel}</span> : null}
    </div>
  );
}
