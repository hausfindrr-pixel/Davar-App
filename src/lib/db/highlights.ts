import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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

/** Highlights (or re-colors) a verse — one highlight per user per verse.
 * `text` is stored alongside it so Profile's highlight list doesn't need to
 * re-fetch verse text later. */
export async function highlightVerse(
  uid: string,
  reference: string,
  book: string,
  chapter: number,
  verse: number,
  text: string,
  color: HighlightColor,
): Promise<void> {
  const ref = doc(db!, COLLECTIONS.userHighlights, highlightDocId(uid, book, chapter, verse));
  await setDoc(
    ref,
    {
      id: ref.id,
      userId: uid,
      reference,
      book,
      chapter,
      verse,
      text,
      color,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
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

/** Saves (or clears, with an empty string) a personal note on an existing
 * highlight. Doesn't touch book/chapter/verse, so it's always an "update"
 * under firestore.rules, never re-derives the docId. */
export async function updateHighlightNote(
  uid: string,
  book: string,
  chapter: number,
  verse: number,
  notes: string,
): Promise<void> {
  const ref = doc(db!, COLLECTIONS.userHighlights, highlightDocId(uid, book, chapter, verse));
  await updateDoc(ref, { notes: notes.trim() || null });
}
