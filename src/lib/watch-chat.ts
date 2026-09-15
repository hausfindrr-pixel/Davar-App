import type { ApostleId } from "@/lib/apostles";

type WatchChatReply = { apostleId: ApostleId; message: string; crisis?: boolean; limitReached?: boolean };

/** Sends a message to Peter's Watch and returns the apostle who replied.
 * The reply is already written to Firestore by the API route by the time
 * this resolves — the caller's Firestore subscription will pick it up on
 * its own; this return value just lets the UI stop its "typing" state.
 * `date` is the user's local "YYYY-MM-DD" — the server-side daily message
 * limit resets on it, the same pattern as the lesson cap's `date` field. */
export async function sendWatchChatMessage(
  message: string,
  date: string,
  idToken: string,
): Promise<WatchChatReply> {
  const res = await fetch("/api/watch-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ message, date }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? "Could not send that message.");
  }
  return data as WatchChatReply;
}
