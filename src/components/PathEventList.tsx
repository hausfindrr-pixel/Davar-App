"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LessonCard } from "@/components/LessonCard";
import { PathEventCard } from "@/components/PathEventCard";
import type { PlanId } from "@/lib/plisio/plans";
import { flattenPathEvents, nextEventForFreeTier } from "@/lib/roadmap";
import { dailyEventLimit, type LessonDoc } from "@/types/firestore";

/** A request from outside (the Today tab's "Continue Your Story" teaser)
 * to jump straight to a specific event's detail. `nonce` only exists so
 * two requests for the same story in a row still re-trigger the effect
 * below (object identity, not value equality, drives it). */
export type PathFocusRequest = { lessonId: string; nonce: number };

type PathEventListProps = {
  lessons: LessonDoc[];
  /** Every lesson `uid` has EVER completed, across all days — see
   * fetchAllCompletedLessonIds (src/lib/db/lessons.ts). Drives gating for
   * both tiers; unlike `completedLessonIds` below, this never resets. */
  allTimeCompletedLessonIds: string[];
  /** Lessons completed strictly *today* — only used to know whether the
   * currently open lesson has already been done today for its Complete
   * button state; gating itself uses allTimeCompletedLessonIds. */
  completedLessonIds: string[];
  isPremium: boolean;
  /** Event lessons completed today — see dailyEventLimit
   * (src/types/firestore.ts). Separate from the prayer journal's own cap. */
  todayEventCount: number;
  /** Hide the "upgrade to unlock more" nag — e.g. right after checkout, while the upgrade is still confirming. */
  suppressUpgradeNag?: boolean;
  focusRequest?: PathFocusRequest | null;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
};

/** The Path's story library as a flat, event-first card feed — the event
 * ("The Creation of the World") is each card's heading, with its Bible
 * book as a small subheading, not the other way around. Visibility is
 * strict per tier, not just locked states: PREMIUM sees the full flattened
 * library (flattenPathEvents), sequentially gated per (book, track) group
 * exactly as before. FREE sees exactly one card — the single system-wide
 * active event (nextEventForFreeTier) — and nothing else is rendered at
 * all, not even dimmed/locked. That one event is completion-gated, not
 * date-based: it advances to the next lesson in the library the moment
 * it's completed (still capped at dailyEventLimit's 1/day, so an engaged
 * free user advances exactly one event per day they complete something;
 * skipping a day just leaves the same event waiting). Tapping a
 * completed/current card swaps the feed for that story's detail
 * (LessonCard, unchanged) with a "back to path" button. */
export function PathEventList({
  lessons,
  allTimeCompletedLessonIds,
  completedLessonIds,
  isPremium,
  todayEventCount,
  suppressUpgradeNag = false,
  focusRequest = null,
  onComplete,
  onUpgrade,
}: PathEventListProps) {
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState<PlanId | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  // Tracks which focusRequest (by nonce) has already been applied, so a
  // fresh "Continue Your Story" tap from Today can be told apart from a
  // stale prop on re-render. Adjusted during render (React's documented
  // pattern for "reset state when a prop changes"), not in an effect —
  // an effect here would setState after the first paint, causing an
  // extra, avoidable render.
  const [handledFocusNonce, setHandledFocusNonce] = useState<number | null>(null);

  const limit = dailyEventLimit(isPremium ? "premium" : "free");
  const atLimit = todayEventCount >= limit;

  const events = isPremium
    ? flattenPathEvents(lessons, allTimeCompletedLessonIds)
    : (() => {
        const next = nextEventForFreeTier(lessons, allTimeCompletedLessonIds);
        return next ? [next] : [];
      })();
  const libraryComplete = !isPremium && events.length === 0 && lessons.length > 0;

  let effectiveOpenLessonId = openLessonId;
  if (focusRequest && focusRequest.nonce !== handledFocusNonce) {
    effectiveOpenLessonId = focusRequest.lessonId;
    setHandledFocusNonce(focusRequest.nonce);
    setOpenLessonId(focusRequest.lessonId);
  }
  const openLesson = lessons.find((lesson) => lesson.id === effectiveOpenLessonId) ?? null;

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

  if (openLesson) {
    return (
      <section className="w-full max-w-sm flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setOpenLessonId(null)}
          className="flex items-center gap-1.5 text-xs text-stone self-start"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back to path
        </button>
        <LessonCard
          lesson={openLesson}
          isDone={completedLessonIds.includes(openLesson.id)}
          isLocked={atLimit && !completedLessonIds.includes(openLesson.id)}
          isPending={pendingId === openLesson.id}
          onComplete={() => handleComplete(openLesson)}
        />
      </section>
    );
  }

  return (
    <section className="w-full max-w-sm flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-ink">The Path</h2>
        <span className="text-xs text-stone">
          {Math.min(todayEventCount, limit)} of {limit} today
        </span>
      </div>

      {libraryComplete ? (
        <div className="rounded-2xl bg-sage-50 border border-sage-200 p-5 text-center">
          <p className="text-sm text-ink">You&apos;ve completed every story in the library.</p>
          <p className="text-xs text-stone mt-1">More is on the way — check back soon.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <PathEventCard
              key={event.lesson.id}
              event={event}
              onSelect={(selected) => setOpenLessonId(selected.lesson.id)}
            />
          ))}
        </div>
      )}

      {atLimit && !suppressUpgradeNag && (
        <div className="rounded-2xl bg-clay-50 border border-clay-200 p-4 flex flex-col items-center gap-3 text-center">
          <div>
            <p className="text-sm text-ink">
              {isPremium
                ? `You've completed all ${limit} stories for today.`
                : "You've completed today's story."}
            </p>
            <p className="text-xs text-stone mt-1">
              {isPremium
                ? "Come back tomorrow for 3 more."
                : "Want more? Unlock 3 lessons a day with Premium."}
            </p>
          </div>
          {!isPremium && (
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
          )}
          {upgradeError && <p className="text-xs text-clay-700">{upgradeError}</p>}
        </div>
      )}
    </section>
  );
}
