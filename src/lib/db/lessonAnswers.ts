import { collection, deleteDoc, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type LessonAnswerDoc } from "@/types/firestore";

const MAX_ANSWER_LENGTH = 2000;

/**
 * Saves a user's free-text answer to a lesson's scenario screen — no
 * right/wrong, just preserved (see LessonAnswerDoc, src/types/firestore.ts).
 * docId is "{lessonId}_{screenId}" and the write is a `setDoc` (not a
 * transaction, unlike completeLesson/submitPrayer) since there's no cap or
 * derived state riding along — writing again (e.g. after using the lesson
 * flow's back-navigation to revise an answer) just overwrites the same doc.
 */
export async function saveLessonAnswer(
  uid: string,
  lessonId: string,
  screenId: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write something before continuing.");
  if (trimmed.length > MAX_ANSWER_LENGTH) throw new Error("That answer is too long.");

  const answerId = `${lessonId}_${screenId}`;
  const ref = doc(db!, COLLECTIONS.users, uid, "lessonAnswers", answerId);
  await setDoc(ref, {
    id: answerId,
    lessonId,
    screenId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}

/** Every scenario/short-answer response `uid` has ever saved, across every
 * lesson — Matthew's Ledger groups these by lesson (via `lessonId`) and
 * joins them with each lesson's completion date (see
 * src/lib/db/checkIns.ts) and screen prompts (from the already-loaded
 * `lessons` list) rather than storing any of that again here. */
export async function fetchLessonAnswers(uid: string): Promise<LessonAnswerDoc[]> {
  const snap = await getDocs(collection(db!, COLLECTIONS.users, uid, "lessonAnswers"));
  return snap.docs.map((docSnap) => docSnap.data() as LessonAnswerDoc);
}

/** Deletes one saved answer — Matthew's Ledger's per-entry delete. Removes
 * only the written text; the lesson's completion record (check_ins) and
 * any streak credit it earned are untouched (see firestore.rules). */
export async function deleteLessonAnswer(
  uid: string,
  lessonId: string,
  screenId: string,
): Promise<void> {
  const answerId = `${lessonId}_${screenId}`;
  await deleteDoc(doc(db!, COLLECTIONS.users, uid, "lessonAnswers", answerId));
}
