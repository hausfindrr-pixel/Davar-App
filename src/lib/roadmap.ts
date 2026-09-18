import { BIBLE_BOOKS } from "@/lib/bible";
import { CONTENT_TYPE_ORDER } from "@/lib/contentType";
import type { LessonDoc } from "@/types/firestore";

/** Groups lessons by `lessonBook`, each book's list sorted by `order`, and
 * returns book names in BIBLE_BOOKS' canonical order (filtered to books
 * that actually have lessons) — the same grouping PathBookSections and
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
 * A book's lessons progress in order — "completed" once done; the first
 * not-yet-completed *revealed* lesson is "current" (the one to do next);
 * anything revealed after that is "sequenceLocked" (visible, but an
 * earlier story in the same book isn't done yet); anything beyond the
 * free-tier reveal cursor is "paywallLocked" (the existing blurred +
 * UnlockCard treatment). Revealed lessons in a book are always a prefix
 * of that book's ordered list (visibleLessonsForFreeTier reveals each
 * book's lessons in their own order), so this stays a simple linear scan.
 */
export type RoadmapNodeState = "completed" | "current" | "sequenceLocked" | "paywallLocked";

export function roadmapNodeStates(
  bookLessons: LessonDoc[],
  completedLessonIds: string[],
  revealedIds: Set<string> | null,
): Map<string, RoadmapNodeState> {
  const states = new Map<string, RoadmapNodeState>();
  const revealed = revealedIds ? bookLessons.filter((lesson) => revealedIds.has(lesson.id)) : bookLessons;
  const firstIncompleteIndex = revealed.findIndex((lesson) => !completedLessonIds.includes(lesson.id));

  revealed.forEach((lesson, index) => {
    if (completedLessonIds.includes(lesson.id)) {
      states.set(lesson.id, "completed");
    } else if (index === firstIncompleteIndex) {
      states.set(lesson.id, "current");
    } else {
      states.set(lesson.id, "sequenceLocked");
    }
  });

  for (const lesson of bookLessons) {
    if (!states.has(lesson.id)) {
      states.set(lesson.id, "paywallLocked");
    }
  }

  return states;
}

export interface NextStory {
  lesson: LessonDoc;
  book: string;
}

/**
 * The single story to feature as "next up" across the whole Path — the
 * "current" node of the first (book, track) roadmap, in canonical book
 * order then CONTENT_TYPE_ORDER, that has one. Each book's tracks
 * (Lessons/Prayer/Devotion) are their own independent roadmap in the UI
 * (PathBookSections), so this scans the same way rather than mixing
 * tracks into one combined sequence. Several roadmaps can each have their
 * own current node at once (the free-tier reveal is round-robin across
 * books), so this picks by the roadmap's own top-to-bottom order rather
 * than anything date-based — it's a pointer into the user's own progress,
 * not a separate rotation pool (see the "Today: story teaser" README
 * section for why). Returns null once everything revealed is caught up.
 */
export function nextStoryAcrossBooks(
  lessons: LessonDoc[],
  completedLessonIds: string[],
  revealedIds: Set<string> | null,
): NextStory | null {
  const { bookNames, byBook } = groupLessonsByBook(lessons);
  for (const book of bookNames) {
    const bookLessons = byBook.get(book)!;
    for (const track of CONTENT_TYPE_ORDER) {
      const trackLessons = bookLessons.filter((lesson) => lesson.track === track);
      if (trackLessons.length === 0) continue;
      const states = roadmapNodeStates(trackLessons, completedLessonIds, revealedIds);
      const current = trackLessons.find((lesson) => states.get(lesson.id) === "current");
      if (current) return { lesson: current, book };
    }
  }
  return null;
}
