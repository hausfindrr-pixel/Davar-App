import { PathBookSections, type PathFocusRequest } from "@/components/PathBookSections";
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
  /** Lessons completed + prayers submitted today, combined — see
   * dailyActivityLimit (src/types/firestore.ts). Drives both The Path's
   * lock state and the prayer journal's, since they share one cap. */
  todayActivityCount: number;
  suppressUpgradeNag: boolean;
  /** Set when the user tapped Today's "Continue Your Story" teaser —
   * jumps straight to that book/story. */
  focusRequest?: PathFocusRequest | null;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
  getIdToken: () => Promise<string>;
};

/** The Path — the book-organized lesson library, plus a free-text prayer
 * journal below it (Prayer is already one of the lesson tracks here, so
 * this is where "write your own" naturally sits alongside the guided
 * ones). Lessons and prayers share one daily activity cap
 * (dailyActivityLimit: 3/day free, 15/day premium — enforced in
 * firestore.rules, not just here; see completeLesson/submitPrayer in
 * src/lib/db/); The Path's free-tier reveal (which lessons are visible at
 * all, separate from the completion cap) is still a book-assorted batch at
 * a time (see visibleLessonsForFreeTier). */
export function PathTab({ uid, timeZone, isPremium, todayActivityCount, ...sectionProps }: PathTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <PathBookSections isPremium={isPremium} todayActivityCount={todayActivityCount} {...sectionProps} />
      <PrayerJournal uid={uid} timeZone={timeZone} isPremium={isPremium} todayActivityCount={todayActivityCount} />
    </div>
  );
}
