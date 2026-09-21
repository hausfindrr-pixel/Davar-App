import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/firestore";

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
