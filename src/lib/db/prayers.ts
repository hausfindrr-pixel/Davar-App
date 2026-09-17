import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dateKeyInTimeZone } from "@/lib/date";
import { computeStreakUpdate } from "@/lib/streak";
import { CHECK_IN_XP, levelFromXp } from "@/lib/xp";
import {
  COLLECTIONS,
  PRAYER_XP_REWARD,
  dailyActivityLimit,
  type DailyLessonProgressDoc,
  type PrayerDoc,
  type StreakDoc,
  type UserDoc,
} from "@/types/firestore";

const MAX_PRAYER_LENGTH = 2000;

function progressDocId(uid: string, date: string): string {
  return `${uid}_${date}`;
}

/** A user's own prayers, newest first. */
export function subscribeToPrayers(uid: string, callback: (prayers: PrayerDoc[]) => void): () => void {
  const q = query(collection(db!, COLLECTIONS.users, uid, "prayers"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((docSnap) => docSnap.data() as PrayerDoc));
  });
}

export interface SubmitPrayerResult {
  limitReached: boolean;
  xpEarned: number;
  newXp: number;
  newLevel: number;
}

/**
 * Saves a free-text prayer and awards XP the same way completing a lesson
 * does — same transaction shape as completeLesson in src/lib/db/lessons.ts:
 * the prayer write, a streak check-in (only once per day — a second
 * prayer the same day still saves, just doesn't re-award the streak XP),
 * and a check_ins record, all in one transaction. Prayers share the same
 * daily activity cap as lessons (dailyActivityLimit, src/types/firestore.ts)
 * via the same daily_lesson_progress doc — counted, not ID-tracked, since a
 * prayer doesn't need an "already done" check the way a lesson does.
 */
export async function submitPrayer(uid: string, timeZone: string, text: string): Promise<SubmitPrayerResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write something before submitting.");
  if (trimmed.length > MAX_PRAYER_LENGTH) throw new Error("That prayer is too long.");

  const today = dateKeyInTimeZone(new Date(), timeZone);
  const prayerRef = doc(collection(db!, COLLECTIONS.users, uid, "prayers"));
  const progressRef = doc(db!, COLLECTIONS.dailyLessonProgress, progressDocId(uid, today));
  const userRef = doc(db!, COLLECTIONS.users, uid);
  const streakRef = doc(db!, COLLECTIONS.streaks, uid);
  const checkInRef = doc(collection(db!, COLLECTIONS.checkIns));

  return runTransaction(db!, async (tx) => {
    const progressSnap = await tx.get(progressRef);
    const userSnap = await tx.get(userRef);
    const streakSnap = await tx.get(streakRef);

    const prevProgress = progressSnap.exists()
      ? (progressSnap.data() as DailyLessonProgressDoc)
      : null;
    const completedLessonIds = prevProgress?.completedLessonIds ?? [];
    const prayerCount = prevProgress?.prayerCount ?? 0;
    const user = userSnap.exists() ? (userSnap.data() as UserDoc) : undefined;
    const tier = user?.tier ?? "free";
    const prevXp = user?.xp ?? 0;
    const prevLevel = user?.level ?? 1;

    if (completedLessonIds.length + prayerCount >= dailyActivityLimit(tier)) {
      return { limitReached: true, xpEarned: 0, newXp: prevXp, newLevel: prevLevel };
    }

    tx.set(prayerRef, { id: prayerRef.id, text: trimmed, date: today, createdAt: serverTimestamp() });

    if (progressSnap.exists()) {
      tx.update(progressRef, {
        userId: uid,
        date: today,
        prayerCount: prayerCount + 1,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(progressRef, {
        userId: uid,
        date: today,
        completedLessonIds: [],
        prayerCount: 1,
        updatedAt: serverTimestamp(),
      });
    }

    const prevStreak = streakSnap.exists() ? (streakSnap.data() as StreakDoc) : null;
    const streakUpdate = computeStreakUpdate(prevStreak, today);
    if (!streakUpdate.alreadyCheckedInToday) {
      tx.set(streakRef, {
        userId: uid,
        currentCount: streakUpdate.currentCount,
        longestCount: streakUpdate.longestCount,
        lastCheckInDate: streakUpdate.lastCheckInDate,
        freezesAvailable: streakUpdate.freezesAvailable,
        freezesUsedDates: streakUpdate.freezesUsedDates,
        updatedAt: serverTimestamp(),
      });
    }

    tx.set(checkInRef, {
      id: checkInRef.id,
      userId: uid,
      lessonId: null,
      type: "prayer",
      date: today,
      completedAt: serverTimestamp(),
      xpEarned: PRAYER_XP_REWARD,
      notes: null,
    });

    const streakXp = streakUpdate.alreadyCheckedInToday ? 0 : CHECK_IN_XP;
    const newXp = prevXp + PRAYER_XP_REWARD + streakXp;
    const newLevel = levelFromXp(newXp);
    tx.update(userRef, { xp: newXp, level: newLevel });

    return { limitReached: false, xpEarned: PRAYER_XP_REWARD + streakXp, newXp, newLevel };
  });
}
