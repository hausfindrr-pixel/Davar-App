import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dateKeyInTimeZone } from "@/lib/date";
import { computeStreakUpdate } from "@/lib/streak";
import {
  COLLECTIONS,
  type CheckInType,
  type StreakDoc,
} from "@/types/firestore";

export function subscribeToStreak(
  uid: string,
  callback: (streak: StreakDoc | null) => void,
): () => void {
  const ref = doc(db!, COLLECTIONS.streaks, uid);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as StreakDoc) : null);
  });
}

export interface CheckInResult {
  alreadyCheckedInToday: boolean;
  currentCount: number;
  longestCount: number;
}

export interface CheckInOptions {
  type: CheckInType;
  lessonId?: string | null;
  notes?: string | null;
}

/**
 * Records a check-in for `uid` "today" (in `timeZone`), updating the streak
 * and writing a check_ins doc in one transaction so a double-tap or two
 * devices checking in at once can't double-count. Only called for a real
 * signed-in user, which implies Firebase was configured when auth
 * initialized — so `db` is guaranteed to be set here.
 */
export async function checkIn(
  uid: string,
  timeZone: string,
  options: CheckInOptions = { type: "custom" },
): Promise<CheckInResult> {
  const today = dateKeyInTimeZone(new Date(), timeZone);
  const streakRef = doc(db!, COLLECTIONS.streaks, uid);
  const checkInRef = doc(collection(db!, COLLECTIONS.checkIns));

  return runTransaction(db!, async (tx) => {
    const streakSnap = await tx.get(streakRef);

    const prevStreak = streakSnap.exists()
      ? (streakSnap.data() as StreakDoc)
      : null;
    const update = computeStreakUpdate(prevStreak, today);

    if (update.alreadyCheckedInToday) {
      return {
        alreadyCheckedInToday: true,
        currentCount: prevStreak?.currentCount ?? 0,
        longestCount: prevStreak?.longestCount ?? 0,
      };
    }

    tx.set(streakRef, {
      userId: uid,
      currentCount: update.currentCount,
      longestCount: update.longestCount,
      lastCheckInDate: update.lastCheckInDate,
      freezesAvailable: update.freezesAvailable,
      freezesUsedDates: update.freezesUsedDates,
      updatedAt: serverTimestamp(),
    });

    tx.set(checkInRef, {
      id: checkInRef.id,
      userId: uid,
      lessonId: options.lessonId ?? null,
      type: options.type,
      date: today,
      completedAt: serverTimestamp(),
      notes: options.notes ?? null,
    });

    return {
      alreadyCheckedInToday: false,
      currentCount: update.currentCount,
      longestCount: update.longestCount,
    };
  });
}
