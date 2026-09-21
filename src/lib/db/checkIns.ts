import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type CheckInDoc } from "@/types/firestore";

/**
 * Every "lesson" check-in `uid` has ever earned — one per completed
 * lesson (see completeLesson, src/lib/db/lessons.ts), each carrying the
 * `lessonId` and the `date` it was completed. Matthew's Ledger uses this
 * as the source of truth for "date completed" (not a lesson answer's own
 * `createdAt`, which gets overwritten if the answer is later revised —
 * see saveLessonAnswer, src/lib/db/lessonAnswers.ts).
 *
 * Filters to `type == "lesson"` client-side rather than in the query
 * (same pattern as fetchAllCompletedLessonIds, src/lib/db/lessons.ts) so
 * this only ever needs the single `userId` equality index that's already
 * proven out, no composite index to provision.
 */
export async function fetchLessonCheckIns(uid: string): Promise<CheckInDoc[]> {
  const snap = await getDocs(
    query(collection(db!, COLLECTIONS.checkIns), where("userId", "==", uid)),
  );
  const checkIns: CheckInDoc[] = [];
  for (const docSnap of snap.docs) {
    const checkIn = docSnap.data() as CheckInDoc;
    if (checkIn.type === "lesson") checkIns.push(checkIn);
  }
  return checkIns;
}
