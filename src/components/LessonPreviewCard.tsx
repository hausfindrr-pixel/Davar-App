import type { LessonDoc } from "@/types/firestore";

const TRACK_LABEL: Record<LessonDoc["track"], string> = {
  scripture: "Scripture",
  prayer: "Prayer",
  devotional: "Devotional",
};

export function LessonPreviewCard({ lesson }: { lesson: LessonDoc | null }) {
  if (!lesson) {
    return (
      <section className="w-full max-w-sm rounded-3xl bg-paper/80 border border-mist p-6">
        <p className="text-sm text-stone">
          No lessons yet — check back soon for today&apos;s reading.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-sm rounded-3xl bg-paper/80 border border-mist p-6 flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
        Today · {TRACK_LABEL[lesson.track]}
      </span>
      <h3 className="text-lg font-semibold text-ink">{lesson.title}</h3>
      {lesson.scriptureReference && (
        <span className="text-sm text-stone">{lesson.scriptureReference}</span>
      )}
      <p className="text-sm text-ink/80 leading-relaxed">{lesson.summary}</p>
      <span className="mt-1 text-xs text-stone">
        {lesson.estimatedMinutes} min · +{lesson.xpReward} XP
      </span>
    </section>
  );
}
