import { FillBlankCard } from "@/components/FillBlankCard";
import { isFillBlankLesson, type LessonDoc } from "@/types/firestore";

const TRACK_LABEL: Record<LessonDoc["track"], string> = {
  scripture: "Scripture",
  prayer: "Prayer",
  devotional: "Devotional",
};

type LessonCardProps = {
  lesson: LessonDoc;
  isDone: boolean;
  isLocked: boolean;
  isPending: boolean;
  onComplete: () => Promise<void>;
};

/** A single lesson's card — reading summary + Complete button, or the
 * fill-in-the-blank word-bank flow. Shared between the revealed and
 * locked-preview states in PathBookSections. */
export function LessonCard({ lesson, isDone, isLocked, isPending, onComplete }: LessonCardProps) {
  const fillBlank = isFillBlankLesson(lesson);

  return (
    <div className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
        {TRACK_LABEL[lesson.track]}
      </span>
      <h3 className="text-base font-semibold text-ink">{lesson.title}</h3>
      {lesson.scriptureReference && (
        <span className="text-sm text-stone">{lesson.scriptureReference}</span>
      )}

      {fillBlank ? (
        // FillBlankCard owns its own check/complete flow (word bank,
        // correct/incorrect feedback) — it calls onComplete itself once the
        // answer is right, rather than the plain "Complete" button below,
        // which doesn't apply here.
        <FillBlankCard
          lesson={lesson}
          isDone={isDone}
          isLocked={isLocked}
          isPending={isPending}
          onComplete={onComplete}
        />
      ) : (
        <p className="text-sm text-ink/80 leading-relaxed">{lesson.summary}</p>
      )}

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-stone">
          {lesson.estimatedMinutes} min · +{lesson.xpReward} XP
        </span>
        {!fillBlank && (
          <button
            type="button"
            disabled={isDone || isLocked || isPending}
            onClick={() => void onComplete()}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              isDone
                ? "bg-sage-50 text-sage-700"
                : isLocked
                  ? "bg-mist text-stone"
                  : "bg-clay-600 text-paper hover:bg-clay-700 disabled:opacity-70"
            }`}
          >
            {isDone ? "Completed" : isLocked ? "Locked" : isPending ? "Saving…" : "Complete"}
          </button>
        )}
      </div>
    </div>
  );
}
