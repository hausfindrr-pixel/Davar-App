import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
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
    avatarId: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    tier: "free",
    premiumSince: null,
    premiumUntil: null,
    planId: null,
    premiumNudgeLastShownDate: null,
    premiumNudgeLastShownCompletedCount: null,
    premiumNudgeLastTappedDate: null,
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

/** Updates a user's own display name and/or chosen avatar preset. Every
 * other field on users/{uid} is either set at creation or (tier/
 * premiumSince/premiumUntil/planId) locked to Admin SDK writes only — see
 * the `users` rule in firestore.rules — these are the only ones a client
 * can freely change. */
export async function updateUserProfile(
  uid: string,
  fields: { displayName?: string; avatarId?: string | null },
): Promise<void> {
  await updateDoc(doc(db!, COLLECTIONS.users, uid), fields);
}

/** Records that the passive premium nudge (LessonFlow's resolution
 * screen — see shouldShowPremiumNudge, src/lib/premiumNudge.ts) was just
 * shown, so it doesn't re-appear until the next eligible lesson. */
export async function recordPremiumNudgeShown(
  uid: string,
  date: string,
  completedCount: number,
): Promise<void> {
  await updateDoc(doc(db!, COLLECTIONS.users, uid), {
    premiumNudgeLastShownDate: date,
    premiumNudgeLastShownCompletedCount: completedCount,
  });
}

/** Records that the user tapped the nudge (and, implicitly, didn't
 * upgrade — if they had, `tier` would already be "premium" and the nudge
 * would stop showing regardless) — the stronger week-long cooldown. */
export async function recordPremiumNudgeTapped(uid: string, date: string): Promise<void> {
  await updateDoc(doc(db!, COLLECTIONS.users, uid), { premiumNudgeLastTappedDate: date });
}
