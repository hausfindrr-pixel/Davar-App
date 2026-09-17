import { PathBookSections } from "@/components/PathBookSections";
import { PrayerJournal } from "@/components/PrayerJournal";
import type { PlanId } from "@/lib/plisio/plans";
import type { LessonDoc } from "@/types/firestore";

type PathTabProps = {
  uid: string;
  timeZone: string;
  lessons: LessonDoc[];
  dayIndex: number;
  completedLessonIds: string[];
  isPremium: boolean;
  suppressUpgradeNag: boolean;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
  getIdToken: () => Promise<string>;
};

/** The Path — the book-organized lesson library, plus a free-text prayer
 * journal below it (Prayer is already one of the lesson tracks here, so
 * this is where "write your own" naturally sits alongside the guided
 * ones). Free tier: lessons capped at FREE_DAILY_LESSON_LIMIT completions
 * per day (enforced in firestore.rules, not just here — see completeLesson
 * in src/lib/db/lessons.ts) and revealed a book-assorted batch at a time
 * (see visibleLessonsForFreeTier); the prayer journal itself isn't capped. */
export function PathTab({ uid, timeZone, ...sectionProps }: PathTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <PathBookSections {...sectionProps} />
      <PrayerJournal uid={uid} timeZone={timeZone} />
    </div>
  );
}
