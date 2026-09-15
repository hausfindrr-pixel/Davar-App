"use client";

import { useEffect, useRef, useState } from "react";
import { ApostleAvatar } from "@/components/ApostleAvatar";
import { SendIcon } from "@/components/icons";
import { blurredPreviewClass, UnlockCard } from "@/components/PremiumGate";
import { APOSTLES } from "@/lib/apostles";
import { subscribeToConversation } from "@/lib/db/conversations";
import { dateKeyInTimeZone } from "@/lib/date";
import { sendWatchChatMessage } from "@/lib/watch-chat";
import type { ConversationMessageDoc } from "@/types/firestore";

type WatchTabProps = {
  uid: string;
  isPremium: boolean;
  today: string;
  timeZone: string;
  getIdToken: () => Promise<string>;
};

const OPENING_LINE = "Tell me what's on your mind today.";

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-clay-600 text-paper px-4 py-2.5 text-sm leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function ApostleBubble({ apostleId, name, text }: { apostleId: keyof typeof APOSTLES; name: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <ApostleAvatar apostleId={apostleId} size="sm" />
      <div className="max-w-[80%] flex flex-col gap-1">
        <span className="text-xs font-medium text-stone px-1">{name}</span>
        <div className="rounded-2xl rounded-bl-md bg-paper border border-mist text-ink px-4 py-2.5 text-sm leading-relaxed">
          {text}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ConversationMessageDoc }) {
  if (message.role === "user") return <UserBubble text={message.text} />;
  // Deliberately no special styling for a limitReached message — it's the
  // same warm bubble as any other reply from this apostle, not an error
  // banner, so the daily close reads as part of the conversation.
  const apostle = APOSTLES[message.apostleId ?? "peter"];
  return <ApostleBubble apostleId={apostle.id} name={apostle.name} text={message.text} />;
}

/** The real chat interface, shown to Premium users. Firestore is the single
 * source of truth for messages (see src/lib/db/conversations.ts) — sending
 * only kicks off the API call; the reply arrives back through the live
 * subscription, not through the fetch response. */
function ChatInterface({
  uid,
  today,
  timeZone,
  getIdToken,
}: {
  uid: string;
  today: string;
  timeZone: string;
  getIdToken: () => Promise<string>;
}) {
  const [messages, setMessages] = useState<ConversationMessageDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeToConversation(uid, (msgs) => {
      setMessages(msgs);
      setLoaded(true);
    });
  }, [uid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setDraft("");
    try {
      const idToken = await getIdToken();
      await sendWatchChatMessage(text, today, idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send that message.");
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  // The closing message (see pickClosingMessage in src/lib/chat-apostle.ts)
  // is a normal, persisted assistant message — reading it back off the
  // last message in history (rather than a separate usage-counter read)
  // means the input stays disabled across a reload, and re-enables itself
  // naturally once a new calendar day's first message arrives.
  const lastMessage = messages[messages.length - 1];
  const dailyLimitReached =
    !!lastMessage?.limitReached && dateKeyInTimeZone(lastMessage.createdAt.toDate(), timeZone) === today;
  const closingApostleName = APOSTLES[lastMessage?.apostleId ?? "peter"].name;

  return (
    <div className="w-full max-w-sm flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 py-2">
        {!loaded ? (
          <p className="text-xs text-stone text-center py-4">Loading…</p>
        ) : messages.length === 0 ? (
          <ApostleBubble apostleId="peter" name="Peter" text={OPENING_LINE} />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        {sending && (
          <div className="flex items-start gap-2">
            <ApostleAvatar apostleId="peter" size="sm" />
            <div className="rounded-2xl rounded-bl-md bg-paper border border-mist text-stone px-4 py-2.5 text-sm italic">
              …
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-xs text-clay-700 px-1 pb-1">{error}</p>}

      {dailyLimitReached ? (
        <div className="flex items-center justify-center pt-2 border-t border-mist shrink-0">
          <p className="text-xs text-stone italic py-2.5">{closingApostleName} will be back tomorrow.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-2 border-t border-mist shrink-0">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Tell Peter what's on your mind…"
            disabled={sending}
            className="flex-1 rounded-full border border-mist bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-stone/70 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !draft.trim()}
            aria-label="Send"
            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-clay-600 text-paper disabled:opacity-50 disabled:cursor-not-allowed hover:bg-clay-700 transition-colors"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** A blurred, illustrative preview of the chat concept for free users — the
 * conversation itself isn't real (no Firestore, no API calls), just static
 * markup that shows what's behind the Premium gate. */
function TeaserChat() {
  return (
    <div className={`w-full max-w-sm flex flex-col gap-3 ${blurredPreviewClass}`}>
      <ApostleBubble apostleId="peter" name="Peter" text="Tell me what's on your mind today." />
      <UserBubble text="I fell into it again today." />
      <ApostleBubble
        apostleId="john"
        name="John"
        text="I'm glad you told me — that took courage, and grace is already here."
      />
    </div>
  );
}

/** Peter's Watch — an AI-guided conversational accountability companion.
 * Free tier: a blurred teaser of the chat concept. Premium: a real chat,
 * backed by Claude and Firestore, where Peter is the default voice but
 * Thomas or John may answer instead depending on what the user shares (see
 * src/lib/chat-apostle.ts). Capped at WATCH_CHAT_DAILY_LIMIT messages/day;
 * hitting it closes the conversation in-character rather than erroring. */
export function WatchTab({ uid, isPremium, today, timeZone, getIdToken }: WatchTabProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center gap-4 p-6">
      <div className="text-center max-w-sm shrink-0">
        <h1 className="text-lg font-semibold text-ink">Peter&apos;s Watch</h1>
        <p className="mt-1 text-xs text-stone leading-relaxed">
          A place to be honest — with a companion who knows what it is to
          fall, and to be restored.
        </p>
      </div>

      {isPremium ? (
        <ChatInterface uid={uid} today={today} timeZone={timeZone} getIdToken={getIdToken} />
      ) : (
        <>
          <UnlockCard
            title="Unlock Peter's Watch"
            description="Talk it through with Peter, John, and Thomas — an AI-guided conversation that meets you honestly and always points back to grace."
            getIdToken={getIdToken}
          />
          <TeaserChat />
        </>
      )}
    </div>
  );
}
