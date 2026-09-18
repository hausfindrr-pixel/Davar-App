import { PathEventList, type PathFocusRequest } from "@/components/PathEventList";
import { PrayerJournal } from "@/components/PrayerJournal";
import type { PlanId } from "@/lib/plisio/plans";
import type { LessonDoc } from "@/types/firestore";

type PathTabProps = {
  uid: string;
  timeZone: string;
  lessons: LessonDoc[];
  allTimeCompletedLessonIds: string[];
  completedLessonIds: string[];
  isPremium: boolean;
  /** Event lessons completed today — see dailyEventLimit
   * (src/types/firestore.ts). Drives The Path's own daily cap. */
  todayEventCount: number;
  /** Prayers submitted today — see dailyPrayerLimit. Its own separate cap,
   * drives the prayer journal below. */
  todayPrayerCount: number;
  suppressUpgradeNag: boolean;
  /** Set when the user tapped Today's "Continue Your Story" teaser —
   * jumps straight to that story's detail. */
  focusRequest?: PathFocusRequest | null;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
};

/** The Path — an event-first card feed of the story library, plus a
 * free-text prayer journal below it (Prayer is already one of the lesson
 * tracks here, so this is where "write your own" naturally sits alongside
 * the guided ones). Lessons and prayers each have their own daily cap
 * (dailyEventLimit: 1/day free, 3/day premium; dailyPrayerLimit: 3/day
 * free, 15/day premium — enforced in firestore.rules, not just here; see
 * completeLesson/submitPrayer in src/lib/db/). The Path's visibility is
 * strict per tier: free sees exactly one active event at a time
 * (completion-gated, not date-based), premium sees the whole library,
 * sequentially gated per book/track (see PathEventList). */
export function PathTab({
  uid,
  timeZone,
  isPremium,
  todayEventCount,
  todayPrayerCount,
  ...sectionProps
}: PathTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <PathEventList isPremium={isPremium} todayEventCount={todayEventCount} {...sectionProps} />
      <PrayerJournal uid={uid} timeZone={timeZone} isPremium={isPremium} todayPrayerCount={todayPrayerCount} />
    </div>
  );
}
