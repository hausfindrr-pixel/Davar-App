import { BIBLE_BOOKS } from "@/lib/bible";
import { FREE_DAILY_LESSON_LIMIT, type LessonDoc } from "@/types/firestore";

/**
 * Reorders lessons round-robin across books (one lesson from each book with
 * remaining lessons, in canonical Bible order, repeated) instead of the
 * flat per-book `order` sequence. This is what makes a free-tier "day's
 * reveal" assorted across books rather than working straight through
 * whichever book happens to sort first.
 */
function interleaveByBook(lessons: LessonDoc[]): LessonDoc[] {
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
  const interleaved: LessonDoc[] = [];
  for (let round = 0; interleaved.length < lessons.length; round++) {
    let addedThisRound = false;
    for (const name of bookNames) {
      const list = byBook.get(name)!;
      if (round < list.length) {
        interleaved.push(list[round]);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
  }
  return interleaved;
}

/**
 * Which lessons a free-tier user can see by a given day of their journey —
 * `dayIndex` 0 is signup day, which reveals the first FREE_DAILY_LESSON_LIMIT
 * lessons (round-robin across books, so day one already spans a few books
 * rather than being all one book); each day after that reveals one more
 * batch of that size. Without this, a free account would see the entire
 * lesson library at once with most of it permanently "Locked", instead of a
 * fresh set revealed a little at a time. Premium sees the full library
 * regardless — call this only for free-tier users.
 *
 * Note: with a small library where most books only have 1-2 lessons, a book
 * can end up fully revealed well before every other book catches up — the
 * "assorted across books, not full access to any one" feel gets stronger as
 * the library grows.
 */
export function visibleLessonsForFreeTier(lessons: LessonDoc[], dayIndex: number): LessonDoc[] {
  const order = interleaveByBook(lessons);
  const daysElapsed = Math.max(0, dayIndex);
  const revealed = (daysElapsed + 1) * FREE_DAILY_LESSON_LIMIT;
  return order.slice(0, Math.min(order.length, revealed));
}
