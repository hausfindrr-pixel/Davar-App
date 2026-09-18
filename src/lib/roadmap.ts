import type { LessonDoc } from "@/types/firestore";

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
