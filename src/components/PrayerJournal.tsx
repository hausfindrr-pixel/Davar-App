"use client";

import { useEffect, useRef, useState } from "react";
import { submitPrayer, subscribeToPrayers } from "@/lib/db/prayers";
import { dailyPrayerLimit, type PrayerDoc } from "@/types/firestore";

type PrayerJournalProps = {
  uid: string;
  timeZone: string;
  isPremium: boolean;
  /** Prayers submitted today — its own cap, separate from The Path's event
   * completions (see dailyPrayerLimit). */
  todayPrayerCount: number;
  /** Visually hidden (not unmounted, so an in-progress draft survives)
   * while a lesson's guided flow is open — see PathTab. */
  hidden?: boolean;
  /** Set when a lesson's "Pray about this" button was tapped — pre-fills
   * the draft with that lesson as context and focuses here. `nonce` lets
   * the same lesson be requested twice in a row and still re-trigger
   * (object/value identity, not just the title). Consumed once via
   * onPrefillConsumed. */
  prefillRequest?: { title: string; nonce: number } | null;
  onPrefillConsumed?: () => void;
};

function formatPrayerDate(timestamp: PrayerDoc["createdAt"]): string {
  return timestamp
    ? timestamp.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
}

/** A place to write a free-text prayer, alongside the guided ones in The
 * Path's lesson tracks. Submitting awards XP the same way completing a
 * lesson does (see submitPrayer, src/lib/db/prayers.ts) — same streak/
 * check-in mechanics, but its own daily cap (dailyPrayerLimit): 3/day
 * free, 15/day premium, separate from The Path's event-completion cap. */
export function PrayerJournal({
  uid,
  timeZone,
  isPremium,
  todayPrayerCount,
  hidden = false,
  prefillRequest = null,
  onPrefillConsumed,
}: PrayerJournalProps) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpFlash, setXpFlash] = useState<number | null>(null);
  const [prayers, setPrayers] = useState<PrayerDoc[]>([]);
  const [showPast, setShowPast] = useState(false);
  // Which prefillRequest (by nonce) has already been applied — same
  // "adjust state during render" pattern as PathEventList's focusRequest
  // handling, so a repeat "Pray about this" tap on the same lesson still
  // re-fills/re-focuses rather than being a no-op on an unchanged prop.
  const [handledNonce, setHandledNonce] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const limit = dailyPrayerLimit(isPremium ? "premium" : "free");
  const atLimit = todayPrayerCount >= limit;

  useEffect(() => {
    return subscribeToPrayers(uid, setPrayers);
  }, [uid]);

  if (prefillRequest && prefillRequest.nonce !== handledNonce) {
    setHandledNonce(prefillRequest.nonce);
    setDraft((prev) => prev || `Lord, about "${prefillRequest.title}" — `);
  }

  // Scroll/focus are DOM side effects, not state — kept in an effect
  // (keyed on the now-handled nonce) rather than the render body above.
  useEffect(() => {
    if (handledNonce === null) return;
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    textareaRef.current?.focus();
    onPrefillConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handledNonce]);

  async function handleSubmit() {
    const text = draft.trim();
    if (!text || submitting || atLimit) return;
    setSubmitting(true);
    setError(null);
    setXpFlash(null);
    try {
      const result = await submitPrayer(uid, timeZone, text);
      if (result.limitReached) {
        setError(`You've written all ${limit} prayers for today.`);
        return;
      }
      setDraft("");
      setXpFlash(result.xpEarned);
      setTimeout(() => setXpFlash(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that prayer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      ref={sectionRef}
      className={`w-full max-w-sm flex-col gap-3 ${hidden ? "hidden" : "flex"}`}
    >
      <h2 className="text-sm font-medium text-ink px-1">Your Own Words</h2>

      <div className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-3">
        <p className="text-xs text-stone leading-relaxed">
          Write a prayer in your own words — no template, just what&apos;s actually on
          your heart today.
        </p>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Lord, today I..."
          rows={4}
          disabled={submitting || atLimit}
          className="w-full rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink placeholder:text-stone/70 resize-none disabled:opacity-70"
        />
        {atLimit ? (
          <p className="text-xs text-stone">
            You&apos;ve written all {limit} prayers for today.{" "}
            {isPremium ? "Come back tomorrow." : "Upgrade to Premium for 15 a day."}
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={submitting || !draft.trim()}
              onClick={() => void handleSubmit()}
              className="rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Submit prayer"}
            </button>
            {xpFlash !== null && <span className="text-xs text-sage-700">+{xpFlash} XP</span>}
            {error && <span className="text-xs text-clay-700">{error}</span>}
          </div>
        )}
      </div>

      {prayers.length > 0 && (
        <div className="rounded-2xl bg-paper border border-mist overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-left"
          >
            <span className="text-sm font-medium text-ink">
              My Prayers ({prayers.length})
            </span>
            <span className="text-stone text-xs shrink-0">{showPast ? "–" : "+"}</span>
          </button>
          {showPast && (
            <div className="max-h-64 overflow-y-auto flex flex-col gap-2.5 px-5 pb-5">
              {prayers.map((prayer) => (
                <div key={prayer.id} className="border-t border-mist pt-2.5 first:border-t-0 first:pt-0">
                  <span className="text-[11px] text-stone">{formatPrayerDate(prayer.createdAt)}</span>
                  <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">{prayer.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
