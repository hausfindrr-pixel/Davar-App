import { PlantIcon } from "@/components/PlantIcon";
import { plantStage, streakMessage } from "@/lib/streak-message";

type StreakVisualProps = {
  currentCount: number;
  longestCount: number;
  checkedInToday: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
};

export function StreakVisual({
  currentCount,
  longestCount,
  checkedInToday,
  checkingIn,
  onCheckIn,
}: StreakVisualProps) {
  return (
    <section className="w-full max-w-sm rounded-3xl bg-paper/80 border border-mist p-8 flex flex-col items-center gap-5 shadow-[0_1px_2px_rgba(58,51,44,0.04),0_8px_24px_rgba(58,51,44,0.06)]">
      <div className="h-36 w-36 rounded-full bg-sage-50 flex items-center justify-center">
        <PlantIcon stage={plantStage(currentCount)} className="h-20 w-20 text-sage-600" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-4xl font-semibold tabular-nums text-ink">
          {currentCount}
        </span>
        <span className="text-sm text-stone">
          {currentCount === 1 ? "day streak" : "day streak"} · longest {longestCount}
        </span>
        <p className="mt-1 text-sm text-ink/80">{streakMessage(currentCount)}</p>
      </div>

      <button
        type="button"
        onClick={onCheckIn}
        disabled={checkedInToday || checkingIn}
        className={`w-full rounded-full py-2.5 text-center text-sm font-medium transition-colors disabled:cursor-not-allowed ${
          checkedInToday
            ? "bg-sage-50 text-sage-700"
            : "bg-clay-600 text-paper hover:bg-clay-700 disabled:opacity-70"
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
