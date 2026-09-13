"use client";

import { useState } from "react";
import { FREE_DAILY_LESSON_LIMIT, type LessonDoc } from "@/types/firestore";

type LessonsSectionProps = {
  lessons: LessonDoc[];
  completedLessonIds: string[];
  isPremium: boolean;
  onComplete: (lesson: LessonDoc) => Promise<void>;
};

const TRACK_LABEL: Record<LessonDoc["track"], string> = {
  scripture: "Scripture",
  prayer: "Prayer",
  devotional: "Devotional",
};

export function LessonsSection({
  lessons,
  completedLessonIds,
  isPremium,
  onComplete,
}: LessonsSectionProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const completedCount = completedLessonIds.length;
  const atLimit = !isPremium && completedCount >= FREE_DAILY_LESSON_LIMIT;

  async function handleComplete(lesson: LessonDoc) {
    setPendingId(lesson.id);
    try {
      await onComplete(lesson);
    } finally {
      setPendingId(null);
    }
  }

  if (lessons.length === 0) {
    return (
      <section className="w-full max-w-sm rounded-3xl bg-paper/80 border border-mist p-6">
        <p className="text-sm text-stone">
          No lessons yet — check back soon.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-sm flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-ink">Today&apos;s lessons</h2>
        {!isPremium && (
          <span className="text-xs text-stone">
            {Math.min(completedCount, FREE_DAILY_LESSON_LIMIT)} of{" "}
            {FREE_DAILY_LESSON_LIMIT} free
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {lessons.map((lesson) => {
          const isDone = completedLessonIds.includes(lesson.id);
          const isLocked = atLimit && !isDone;
          const isPending = pendingId === lesson.id;

          return (
            <div
              key={lesson.id}
              className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
                {TRACK_LABEL[lesson.track]}
              </span>
              <h3 className="text-base font-semibold text-ink">{lesson.title}</h3>
              {lesson.scriptureReference && (
                <span className="text-sm text-stone">{lesson.scriptureReference}</span>
              )}
              <p className="text-sm text-ink/80 leading-relaxed">{lesson.summary}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-stone">
                  {lesson.estimatedMinutes} min · +{lesson.xpReward} XP
                </span>
                <button
                  type="button"
                  disabled={isDone || isLocked || isPending}
                  onClick={() => void handleComplete(lesson)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                    isDone
                      ? "bg-sage-50 text-sage-700"
                      : isLocked
                        ? "bg-mist text-stone"
                        : "bg-clay-600 text-paper hover:bg-clay-700 disabled:opacity-70"
                  }`}
                >
                  {isDone
                    ? "Completed"
                    : isLocked
                      ? "Locked"
                      : isPending
                        ? "Saving…"
                        : "Complete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {atLimit && (
        <div className="rounded-2xl bg-clay-50 border border-clay-200 p-4 text-center">
          <p className="text-sm text-ink">
            You&apos;ve used all {FREE_DAILY_LESSON_LIMIT} free lessons today.
          </p>
          <p className="text-xs text-stone mt-1">
            Come back tomorrow, or upgrade to Premium for unlimited daily lessons.
          </p>
        </div>
      )}
    </section>
  );
}
