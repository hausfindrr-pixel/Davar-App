import { BIBLE_BOOKS } from "@/lib/bible";
import { CONTENT_TYPE_ORDER } from "@/lib/contentType";
import type { LessonDoc } from "@/types/firestore";

/** Groups lessons by `lessonBook`, each book's list sorted by `order`, and
 * returns book names in BIBLE_BOOKS' canonical order (filtered to books
 * that actually have lessons) — the same grouping flattenPathEvents and
 * nextStoryAcrossBooks both need, kept in one place. */
export function groupLessonsByBook(lessons: LessonDoc[]): {
  bookNames: string[];
  byBook: Map<string, LessonDoc[]>;
} {
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
  return { bookNames, byBook };
}

/**
 * A (book, track) group's lessons progress in order — "completed" once
 * done; the first not-yet-completed lesson is "current" (the one to do
 * next); everything after that is "sequenceLocked" (an earlier story in
 * the same group isn't done yet). Only used for premium's full-list view —
 * free tier renders a single event via nextEventForFreeTier instead, so
 * there's no separate "paywallLocked" state to represent here.
 */
export type RoadmapNodeState = "completed" | "current" | "sequenceLocked";

export function roadmapNodeStates(
  bookLessons: LessonDoc[],
  completedLessonIds: string[],
): Map<string, RoadmapNodeState> {
  const states = new Map<string, RoadmapNodeState>();
  const firstIncompleteIndex = bookLessons.findIndex((lesson) => !completedLessonIds.includes(lesson.id));

  bookLessons.forEach((lesson, index) => {
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

export interface NextStory {
  lesson: LessonDoc;
  book: string;
}

/**
 * The single story to feature as "next up" across the whole Path, for
 * PREMIUM users — the "current" node of the first (book, track) group, in
 * canonical book order then CONTENT_TYPE_ORDER, that has one. Each (book,
 * track) pair progresses independently (roadmapNodeStates), so this scans
 * the same way rather than mixing tracks into one combined sequence.
 * Several groups can each have their own current node at once (premium
 * sees the whole library, sequentially gated per group), so this picks by
 * the Path list's own top-to-bottom order — it's a pointer into the user's
 * own progress, not a separate rotation pool. Free tier uses
 * nextEventForFreeTier instead, which has a single global pointer rather
 * than one per group. Returns null once everything is completed.
 */
export function nextStoryAcrossBooks(
  lessons: LessonDoc[],
  completedLessonIds: string[],
): NextStory | null {
  const { bookNames, byBook } = groupLessonsByBook(lessons);
  for (const book of bookNames) {
    const bookLessons = byBook.get(book)!;
    for (const track of CONTENT_TYPE_ORDER) {
      const trackLessons = bookLessons.filter((lesson) => lesson.track === track);
      if (trackLessons.length === 0) continue;
      const states = roadmapNodeStates(trackLessons, completedLessonIds);
      const current = trackLessons.find((lesson) => states.get(lesson.id) === "current");
      if (current) return { lesson: current, book };
    }
  }
  return null;
}

export interface PathEvent {
  lesson: LessonDoc;
  book: string;
  state: RoadmapNodeState;
  /** Set only when `state` is "sequenceLocked" — the title of the story
   * blocking this one (the same group's "current" lesson), so the card
   * can say exactly what to finish first instead of just "locked". */
  blockingTitle?: string;
}

/**
 * Every lesson across every book, flattened into one ordered list for The
 * Path's card feed (PathEventList.tsx) — canonical book order, then
 * CONTENT_TYPE_ORDER within a book, then each group's own `order`. PREMIUM
 * ONLY: free tier renders nextEventForFreeTier's single event instead,
 * never this full list. Each event carries its own roadmapNodeStates
 * result, computed per (book, track) group exactly as nextStoryAcrossBooks
 * does, so the flat list's lock/current/completed states match what a
 * grouped view would show — this only changes how it's laid out, not the
 * underlying progression.
 */
export function flattenPathEvents(lessons: LessonDoc[], completedLessonIds: string[]): PathEvent[] {
  const { bookNames, byBook } = groupLessonsByBook(lessons);
  const events: PathEvent[] = [];

  for (const book of bookNames) {
    const bookLessons = byBook.get(book)!;
    for (const track of CONTENT_TYPE_ORDER) {
      const trackLessons = bookLessons.filter((lesson) => lesson.track === track);
      if (trackLessons.length === 0) continue;

      const states = roadmapNodeStates(trackLessons, completedLessonIds);
      const current = trackLessons.find((lesson) => states.get(lesson.id) === "current");

      for (const lesson of trackLessons) {
        const state = states.get(lesson.id)!;
        events.push({
          lesson,
          book,
          state,
          blockingTitle: state === "sequenceLocked" ? current?.title : undefined,
        });
      }
    }
  }

  return events;
}

/**
 * The single active event for FREE tier — a global pointer into the whole
 * library's canonical order (book, then CONTENT_TYPE_ORDER, then each
 * group's own `order`, same ordering flattenPathEvents uses), not one
 * pointer per (book, track) group like premium's roadmapNodeStates. It's
 * the first lesson not yet in `completedLessonIds`: as soon as that lesson
 * is completed, the next call returns the very next one — there's no
 * separate persisted rotation-position field, "today's active event" is
 * always just derived from the all-time completed set. Returns null once
 * every lesson in the library has been completed (the whole library has
 * cycled).
 */
export function nextEventForFreeTier(lessons: LessonDoc[], completedLessonIds: string[]): PathEvent | null {
  const { bookNames, byBook } = groupLessonsByBook(lessons);

  for (const book of bookNames) {
    const bookLessons = byBook.get(book)!;
    for (const track of CONTENT_TYPE_ORDER) {
      const trackLessons = bookLessons.filter((lesson) => lesson.track === track);
      const next = trackLessons
        .slice()
        .sort((a, b) => a.order - b.order)
        .find((lesson) => !completedLessonIds.includes(lesson.id));
      if (next) return { lesson: next, book, state: "current" };
    }
  }

  return null;
}
