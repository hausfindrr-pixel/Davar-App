"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LessonCard } from "@/components/LessonCard";
import { PathEventCard } from "@/components/PathEventCard";
import { UnlockCard } from "@/components/PremiumGate";
import { visibleLessonsForFreeTier } from "@/lib/lessons";
import type { PlanId } from "@/lib/plisio/plans";
import { flattenPathEvents } from "@/lib/roadmap";
import { dailyActivityLimit, type LessonDoc } from "@/types/firestore";

/** A request from outside (the Today tab's "Continue Your Story" teaser)
 * to jump straight to a specific event's detail. `nonce` only exists so
 * two requests for the same story in a row still re-trigger the effect
 * below (object identity, not value equality, drives it). */
export type PathFocusRequest = { lessonId: string; nonce: number };

type PathEventListProps = {
  lessons: LessonDoc[];
  /** Days since signup — drives how much of the free-tier reveal has
   * unlocked so far. Ignored for premium, which always sees everything. */
  dayIndex: number;
  completedLessonIds: string[];
  isPremium: boolean;
  /** Lessons completed + prayers submitted today, combined — see
   * dailyActivityLimit (src/types/firestore.ts). */
  todayActivityCount: number;
  /** Hide the "upgrade to unlock more" nag — e.g. right after checkout, while the upgrade is still confirming. */
  suppressUpgradeNag?: boolean;
  focusRequest?: PathFocusRequest | null;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
  getIdToken: () => Promise<string>;
};

/** The Path's story library as a flat, event-first card feed — the event
 * ("The Creation of the World") is each card's heading, with its Bible
 * book as a small subheading, not the other way around. One card per
 * event (today, one lesson each), ordered canonically (book, then
 * CONTENT_TYPE_ORDER, then each group's own `order` — flattenPathEvents,
 * src/lib/roadmap.ts), replacing the earlier nested book-accordion +
 * roadmap layout. Locked/current/completed state per card comes from the
 * same per-(book,track) sequential progression as before
 * (roadmapNodeStates) — this only changes how it's laid out, not the
 * underlying gating: users still can't skip ahead, free tier still can't
 * reveal a whole book at once, and premium still shares the higher daily
 * cap rather than being truly unlimited. Tapping a completed/current card
 * swaps the feed for that story's detail (LessonCard, unchanged) with a
 * "back to path" button. */
export function PathEventList({
  lessons,
  dayIndex,
  completedLessonIds,
  isPremium,
  todayActivityCount,
  suppressUpgradeNag = false,
  focusRequest = null,
  onComplete,
  onUpgrade,
  getIdToken,
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

  const limit = dailyActivityLimit(isPremium ? "premium" : "free");
  const atLimit = todayActivityCount >= limit;

  const revealedIds = isPremium
    ? null
    : new Set(visibleLessonsForFreeTier(lessons, dayIndex).map((lesson) => lesson.id));

  const events = flattenPathEvents(lessons, completedLessonIds, revealedIds);
  const hasPaywallLocked = events.some((event) => event.state === "paywallLocked");

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
          {Math.min(todayActivityCount, limit)} of {limit} today
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {events.map((event) => (
          <PathEventCard
            key={event.lesson.id}
            event={event}
            onSelect={(selected) => setOpenLessonId(selected.lesson.id)}
          />
        ))}
      </div>

      {hasPaywallLocked && (
        <UnlockCard
          title="Unlock the full Path"
          description="Get every story in every book, in order, from Genesis to Revelation."
          getIdToken={getIdToken}
        />
      )}

      {atLimit && !suppressUpgradeNag && (
        <div className="rounded-2xl bg-clay-50 border border-clay-200 p-4 flex flex-col items-center gap-3 text-center">
          <div>
            <p className="text-sm text-ink">
              You&apos;ve used all {limit} actions today across lessons and prayers.
            </p>
            <p className="text-xs text-stone mt-1">
              {isPremium
                ? "Come back tomorrow for another 15."
                : "Come back tomorrow, or upgrade to Premium for 15 a day."}
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
