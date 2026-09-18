import { FillBlankCard } from "@/components/FillBlankCard";
import type { LessonDoc } from "@/types/firestore";

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

/** A single lesson's card — the event's narrative summary, followed by its
 * embedded verse activity (FillBlankCard) built from the passage's own
 * verses. Completing a lesson means solving that activity, not a separate
 * "Complete" tap — the two are one piece of content, not a summary plus an
 * optional quiz. Reused as the detail view opened by tapping an event
 * card in PathEventList. */
export function LessonCard({ lesson, isDone, isLocked, isPending, onComplete }: LessonCardProps) {
  return (
    <div className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
        {TRACK_LABEL[lesson.track]}
      </span>
      <h3 className="text-base font-semibold text-ink">{lesson.title}</h3>
      {lesson.scriptureReference && (
        <span className="text-sm text-stone">{lesson.scriptureReference}</span>
      )}

      <p className="text-sm text-ink/80 leading-relaxed">{lesson.summary}</p>

      <div className="mt-1 pt-3 border-t border-mist flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone">
          Verse challenge
        </span>
        <FillBlankCard
          activity={lesson.verseActivity}
          track={lesson.track}
          isDone={isDone}
          isLocked={isLocked}
          isPending={isPending}
          onComplete={onComplete}
        />
      </div>

      <span className="text-xs text-stone mt-1">
        {lesson.estimatedMinutes} min · +{lesson.xpReward} XP
      </span>
    </div>
  );
}
