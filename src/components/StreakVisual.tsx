import { PlantIcon } from "@/components/PlantIcon";
import { plantStage, streakMessage } from "@/lib/streak-message";
import { XP_PER_LEVEL, xpIntoCurrentLevel, xpToNextLevel } from "@/lib/xp";

type StreakVisualProps = {
  currentCount: number;
  longestCount: number;
  level: number;
  xp: number;
  checkedInToday: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
};

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function StreakVisual({
  currentCount,
  longestCount,
  level,
  xp,
  checkedInToday,
  checkingIn,
  onCheckIn,
}: StreakVisualProps) {
  const xpProgress = xpIntoCurrentLevel(xp) / XP_PER_LEVEL;
  const dashOffset = RING_CIRCUMFERENCE * (1 - xpProgress);

  return (
    <section className="w-full max-w-sm rounded-3xl bg-paper/80 border border-mist p-8 flex flex-col items-center gap-5 shadow-[0_1px_2px_rgba(58,51,44,0.04),0_8px_24px_rgba(58,51,44,0.06)]">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="6"
            className="stroke-mist"
          />
          {xpProgress > 0 && (
            <circle
              cx="60"
              cy="60"
              r={RING_RADIUS}
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="stroke-clay-400 transition-[stroke-dashoffset] duration-700 ease-out"
            />
          )}
        </svg>
        <div className="absolute inset-5 flex items-center justify-center">
          <PlantIcon stage={plantStage(currentCount)} className="h-full w-full text-sage-600" />
        </div>
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

      <div className="w-full flex items-center justify-between text-xs text-stone">
        <span>Level {level}</span>
        <span>{xpToNextLevel(xp)} XP to next level</span>
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
