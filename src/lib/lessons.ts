import { FREE_DAILY_LESSON_LIMIT, type LessonDoc } from "@/types/firestore";

/**
 * Which lessons (from the front of the ordered list) a free-tier user can
 * see by a given day of their journey — `dayIndex` 0 is signup day, which
 * reveals the first FREE_DAILY_LESSON_LIMIT lessons; each day after that
 * reveals one more batch of that size. Without this, a free account would
 * see the entire lesson library at once with most of it permanently
 * "Locked", instead of a fresh "today's lessons" set. Premium sees the
 * full library regardless — call this only for free-tier users.
 */
export function visibleLessonsForFreeTier(lessons: LessonDoc[], dayIndex: number): LessonDoc[] {
  const daysElapsed = Math.max(0, dayIndex);
  const revealed = (daysElapsed + 1) * FREE_DAILY_LESSON_LIMIT;
  return lessons.slice(0, Math.min(lessons.length, revealed));
}
