import {
  collection,
  doc,
  getDocs,
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
  FREE_DAILY_LESSON_LIMIT,
  type DailyLessonProgressDoc,
  type LessonDoc,
  type StreakDoc,
  type UserDoc,
} from "@/types/firestore";

/** All lessons, ordered for display. Only called for a signed-in user. */
export async function fetchLessons(): Promise<LessonDoc[]> {
  const snap = await getDocs(query(collection(db!, COLLECTIONS.lessons), orderBy("order")));
  return snap.docs.map((docSnap) => docSnap.data() as LessonDoc);
}

function progressDocId(uid: string, date: string): string {
  return `${uid}_${date}`;
}

export function subscribeToLessonProgress(
  uid: string,
  date: string,
  callback: (progress: DailyLessonProgressDoc | null) => void,
): () => void {
  const ref = doc(db!, COLLECTIONS.dailyLessonProgress, progressDocId(uid, date));
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as DailyLessonProgressDoc) : null);
  });
}

export interface CompleteLessonResult {
  limitReached: boolean;
  completedLessonIds: string[];
  xpEarned: number;
  newXp: number;
  newLevel: number;
}

/**
 * Records a lesson completion for `uid` "today" (in `timeZone`) and awards
 * its XP. Free-tier users are capped at FREE_DAILY_LESSON_LIMIT per day —
 * enforced here as a quick client-side check for a clean result, but the
 * real gate is the daily_lesson_progress update rule in firestore.rules:
 * if a client bypassed this check and tried anyway, that rule rejects the
 * whole transaction (including the XP award and check-in), so the limit
 * holds even against a client that isn't using this function honestly.
 *
 * A lesson is the app's daily practice, so completing one also counts as
 * today's streak check-in (via the same computeStreakUpdate the manual
 * "Check in today" button uses) — otherwise the streak/plant visual never
 * moves for a user who only ever does lessons.
 */
export async function completeLesson(
  uid: string,
  timeZone: string,
  lesson: LessonDoc,
): Promise<CompleteLessonResult> {
  const today = dateKeyInTimeZone(new Date(), timeZone);
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
    const user = userSnap.exists() ? (userSnap.data() as UserDoc) : undefined;
    const tier = user?.tier ?? "free";
    const prevXp = user?.xp ?? 0;
    const prevLevel = user?.level ?? 1;

    if (tier !== "premium" && completedLessonIds.length >= FREE_DAILY_LESSON_LIMIT) {
      return {
        limitReached: true,
        completedLessonIds,
        xpEarned: 0,
        newXp: prevXp,
        newLevel: prevLevel,
      };
    }

    const nextCompletedLessonIds = [...completedLessonIds, lesson.id];
    const progressFields = {
      userId: uid,
      date: today,
      completedLessonIds: nextCompletedLessonIds,
      updatedAt: serverTimestamp(),
    };
    if (progressSnap.exists()) {
      tx.update(progressRef, progressFields);
    } else {
      tx.set(progressRef, progressFields);
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
      lessonId: lesson.id,
      type: "lesson",
      date: today,
      completedAt: serverTimestamp(),
      xpEarned: lesson.xpReward,
      notes: null,
    });

    const streakXp = streakUpdate.alreadyCheckedInToday ? 0 : CHECK_IN_XP;
    const newXp = prevXp + lesson.xpReward + streakXp;
    const newLevel = levelFromXp(newXp);
    tx.update(userRef, { xp: newXp, level: newLevel });

    return {
      limitReached: false,
      completedLessonIds: nextCompletedLessonIds,
      xpEarned: lesson.xpReward + streakXp,
      newXp,
      newLevel,
    };
  });
}
