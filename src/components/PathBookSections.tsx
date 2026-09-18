"use client";

import { useState } from "react";
import { ArrowLeftIcon } from "@/components/icons";
import { LessonCard } from "@/components/LessonCard";
import { UnlockCard } from "@/components/PremiumGate";
import { RoadmapPath } from "@/components/RoadmapPath";
import { CONTENT_TYPE_META, CONTENT_TYPE_ORDER } from "@/lib/contentType";
import { visibleLessonsForFreeTier } from "@/lib/lessons";
import type { PlanId } from "@/lib/plisio/plans";
import { groupLessonsByBook, roadmapNodeStates } from "@/lib/roadmap";
import { dailyActivityLimit, type LessonDoc, type LessonTrack } from "@/types/firestore";

/** A request from outside (the Today tab's "Continue Your Story" teaser)
 * to jump straight to a specific book/story. `nonce` only exists so two
 * requests for the same story in a row still re-trigger the effect below
 * (object identity, not value equality, drives it). */
export type PathFocusRequest = { book: string; lessonId: string; nonce: number };

type PathBookSectionsProps = {
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

/** The Path's story library, grouped into book sections (Genesis, John,
 * Philippians, ...) in canonical Bible order — same single-open-accordion
 * pattern as ArmoryTab. Inside an open book, content is split into three
 * collapsible tabs by track (CONTENT_TYPE_ORDER: Lessons/Prayer/Devotion,
 * src/lib/contentType.ts), each with its own accent color — today only
 * Lessons (track "scripture") has real content, so Prayer and Devotion
 * show a muted "Coming soon" row instead of an empty collapsible.
 *
 * Within a track with content, stories render as a winding roadmap
 * (RoadmapPath) instead of a flat list: users walk it in order — only the
 * first not-yet-completed, revealed story is tappable ("current"),
 * everything after is locked until it's done (roadmapNodeStates,
 * src/lib/roadmap.ts). Free tier additionally can't reveal a whole book at
 * once (visibleLessonsForFreeTier's round-robin-across-books reveal) —
 * revealed-but-locked-by-paywall nodes show inert with the per-book
 * UnlockCard below, same pattern as the Armory and Peter's Watch. Tapping
 * an unlocked node swaps the tabs for that story's detail (LessonCard)
 * with a "back to path" button. */
export function PathBookSections({
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
}: PathBookSectionsProps) {
  const [openBook, setOpenBook] = useState<string | null>(null);
  const [openTrack, setOpenTrack] = useState<LessonTrack | null>(null);
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

  const { bookNames, byBook } = groupLessonsByBook(lessons);

  let effectiveOpenBook = openBook;
  let effectiveOpenTrack = openTrack;
  let effectiveOpenLessonId = openLessonId;
  if (focusRequest && focusRequest.nonce !== handledFocusNonce) {
    const focusedLesson = lessons.find((lesson) => lesson.id === focusRequest.lessonId);
    effectiveOpenBook = focusRequest.book;
    effectiveOpenTrack = focusedLesson?.track ?? null;
    effectiveOpenLessonId = focusRequest.lessonId;
    setHandledFocusNonce(focusRequest.nonce);
    setOpenBook(focusRequest.book);
    setOpenTrack(focusedLesson?.track ?? null);
    setOpenLessonId(focusRequest.lessonId);
  }
  const openLesson = lessons.find((lesson) => lesson.id === effectiveOpenLessonId) ?? null;

  function selectBook(name: string) {
    const opening = openBook !== name;
    setOpenBook(opening ? name : null);
    setOpenTrack(null);
    setOpenLessonId(null);
  }

  function selectTrack(track: LessonTrack) {
    setOpenTrack(effectiveOpenTrack === track ? null : track);
    setOpenLessonId(null);
  }

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
        <span className="text-xs text-stone">
          {Math.min(todayActivityCount, limit)} of {limit} today
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {bookNames.map((name) => {
          const bookLessons = byBook.get(name)!;
          const hasPaywallLocked = bookLessons.some(
            (lesson) => revealedIds !== null && !revealedIds.has(lesson.id),
          );
          const isBookOpen = effectiveOpenBook === name;
          const showingDetail = isBookOpen && openLesson && bookLessons.some((l) => l.id === openLesson.id);
          const completedInBook = bookLessons.filter((l) => completedLessonIds.includes(l.id)).length;
          const progress = bookLessons.length > 0 ? completedInBook / bookLessons.length : 0;

          const byTrack = new Map<LessonTrack, LessonDoc[]>();
          for (const lesson of bookLessons) {
            const list = byTrack.get(lesson.track) ?? [];
            list.push(lesson);
            byTrack.set(lesson.track, list);
          }

          return (
            <div key={name} className="rounded-2xl bg-paper border border-mist overflow-hidden">
              <button
                type="button"
                onClick={() => selectBook(name)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-ink">{name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="h-1.5 flex-1 max-w-24 rounded-full bg-mist overflow-hidden">
                      <div
                        className="h-full rounded-full bg-clay-600"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone shrink-0">
                      {completedInBook}/{bookLessons.length}
                    </span>
                  </div>
                </div>
                <span className="text-stone text-xs shrink-0">{isBookOpen ? "–" : "+"}</span>
              </button>

              {isBookOpen && (
                <div className="flex flex-col gap-3 px-5 pb-5">
                  {showingDetail && openLesson ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      {CONTENT_TYPE_ORDER.map((track) => {
                        const meta = CONTENT_TYPE_META[track];
                        const trackLessons = byTrack.get(track) ?? [];
                        const Icon = meta.icon;

                        if (trackLessons.length === 0) {
                          return (
                            <div
                              key={track}
                              className="flex items-center gap-3 rounded-xl border border-mist px-4 py-3 opacity-60"
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.badgeClass}`}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <div>
                                <p className="text-sm font-medium text-ink">{meta.label}</p>
                                <p className="text-xs text-stone">Coming soon</p>
                              </div>
                            </div>
                          );
                        }

                        const isTrackOpen = effectiveOpenTrack === track;
                        const states = roadmapNodeStates(trackLessons, completedLessonIds, revealedIds);

                        return (
                          <div key={track} className="rounded-xl border border-mist overflow-hidden">
                            <button
                              type="button"
                              onClick={() => selectTrack(track)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.badgeClass}`}
                                >
                                  <Icon className="h-4 w-4" />
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-ink">{meta.label}</p>
                                  <p className="text-xs text-stone">
                                    {trackLessons.length} lesson{trackLessons.length === 1 ? "" : "s"}
                                  </p>
                                </div>
                              </div>
                              <span className="text-stone text-xs shrink-0">{isTrackOpen ? "–" : "+"}</span>
                            </button>

                            {isTrackOpen && (
                              <div className="px-4 pb-4">
                                <RoadmapPath
                                  lessons={trackLessons}
                                  states={states}
                                  accent={meta}
                                  onSelect={(lesson) => setOpenLessonId(lesson.id)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {hasPaywallLocked && (
                        <UnlockCard
                          title={`Unlock all of ${name}`}
                          description={`Get every lesson in ${name}, in order, plus full access to the rest of the library.`}
                          getIdToken={getIdToken}
                        />
                      )}
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
