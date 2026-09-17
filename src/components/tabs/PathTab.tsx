import { LessonsSection } from "@/components/LessonsSection";
import { PrayerJournal } from "@/components/PrayerJournal";
import type { PlanId } from "@/lib/plisio/plans";
import type { LessonDoc } from "@/types/firestore";

type PathTabProps = {
  uid: string;
  timeZone: string;
  lessons: LessonDoc[];
  completedLessonIds: string[];
  isPremium: boolean;
  suppressUpgradeNag: boolean;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
};

/** The Path — the daily lessons feed, plus a free-text prayer journal
 * below it (Prayer is already one of the lesson tracks here, so this is
 * where "write your own" naturally sits alongside the guided ones). Free
 * tier: lessons capped at FREE_DAILY_LESSON_LIMIT per day (enforced in
 * firestore.rules, not just here — see completeLesson in
 * src/lib/db/lessons.ts); the prayer journal itself isn't capped. */
export function PathTab({ uid, timeZone, ...lessonsProps }: PathTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <LessonsSection {...lessonsProps} />
      <PrayerJournal uid={uid} timeZone={timeZone} />
    </div>
  );
}
