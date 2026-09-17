"use client";

import { useEffect, useState } from "react";
import { submitPrayer, subscribeToPrayers } from "@/lib/db/prayers";
import { dailyActivityLimit, type PrayerDoc } from "@/types/firestore";

type PrayerJournalProps = {
  uid: string;
  timeZone: string;
  isPremium: boolean;
  /** Lessons completed + prayers submitted today, combined — the same
   * count The Path's lesson cap uses (see dailyActivityLimit). */
  todayActivityCount: number;
};

function formatPrayerDate(timestamp: PrayerDoc["createdAt"]): string {
  return timestamp
    ? timestamp.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
}

/** A place to write a free-text prayer, alongside the guided ones in The
 * Path's lesson tracks. Submitting awards XP the same way completing a
 * lesson does (see submitPrayer, src/lib/db/prayers.ts) — same streak/
 * check-in mechanics, and shares the same daily activity cap as lessons
 * (dailyActivityLimit): 3/day free, 15/day premium, combined with lesson
 * completions. */
export function PrayerJournal({ uid, timeZone, isPremium, todayActivityCount }: PrayerJournalProps) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpFlash, setXpFlash] = useState<number | null>(null);
  const [prayers, setPrayers] = useState<PrayerDoc[]>([]);
  const [showPast, setShowPast] = useState(false);

  const limit = dailyActivityLimit(isPremium ? "premium" : "free");
  const atLimit = todayActivityCount >= limit;

  useEffect(() => {
    return subscribeToPrayers(uid, setPrayers);
  }, [uid]);

  async function handleSubmit() {
    const text = draft.trim();
    if (!text || submitting || atLimit) return;
    setSubmitting(true);
    setError(null);
    setXpFlash(null);
    try {
      const result = await submitPrayer(uid, timeZone, text);
      if (result.limitReached) {
        setError(`You've used all ${limit} actions today across lessons and prayers.`);
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
    <section className="w-full max-w-sm flex flex-col gap-3">
      <h2 className="text-sm font-medium text-ink px-1">Your Own Words</h2>

      <div className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-3">
        <p className="text-xs text-stone leading-relaxed">
          Write a prayer in your own words — no template, just what&apos;s actually on
          your heart today.
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Lord, today I..."
          rows={4}
          disabled={submitting || atLimit}
          className="w-full rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink placeholder:text-stone/70 resize-none disabled:opacity-70"
        />
        {atLimit ? (
          <p className="text-xs text-stone">
            You&apos;ve used all {limit} actions today across lessons and prayers.{" "}
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
