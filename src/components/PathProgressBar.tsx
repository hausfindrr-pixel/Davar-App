import { currentStage } from "@/lib/stages";

type PathProgressBarProps = {
  completed: number;
  total: number;
};

/** The Path's overall journey progress — how many lessons completed out
 * of the whole library, plus a named stage (Scholar, Rabbi, Sage, Elder,
 * Shepherd, Faithful Witness) that advances as that share grows. Separate
 * from a single lesson's own step-by-step progress bar (LessonFlow.tsx),
 * which tracks position within one lesson, not the library. */
export function PathProgressBar({ completed, total }: PathProgressBarProps) {
  if (total === 0) return null;

  const { stage, next, lessonsToNext } = currentStage(completed, total);
  const percent = Math.round((completed / total) * 100);

  return (
    <section className="w-full rounded-2xl bg-paper border border-mist p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone">Your Journey</span>
        <span className="rounded-full bg-sage-50 text-sage-700 text-[11px] font-semibold px-2.5 py-0.5">
          {stage.name}
        </span>
      </div>
      <div className="h-2 rounded-full bg-mist overflow-hidden">
        <div
          className="h-full rounded-full bg-sage-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-stone">
        {completed} of {total} lessons
        {next ? ` · ${lessonsToNext} more to ${next.name}` : " · the whole journey, complete"}
      </span>
    </section>
  );
}
