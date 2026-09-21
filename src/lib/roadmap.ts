import type { LessonDoc } from "@/types/firestore";

/**
 * Every lesson, sorted into the single chronological sequence the whole
 * Path now runs on (`chronologicalOrder`, src/types/firestore.ts) —
 * replaces the old per-book/track grouping entirely. Both tiers walk this
 * same one line; they only differ in how much of it is *shown* (see
 * PathEventList.tsx's strict per-tier visibility) and the daily
 * completion cap.
 */
function chronological(lessons: LessonDoc[]): LessonDoc[] {
  return lessons.slice().sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
}

/**
 * "completed" once done; the first not-yet-completed lesson in the whole
 * chronological sequence is "current" (the one to do next); everything
 * after that is "sequenceLocked" — nobody, on either tier, can skip ahead.
 */
export type RoadmapNodeState = "completed" | "current" | "sequenceLocked";

function lessonStates(
  sortedLessons: LessonDoc[],
  completedLessonIds: string[],
): Map<string, RoadmapNodeState> {
  const states = new Map<string, RoadmapNodeState>();
  const firstIncompleteIndex = sortedLessons.findIndex(
    (lesson) => !completedLessonIds.includes(lesson.id),
  );

  sortedLessons.forEach((lesson, index) => {
    if (completedLessonIds.includes(lesson.id)) {
      states.set(lesson.id, "completed");
    } else if (index === firstIncompleteIndex) {
      states.set(lesson.id, "current");
    } else {
      states.set(lesson.id, "sequenceLocked");
    }
  });

  return states;
}

export interface PathEvent {
  lesson: LessonDoc;
  state: RoadmapNodeState;
  /** Set only when `state` is "sequenceLocked" — the title of the lesson
   * blocking it (the sequence's one "current" lesson), so a card can say
   * exactly what to finish first instead of just "locked". */
  blockingTitle?: string;
}

/**
 * Every lesson in chronological order, each with its state — PREMIUM
 * ONLY: free tier renders `nextLesson`'s single event instead, never this
 * full list (see PathEventList.tsx). There's exactly one "current" lesson
 * for the whole library now (not one per book/track as before premium's
 * progression was made to match free tier's single-line model).
 */
export function flattenPathEvents(lessons: LessonDoc[], completedLessonIds: string[]): PathEvent[] {
  const sorted = chronological(lessons);
  const states = lessonStates(sorted, completedLessonIds);
  const current = sorted.find((lesson) => states.get(lesson.id) === "current");

  return sorted.map((lesson) => {
    const state = states.get(lesson.id)!;
    return {
      lesson,
      state,
      blockingTitle: state === "sequenceLocked" ? current?.title : undefined,
    };
  });
}

/**
 * The single "next up" lesson — the first not-yet-completed lesson in
 * chronological order. Used both as free tier's one visible card
 * (PathEventList.tsx) and as the Today teaser's target for both tiers
 * (NextStoryTeaser via page.tsx) — there's only one "current" lesson for
 * the whole library now, so both call sites share this one function
 * instead of premium/free each having their own. Returns null once every
 * lesson in the library has been completed.
 */
export function nextLesson(lessons: LessonDoc[], completedLessonIds: string[]): PathEvent | null {
  const sorted = chronological(lessons);
  const next = sorted.find((lesson) => !completedLessonIds.includes(lesson.id));
  return next ? { lesson: next, state: "current" } : null;
}
