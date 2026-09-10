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
import { CHECK_IN_XP, levelFromXp } from "@/lib/xp";
import {
  COLLECTIONS,
  type CheckInType,
  type StreakDoc,
  type UserDoc,
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
  xpEarned: number;
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
}

export interface CheckInOptions {
  type: CheckInType;
  lessonId?: string | null;
  notes?: string | null;
}

/**
 * Records a check-in for `uid` "today" (in `timeZone`), updating the streak,
 * writing a check_ins doc, and awarding XP — all in one transaction so a
 * double-tap or two devices checking in at once can't double-count. Only
 * called for a real signed-in user, which implies Firebase was configured
 * when auth initialized — so `db` is guaranteed to be set here.
 */
export async function checkIn(
  uid: string,
  timeZone: string,
  options: CheckInOptions = { type: "custom" },
): Promise<CheckInResult> {
  const today = dateKeyInTimeZone(new Date(), timeZone);
  const streakRef = doc(db!, COLLECTIONS.streaks, uid);
  const userRef = doc(db!, COLLECTIONS.users, uid);
  const checkInRef = doc(collection(db!, COLLECTIONS.checkIns));

  return runTransaction(db!, async (tx) => {
    const streakSnap = await tx.get(streakRef);
    const userSnap = await tx.get(userRef);

    const prevStreak = streakSnap.exists()
      ? (streakSnap.data() as StreakDoc)
      : null;
    const prevUser = userSnap.exists() ? (userSnap.data() as UserDoc) : null;
    const update = computeStreakUpdate(prevStreak, today);

    if (update.alreadyCheckedInToday) {
      return {
        alreadyCheckedInToday: true,
        currentCount: prevStreak?.currentCount ?? 0,
        longestCount: prevStreak?.longestCount ?? 0,
        xpEarned: 0,
        newXp: prevUser?.xp ?? 0,
        newLevel: prevUser?.level ?? 1,
        leveledUp: false,
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
      xpEarned: CHECK_IN_XP,
      notes: options.notes ?? null,
    });

    const prevXp = prevUser?.xp ?? 0;
    const prevLevel = prevUser?.level ?? 1;
    const newXp = prevXp + CHECK_IN_XP;
    const newLevel = levelFromXp(newXp);
    tx.update(userRef, { xp: newXp, level: newLevel });

    return {
      alreadyCheckedInToday: false,
      currentCount: update.currentCount,
      longestCount: update.longestCount,
      xpEarned: CHECK_IN_XP,
      newXp,
      newLevel,
      leveledUp: newLevel > prevLevel,
    };
  });
}
