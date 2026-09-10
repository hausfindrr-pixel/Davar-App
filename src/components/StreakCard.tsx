type StreakCardProps = {
  currentCount: number;
  longestCount: number;
  checkedInToday: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
};

export function StreakCard({
  currentCount,
  longestCount,
  checkedInToday,
  checkingIn,
  onCheckIn,
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
      <button
        type="button"
        onClick={onCheckIn}
        disabled={checkedInToday || checkingIn}
        className={`mt-4 w-full rounded-full py-2 text-center text-sm font-medium disabled:cursor-not-allowed ${
          checkedInToday
            ? "bg-green-600/10 text-green-700 dark:text-green-400"
            : "bg-indigo-600 text-white disabled:opacity-70"
        }`}
      >
        {checkedInToday
          ? "Checked in today"
          : checkingIn
            ? "Checking in…"
            : "Check in today"}
      </button>
    </section>
  );
}
