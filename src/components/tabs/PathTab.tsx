"use client";

import { useRef, useState } from "react";
import { PathEventList, type PathFocusRequest } from "@/components/PathEventList";
import { PrayerJournal } from "@/components/PrayerJournal";
import type { PlanId } from "@/lib/plisio/plans";
import type { LessonDoc } from "@/types/firestore";

type PathTabProps = {
  uid: string;
  timeZone: string;
  lessons: LessonDoc[];
  allTimeCompletedLessonIds: string[];
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
 * free-text prayer journal below it, its own separate feature (not part
 * of any lesson's own steps — hidden, not removed, while a lesson's
 * guided flow is open, via onLessonOpenChange, so it never reads as
 * embedded in the lesson). A lesson's resolution screen can still hand
 * off to it optionally ("Pray about this" — onPrayAboutThis), which
 * closes the lesson and pre-fills the journal with its title as context.
 * Lessons and prayers each have their own daily cap (dailyEventLimit:
 * 1/day free, 3/day premium; dailyPrayerLimit: 3/day free, 15/day
 * premium — enforced in firestore.rules, not just here; see
 * completeLesson/submitPrayer in src/lib/db/). Every lesson unlocks
 * strictly in order along one chronological sequence shared by both
 * tiers; The Path's visibility is still strict per tier: free sees
 * exactly one lesson at a time (completion-gated, not date-based),
 * premium sees the whole sequence (see PathEventList). */
export function PathTab({
  uid,
  timeZone,
  isPremium,
  todayEventCount,
  todayPrayerCount,
  ...sectionProps
}: PathTabProps) {
  const [lessonOpen, setLessonOpen] = useState(false);
  const [prefillRequest, setPrefillRequest] = useState<{ title: string; nonce: number } | null>(null);
  const nonceRef = useRef(0);

  function handlePrayAboutThis(lessonTitle: string) {
    nonceRef.current += 1;
    setPrefillRequest({ title: lessonTitle, nonce: nonceRef.current });
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <PathEventList
        uid={uid}
        isPremium={isPremium}
        todayEventCount={todayEventCount}
        onLessonOpenChange={setLessonOpen}
        onPrayAboutThis={handlePrayAboutThis}
        {...sectionProps}
      />
      <PrayerJournal
        uid={uid}
        timeZone={timeZone}
        isPremium={isPremium}
        todayPrayerCount={todayPrayerCount}
        hidden={lessonOpen}
        prefillRequest={prefillRequest}
        onPrefillConsumed={() => setPrefillRequest(null)}
      />
    </div>
  );
}
