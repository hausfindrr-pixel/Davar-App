import Anthropic from "@anthropic-ai/sdk";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { CRISIS_RESPONSE, isCrisisMessage, routeApostle, systemPromptFor } from "@/lib/chat-apostle";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, type ChatRole } from "@/types/firestore";
import type { ApostleId } from "@/lib/apostles";

// Needs the Admin SDK — not compatible with the edge runtime.
export const runtime = "nodejs";

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 20;

interface StoredMessage {
  role: ChatRole;
  apostleId: ApostleId | null;
  text: string;
}

async function writeMessage(uid: string, message: StoredMessage) {
  const ref = adminDb().collection(COLLECTIONS.conversations).doc(uid).collection("messages").doc();
  await ref.set({
    id: ref.id,
    role: message.role,
    apostleId: message.apostleId,
    text: message.text,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "Your session has expired — sign in again." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Say something first." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "That message is too long." }, { status: 400 });
  }

  // Defense in depth — the UI already gates this tab behind Premium, but
  // enforce it server-side too, the same way daily_lesson_progress's rules
  // don't just trust the client.
  const userSnap = await adminDb().collection(COLLECTIONS.users).doc(uid).get();
  if (userSnap.data()?.tier !== "premium") {
    return NextResponse.json({ error: "Peter's Watch is a Premium feature." }, { status: 403 });
  }

  await writeMessage(uid, { role: "user", apostleId: null, text: message });

  // First-layer safety net: a deterministic crisis response never touches
  // the model at all, so it can't be softened, argued with, or missed by a
  // prompt-injection attempt buried in the user's message.
  if (isCrisisMessage(message)) {
    await writeMessage(uid, { role: "assistant", apostleId: "peter", text: CRISIS_RESPONSE });
    return NextResponse.json({ apostleId: "peter", message: CRISIS_RESPONSE, crisis: true });
  }

  const apostleId = routeApostle(message);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("watch-chat: ANTHROPIC_API_KEY is not configured");
    return NextResponse.json({ error: "Peter's Watch isn't configured yet." }, { status: 500 });
  }

  const historySnap = await adminDb()
    .collection(COLLECTIONS.conversations)
    .doc(uid)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(HISTORY_LIMIT)
    .get();

  const history = historySnap.docs
    .map((doc) => doc.data() as StoredMessage & { createdAt: unknown })
    .reverse();

  const client = new Anthropic({ apiKey });

  let reply: string;
  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 400,
      system: systemPromptFor(apostleId),
      messages: history.map((m) => ({
        role: m.role,
        content: m.text,
      })),
      output_config: { effort: "low" },
    });

    if (response.stop_reason === "refusal") {
      reply =
        "I don't have a good way to answer that one — but I'm still here, and I'd love to hear how you're really doing today.";
    } else {
      const textBlock = response.content.find((block) => block.type === "text");
      reply = textBlock?.text.trim() || "I'm here — tell me a bit more about what's going on?";
    }
  } catch (err) {
    console.error("watch-chat: Anthropic request failed", err);
    return NextResponse.json({ error: "Could not reach Peter right now — try again in a moment." }, { status: 502 });
  }

  await writeMessage(uid, { role: "assistant", apostleId, text: reply });

  return NextResponse.json({ apostleId, message: reply });
}
