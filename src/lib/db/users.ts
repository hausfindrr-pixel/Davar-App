import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type UserDoc } from "@/types/firestore";

/**
 * Creates users/{uid} on first sign-in; no-ops if it already exists. Only
 * called with a real signed-in `user`, which implies Firebase was
 * configured when auth initialized — so `db` is guaranteed to be set here.
 */
export async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db!, COLLECTIONS.users, user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    xp: 0,
    level: 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToUser(
  uid: string,
  callback: (user: UserDoc | null) => void,
): () => void {
  const ref = doc(db!, COLLECTIONS.users, uid);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as UserDoc) : null);
  });
}
