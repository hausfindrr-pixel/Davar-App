import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { dateKeyInTimeZone } from "@/lib/date";
import { computeStreakUpdate } from "@/lib/streak";
import { CHECK_IN_XP, levelFromXp } from "@/lib/xp";
import {
  COLLECTIONS,
  dailyEventLimit,
  type DailyLessonProgressDoc,
  type LessonDoc,
  type StreakDoc,
  type UserDoc,
  type VerseBlank,
} from "@/types/firestore";

function isValidVerseBlank(value: unknown): value is VerseBlank {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.reference === "string" &&
    typeof v.template === "string" &&
    Array.isArray(v.answers) &&
    v.answers.length > 0 &&
    v.answers.every((a) => typeof a === "string")
  );
}

/**
 * Firestore returns `unknown` data with no runtime shape guarantee — a
 * lesson doc still seeded under an older schema (missing `summary` or
 * `verseActivity`, e.g. before the verse-activity rewrite) would otherwise
 * pass straight through an unchecked `as LessonDoc` cast and crash
 * FillBlankCard the moment its card is opened (it reads
 * `verseActivity.verses` unconditionally). This is the boundary where that
 * gets caught instead.
 */
function isValidLessonDoc(data: unknown): data is LessonDoc {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (typeof d.id !== "string" || typeof d.title !== "string" || typeof d.summary !== "string") {
    return false;
  }
  const activity = d.verseActivity as Record<string, unknown> | undefined;
  return (
    typeof activity === "object" &&
    activity !== null &&
    Array.isArray(activity.verses) &&
    activity.verses.length > 0 &&
    activity.verses.every(isValidVerseBlank) &&
    Array.isArray(activity.wordBank)
  );
}

/** All lessons, ordered for display. Only called for a signed-in user.
 * Silently drops any doc that doesn't match the current LessonDoc shape
 * (see isValidLessonDoc) rather than returning it and letting a later
 * render crash — a lesson stuck on an old schema (not yet re-seeded via
 * `npm run seed:lessons`) just doesn't appear until it's fixed, the same
 * way "no lessons yet" is already handled when the collection is empty. */
export async function fetchLessons(): Promise<LessonDoc[]> {
  const snap = await getDocs(query(collection(db!, COLLECTIONS.lessons), orderBy("order")));
  const lessons: LessonDoc[] = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (isValidLessonDoc(data)) {
      lessons.push(data);
    } else {
      console.error(
        `Skipping malformed lesson doc "${docSnap.id}" — missing or invalid summary/verseActivity. Run npm run seed:lessons to migrate it.`,
      );
    }
  }
  return lessons;
}

function progressDocId(uid: string, date: string): string {
  return `${uid}_${date}`;
}

/**
 * Every lesson `uid` has EVER completed, across all of their
 * daily_lesson_progress docs (one per calendar day) — not just today's. The
 * Path's gating (roadmapNodeStates, flattenPathEvents, nextEventForFreeTier
 * — src/lib/roadmap.ts) needs this all-time set, not the day-scoped one
 * subscribeToLessonProgress returns, since a lesson completed yesterday
 * should still count as done today. Allowed by the existing
 * daily_lesson_progress read rule (`resource.data.userId ==
 * request.auth.uid`), which covers this query the same as a single-doc get.
 */
export async function fetchAllCompletedLessonIds(uid: string): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db!, COLLECTIONS.dailyLessonProgress), where("userId", "==", uid)),
  );
  const ids = new Set<string>();
  for (const docSnap of snap.docs) {
    const progress = docSnap.data() as DailyLessonProgressDoc;
    for (const id of progress.completedLessonIds) ids.add(id);
  }
  return [...ids];
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
 * its XP. Users are capped at dailyEventLimit(tier) lesson completions per
 * day — a separate cap from the prayer journal's submissions (see
 * submitPrayer, src/lib/db/prayers.ts) — enforced here as a quick
 * client-side check for a clean result, but the real gate is the
 * daily_lesson_progress update rule in firestore.rules: if a client
 * bypassed this check and tried anyway, that rule rejects the whole
 * transaction (including the XP award and check-in), so the limit holds
 * even against a client that isn't using this function honestly.
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

    if (completedLessonIds.length >= dailyEventLimit(tier)) {
      return {
        limitReached: true,
        completedLessonIds,
        xpEarned: 0,
        newXp: prevXp,
        newLevel: prevLevel,
      };
    }

    const nextCompletedLessonIds = [...completedLessonIds, lesson.id];
    if (progressSnap.exists()) {
      tx.update(progressRef, {
        userId: uid,
        date: today,
        completedLessonIds: nextCompletedLessonIds,
        updatedAt: serverTimestamp(),
      });
    } else {
      tx.set(progressRef, {
        userId: uid,
        date: today,
        completedLessonIds: nextCompletedLessonIds,
        prayerCount: 0,
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
