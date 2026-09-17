"use client";

import { useState } from "react";
import { LessonCard } from "@/components/LessonCard";
import { blurredPreviewClass, UnlockCard } from "@/components/PremiumGate";
import { BIBLE_BOOKS } from "@/lib/bible";
import { visibleLessonsForFreeTier } from "@/lib/lessons";
import type { PlanId } from "@/lib/plisio/plans";
import { FREE_DAILY_LESSON_LIMIT, type LessonDoc } from "@/types/firestore";

type PathBookSectionsProps = {
  lessons: LessonDoc[];
  /** Days since signup — drives how much of the free-tier reveal has
   * unlocked so far. Ignored for premium, which always sees everything. */
  dayIndex: number;
  completedLessonIds: string[];
  isPremium: boolean;
  /** Hide the "upgrade to unlock more" nag — e.g. right after checkout, while the upgrade is still confirming. */
  suppressUpgradeNag?: boolean;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
  getIdToken: () => Promise<string>;
};

/** The Path's lesson library, grouped into book sections (Genesis, John,
 * Philippians, ...) in canonical Bible order — same single-open-accordion
 * pattern as ArmoryTab. Premium sees every book fully, in order. Free tier
 * sees an assorted, round-robin-across-books reveal (visibleLessonsForFreeTier);
 * opening a book that has lessons beyond that reveal shows them blurred with
 * an UnlockCard, the same paywall pattern used in the Armory and Peter's
 * Watch. */
export function PathBookSections({
  lessons,
  dayIndex,
  completedLessonIds,
  isPremium,
  suppressUpgradeNag = false,
  onComplete,
  onUpgrade,
  getIdToken,
}: PathBookSectionsProps) {
  const [openBook, setOpenBook] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<PlanId | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const completedCount = completedLessonIds.length;
  const atLimit = !isPremium && completedCount >= FREE_DAILY_LESSON_LIMIT;

  const revealedIds = isPremium
    ? null
    : new Set(visibleLessonsForFreeTier(lessons, dayIndex).map((lesson) => lesson.id));

  const byBook = new Map<string, LessonDoc[]>();
  for (const lesson of lessons) {
    const list = byBook.get(lesson.lessonBook) ?? [];
    list.push(lesson);
    byBook.set(lesson.lessonBook, list);
  }
  for (const list of byBook.values()) {
    list.sort((a, b) => a.order - b.order);
  }
  const bookNames = BIBLE_BOOKS.map((book) => book.name).filter((name) => byBook.has(name));

  async function handleComplete(lesson: LessonDoc) {
    setPendingId(lesson.id);
    try {
      await onComplete(lesson);
    } finally {
      setPendingId(null);
    }
  }

  async function handleUpgrade(plan: PlanId) {
    setUpgradeError(null);
    setUpgradingPlan(plan);
    try {
      await onUpgrade(plan);
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Something went wrong.");
      setUpgradingPlan(null);
    }
  }

  if (lessons.length === 0) {
    return (
      <section className="w-full max-w-sm rounded-3xl bg-paper/80 border border-mist p-6">
        <p className="text-sm text-stone">No lessons yet — check back soon.</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-sm flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-ink">The Path</h2>
        {!isPremium && (
          <span className="text-xs text-stone">
            {Math.min(completedCount, FREE_DAILY_LESSON_LIMIT)} of {FREE_DAILY_LESSON_LIMIT} free
            today
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {bookNames.map((name) => {
          const bookLessons = byBook.get(name)!;
          const revealed = revealedIds
            ? bookLessons.filter((lesson) => revealedIds.has(lesson.id))
            : bookLessons;
          const locked = revealedIds
            ? bookLessons.filter((lesson) => !revealedIds.has(lesson.id))
            : [];
          const isOpen = openBook === name;

          return (
            <div key={name} className="rounded-2xl bg-paper border border-mist overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenBook(isOpen ? null : name)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <h3 className="text-base font-semibold text-ink">{name}</h3>
                  <p className="text-xs text-stone mt-0.5">
                    {bookLessons.length} lesson{bookLessons.length === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="text-stone text-xs shrink-0">{isOpen ? "–" : "+"}</span>
              </button>

              {isOpen && (
                <div className="flex flex-col gap-3 px-5 pb-5">
                  {revealed.map((lesson) => {
                    const isDone = completedLessonIds.includes(lesson.id);
                    return (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        isDone={isDone}
                        isLocked={atLimit && !isDone}
                        isPending={pendingId === lesson.id}
                        onComplete={() => handleComplete(lesson)}
                      />
                    );
                  })}

                  {locked.length > 0 && (
                    <>
                      <div
                        className={`flex flex-col gap-3 border-t border-mist pt-3 ${blurredPreviewClass}`}
                      >
                        {locked.map((lesson) => (
                          <LessonCard
                            key={lesson.id}
                            lesson={lesson}
                            isDone={false}
                            isLocked
                            isPending={false}
                            onComplete={() => Promise.resolve()}
                          />
                        ))}
                      </div>
                      <UnlockCard
                        title={`Unlock all of ${name}`}
                        description={`Get every lesson in ${name}, in order, plus full access to the rest of the library.`}
                        getIdToken={getIdToken}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {atLimit && !suppressUpgradeNag && (
        <div className="rounded-2xl bg-clay-50 border border-clay-200 p-4 flex flex-col items-center gap-3 text-center">
          <div>
            <p className="text-sm text-ink">
              You&apos;ve used all {FREE_DAILY_LESSON_LIMIT} free lessons today.
            </p>
            <p className="text-xs text-stone mt-1">
              Come back tomorrow, or upgrade to Premium for unlimited daily lessons.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={upgradingPlan !== null}
              onClick={() => void handleUpgrade("monthly")}
              className="rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {upgradingPlan === "monthly" ? "Redirecting…" : "Monthly $6.99"}
            </button>
            <button
              type="button"
              disabled={upgradingPlan !== null}
              onClick={() => void handleUpgrade("yearly")}
              className="rounded-full border border-clay-400 text-clay-700 px-4 py-1.5 text-xs font-medium hover:bg-clay-100/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {upgradingPlan === "yearly" ? "Redirecting…" : "Yearly $59.99"}
            </button>
          </div>
          {upgradeError && <p className="text-xs text-clay-700">{upgradeError}</p>}
        </div>
      )}
    </section>
  );
}
