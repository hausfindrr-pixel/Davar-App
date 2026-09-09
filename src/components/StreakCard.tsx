type StreakCardProps = {
  currentCount: number;
  longestCount: number;
  checkedInToday: boolean;
};

export function StreakCard({
  currentCount,
  longestCount,
  checkedInToday,
}: StreakCardProps) {
  return (
    <section className="w-full max-w-sm rounded-2xl border border-black/10 dark:border-white/10 p-6 flex flex-col items-center gap-2">
      <span className="text-sm uppercase tracking-wide opacity-60">
        Current streak
      </span>
      <span className="text-5xl font-bold tabular-nums">{currentCount}</span>
      <span className="text-sm opacity-60">
        {currentCount === 1 ? "day" : "days"} · longest {longestCount}
      </span>
      <div
        className={`mt-4 w-full rounded-full py-2 text-center text-sm font-medium ${
          checkedInToday
            ? "bg-green-600/10 text-green-700 dark:text-green-400"
            : "bg-indigo-600 text-white"
        }`}
      >
        {checkedInToday ? "Checked in today" : "Check in today"}
      </div>
    </section>
  );
}
