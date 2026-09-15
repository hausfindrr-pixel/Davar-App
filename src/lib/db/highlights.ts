import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type HighlightColor, type UserHighlightDoc } from "@/types/firestore";

function highlightDocId(uid: string, book: string, chapter: number, verse: number): string {
  return `${uid}_${book}_${chapter}_${verse}`;
}

/** Live list of a user's highlights, across every book/chapter they've read. */
export function subscribeToHighlights(
  uid: string,
  callback: (highlights: UserHighlightDoc[]) => void,
): () => void {
  const q = query(collection(db!, COLLECTIONS.userHighlights), where("userId", "==", uid));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((docSnap) => docSnap.data() as UserHighlightDoc));
  });
}

/** Highlights (or re-colors) a verse — one highlight per user per verse. */
export async function highlightVerse(
  uid: string,
  reference: string,
  book: string,
  chapter: number,
  verse: number,
  color: HighlightColor,
): Promise<void> {
  const ref = doc(db!, COLLECTIONS.userHighlights, highlightDocId(uid, book, chapter, verse));
  await setDoc(ref, {
    id: ref.id,
    userId: uid,
    reference,
    book,
    chapter,
    verse,
    color,
    createdAt: serverTimestamp(),
  });
}

export async function removeHighlight(
  uid: string,
  book: string,
  chapter: number,
  verse: number,
): Promise<void> {
  const ref = doc(db!, COLLECTIONS.userHighlights, highlightDocId(uid, book, chapter, verse));
  await deleteDoc(ref);
}
