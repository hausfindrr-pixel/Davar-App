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
import { COLLECTIONS, PRAYER_XP_REWARD, type PrayerDoc, type StreakDoc, type UserDoc } from "@/types/firestore";

const MAX_PRAYER_LENGTH = 2000;

/** A user's own prayers, newest first. */
export function subscribeToPrayers(uid: string, callback: (prayers: PrayerDoc[]) => void): () => void {
  const q = query(collection(db!, COLLECTIONS.users, uid, "prayers"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((docSnap) => docSnap.data() as PrayerDoc));
  });
}

export interface SubmitPrayerResult {
  xpEarned: number;
  newXp: number;
  newLevel: number;
}

/**
 * Saves a free-text prayer and awards XP the same way completing a lesson
 * does — same transaction shape as completeLesson in src/lib/db/lessons.ts:
 * the prayer write, a streak check-in (only once per day — a second
 * prayer the same day still saves, just doesn't re-award the streak XP),
 * and a check_ins record, all in one transaction. No daily cap: prayer
 * submissions aren't a "lesson" for free-tier limiting purposes, and
 * nothing in the request asked for one.
 */
export async function submitPrayer(uid: string, timeZone: string, text: string): Promise<SubmitPrayerResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write something before submitting.");
  if (trimmed.length > MAX_PRAYER_LENGTH) throw new Error("That prayer is too long.");

  const today = dateKeyInTimeZone(new Date(), timeZone);
  const prayerRef = doc(collection(db!, COLLECTIONS.users, uid, "prayers"));
  const userRef = doc(db!, COLLECTIONS.users, uid);
  const streakRef = doc(db!, COLLECTIONS.streaks, uid);
  const checkInRef = doc(collection(db!, COLLECTIONS.checkIns));

  return runTransaction(db!, async (tx) => {
    const userSnap = await tx.get(userRef);
    const streakSnap = await tx.get(streakRef);

    const user = userSnap.exists() ? (userSnap.data() as UserDoc) : undefined;
    const prevXp = user?.xp ?? 0;

    tx.set(prayerRef, { id: prayerRef.id, text: trimmed, createdAt: serverTimestamp() });

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

    return { xpEarned: PRAYER_XP_REWARD + streakXp, newXp, newLevel };
  });
}
