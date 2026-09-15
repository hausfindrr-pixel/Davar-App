import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type AccountabilityLinkDoc, type CheckInDoc } from "@/types/firestore";

/** A user's most recent check-ins (lessons, streak check-ins, etc.), newest
 * first — real history from check_ins, not placeholder data. Sorted and
 * capped client-side (rather than orderBy+limit in the query) so this
 * doesn't need a composite Firestore index deployed to work. */
export function subscribeToCheckInHistory(
  uid: string,
  count: number,
  callback: (checkIns: CheckInDoc[]) => void,
): () => void {
  const q = query(collection(db!, COLLECTIONS.checkIns), where("userId", "==", uid));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((docSnap) => docSnap.data() as CheckInDoc);
    all.sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());
    callback(all.slice(0, count));
  });
}

/**
 * A user's accountability link, if any — they could be on either side of
 * it (`userId` the one who set it up, or `partnerId` the one matched to
 * them), so this merges two listeners into one callback. Matching itself
 * (finding and proposing a partner) isn't built yet; this only reads/shows
 * a link once one exists.
 */
export function subscribeToAccountabilityLink(
  uid: string,
  callback: (link: AccountabilityLinkDoc | null) => void,
): () => void {
  let asInitiator: AccountabilityLinkDoc | null = null;
  let asPartner: AccountabilityLinkDoc | null = null;

  function emit() {
    callback(asInitiator ?? asPartner ?? null);
  }

  const unsubA = onSnapshot(
    query(collection(db!, COLLECTIONS.accountabilityLinks), where("userId", "==", uid)),
    (snap) => {
      asInitiator = snap.empty ? null : (snap.docs[0].data() as AccountabilityLinkDoc);
      emit();
    },
  );
  const unsubB = onSnapshot(
    query(collection(db!, COLLECTIONS.accountabilityLinks), where("partnerId", "==", uid)),
    (snap) => {
      asPartner = snap.empty ? null : (snap.docs[0].data() as AccountabilityLinkDoc);
      emit();
    },
  );

  return () => {
    unsubA();
    unsubB();
  };
}
