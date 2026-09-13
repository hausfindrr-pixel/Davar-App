import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type LessonDoc } from "@/types/firestore";

/** All lessons, ordered for display. Only called for a signed-in user. */
export async function fetchLessons(): Promise<LessonDoc[]> {
  const snap = await getDocs(query(collection(db!, COLLECTIONS.lessons), orderBy("order")));
  return snap.docs.map((docSnap) => docSnap.data() as LessonDoc);
}
