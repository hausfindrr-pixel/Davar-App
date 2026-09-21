import type { CheckInDoc, LessonAnswerDoc, LessonDoc, PrayerDoc } from "@/types/firestore";

export type LedgerLessonAnswer = {
  screenId: string;
  prompt: string;
  text: string;
};

export type LedgerEntry =
  | {
      kind: "lesson";
      key: string;
      date: string; // "YYYY-MM-DD"
      timestampMs: number;
      lessonId: string;
      title: string;
      scriptureReference: string | null;
      answers: LedgerLessonAnswer[];
    }
  | {
      kind: "prayer";
      key: string;
      date: string;
      timestampMs: number;
      prayerId: string;
      text: string;
    };

export interface LedgerDay {
  date: string;
  entries: LedgerEntry[];
}

/**
 * Combines lesson completions and prayers into one reverse-chronological
 * list of Ledger entries — reusing existing data end to end, nothing new
 * stored: `lessonCheckIns` (fetchLessonCheckIns, src/lib/db/checkIns.ts)
 * gives each completed lesson's real completion date; `lessonAnswers`
 * (fetchLessonAnswers, src/lib/db/lessonAnswers.ts) supplies the written
 * scenario/short-answer text, joined here by `lessonId`; `lessons` (the
 * app's existing lesson list) supplies each screen's own prompt so an
 * expanded entry shows the question next to the answer; `prayers`
 * (subscribeToPrayers, src/lib/db/prayers.ts) is used as-is.
 *
 * A lesson only becomes a Ledger entry once its check-in exists — answers
 * saved mid-lesson (via back-navigation, before the lesson is finished)
 * don't show up on their own.
 */
export function buildLedgerEntries(
  lessonCheckIns: CheckInDoc[],
  lessonAnswers: LessonAnswerDoc[],
  lessons: LessonDoc[],
  prayers: PrayerDoc[],
): LedgerEntry[] {
  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const answersByLesson = new Map<string, LessonAnswerDoc[]>();
  for (const answer of lessonAnswers) {
    const list = answersByLesson.get(answer.lessonId) ?? [];
    list.push(answer);
    answersByLesson.set(answer.lessonId, list);
  }

  const entries: LedgerEntry[] = [];

  for (const checkIn of lessonCheckIns) {
    if (!checkIn.lessonId) continue;
    const lesson = lessonsById.get(checkIn.lessonId);
    const rawAnswers = answersByLesson.get(checkIn.lessonId) ?? [];
    const answers: LedgerLessonAnswer[] = rawAnswers.map((answer) => {
      const screen = lesson?.screens.find((s) => s.id === answer.screenId);
      return { screenId: answer.screenId, prompt: screen?.prompt ?? "", text: answer.text };
    });

    entries.push({
      kind: "lesson",
      key: `lesson_${checkIn.lessonId}`,
      date: checkIn.date,
      timestampMs: checkIn.completedAt?.toMillis() ?? 0,
      lessonId: checkIn.lessonId,
      title: lesson?.title ?? "A completed lesson",
      scriptureReference: lesson?.scriptureReference ?? null,
      answers,
    });
  }

  for (const prayer of prayers) {
    entries.push({
      kind: "prayer",
      key: `prayer_${prayer.id}`,
      date: prayer.date,
      timestampMs: prayer.createdAt?.toMillis() ?? 0,
      prayerId: prayer.id,
      text: prayer.text,
    });
  }

  entries.sort((a, b) => b.timestampMs - a.timestampMs);
  return entries;
}

/** Groups already reverse-chronological entries into day buckets,
 * preserving order — the shape Matthew's Ledger renders directly. */
export function groupLedgerEntriesByDay(entries: LedgerEntry[]): LedgerDay[] {
  const days: LedgerDay[] = [];
  let current: LedgerDay | null = null;
  for (const entry of entries) {
    if (!current || current.date !== entry.date) {
      current = { date: entry.date, entries: [] };
      days.push(current);
    }
    current.entries.push(entry);
  }
  return days;
}

export interface OnThisDay {
  label: string;
  entries: LedgerEntry[];
}

/**
 * "On this day" (Premium) — entries whose day-of-month matches today's,
 * from the closest strictly-earlier month (per the spec: "if the user
 * wrote a prayer or completed a lesson on the same date in an earlier
 * month"). Returns null when nothing matches. `todayKey` is a
 * "YYYY-MM-DD" (dateKeyInTimeZone) so this compares calendar dates, not
 * instants.
 */
export function findOnThisDay(entries: LedgerEntry[], todayKey: string): OnThisDay | null {
  const [ty, tm, td] = todayKey.split("-").map(Number);

  let bestDate: string | null = null;
  let bestGapMonths = Infinity;
  for (const entry of entries) {
    const [ey, em, ed] = entry.date.split("-").map(Number);
    if (ed !== td) continue;
    const gapMonths = (ty - ey) * 12 + (tm - em);
    if (gapMonths <= 0) continue; // strictly earlier month only
    if (gapMonths < bestGapMonths) {
      bestGapMonths = gapMonths;
      bestDate = entry.date;
    }
  }
  if (!bestDate) return null;

  const label = bestGapMonths === 1 ? "One month ago today" : `${bestGapMonths} months ago today`;
  return { label, entries: entries.filter((entry) => entry.date === bestDate) };
}

/** Plain substring search (Premium) over a Ledger entry's own text —
 * prayer text, or a lesson's title plus every saved answer. Client-side
 * over the already-loaded entries; this app's per-user ledger is small
 * enough that it doesn't need a search index. */
export function searchLedgerEntries(entries: LedgerEntry[], queryText: string): LedgerEntry[] {
  const needle = queryText.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((entry) => {
    if (entry.kind === "prayer") return entry.text.toLowerCase().includes(needle);
    return (
      entry.title.toLowerCase().includes(needle) ||
      entry.answers.some((answer) => answer.text.toLowerCase().includes(needle))
    );
  });
}
