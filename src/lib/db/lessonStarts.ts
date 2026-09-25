import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/types/firestore";

/**
 * Records that `uid` opened `lessonId`'s intro screen — see LessonStartDoc,
 * src/types/firestore.ts. Idempotent (docId "{uid}_{lessonId}"): reopening
 * the same lesson just overwrites the same doc rather than creating a
 * duplicate, so this counts unique attempts, not opens. Fire-and-forget
 * from LessonFlow — a failure here only weakens an admin-only analytics
 * number, never anything the user sees, so it's never awaited or surfaced.
 */
export async function recordLessonStart(uid: string, lessonId: string): Promise<void> {
  const ref = doc(db!, COLLECTIONS.lessonStarts, `${uid}_${lessonId}`);
  await setDoc(ref, { uid, lessonId, updatedAt: serverTimestamp() });
}
