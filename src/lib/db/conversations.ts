import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS, type ConversationMessageDoc } from "@/types/firestore";

/** Peter's Watch chat history for a user, oldest first. Read-only from the
 * client (see firestore.rules) — writes only happen via /api/watch-chat. */
export function subscribeToConversation(
  uid: string,
  callback: (messages: ConversationMessageDoc[]) => void,
): () => void {
  const q = query(
    collection(db!, COLLECTIONS.conversations, uid, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((docSnap) => docSnap.data() as ConversationMessageDoc));
  });
}
