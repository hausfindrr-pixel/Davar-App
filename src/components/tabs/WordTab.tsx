"use client";

import { useEffect, useMemo, useState } from "react";
import { BIBLE_BOOKS, fetchChapter, type BibleVerse } from "@/lib/bible";
import { highlightVerse, removeHighlight, subscribeToHighlights } from "@/lib/db/highlights";
import type { HighlightColor, UserHighlightDoc } from "@/types/firestore";

type WordTabProps = {
  uid: string;
};

const HIGHLIGHT_LABEL: Record<HighlightColor, string> = {
  clay: "Clay",
  sage: "Sage",
  stone: "Stone",
};

const HIGHLIGHT_SWATCH: Record<HighlightColor, string> = {
  clay: "bg-clay-400",
  sage: "bg-sage-400",
  stone: "bg-stone",
};

const HIGHLIGHT_BG: Record<HighlightColor, string> = {
  clay: "bg-clay-50",
  sage: "bg-sage-50",
  stone: "bg-mist",
};

const HIGHLIGHT_COLORS: HighlightColor[] = ["clay", "sage", "stone"];

/** The Word — a general Bible reader, free for everyone. Verse text comes
 * from /api/bible (a server-side proxy over bible-api.com's public-domain
 * WEB translation, see that route). Tap a verse to highlight it in one of
 * three colors; highlights are saved per-user in Firestore
 * (user_highlights) and reload with the chapter.
 *
 * Every highlight write is user-visibly acknowledged (a brief "Saving…"
 * state, then either the highlight sticks or a clear error shows) rather
 * than assumed to succeed — a write that's silently rejected (e.g.
 * firestore.rules not yet deployed for this collection) previously looked
 * identical to one that worked, which is exactly what made highlighting
 * feel unreliable.
 */
export function WordTab({ uid }: WordTabProps) {
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(3);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<UserHighlightDoc[]>([]);
  const [openVerse, setOpenVerse] = useState<number | null>(null);
  const [savingVerse, setSavingVerse] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const bookInfo = BIBLE_BOOKS.find((b) => b.name === book) ?? BIBLE_BOOKS[0];

  useEffect(() => {
    return subscribeToHighlights(uid, setHighlights);
  }, [uid]);

  useEffect(() => {
    let cancelled = false;
    // Resetting loading/error/selection state for the chapter this effect
    // is about to fetch — synchronizing UI with the start of that fetch,
    // not a derived-state anti-pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(null);
    setOpenVerse(null);
    fetchChapter(book, chapter)
      .then((data) => {
        if (!cancelled) setVerses(data.verses);
      })
      .catch((err) => {
        if (!cancelled) {
          setVerses([]);
          setLoadError(err instanceof Error ? err.message : "Could not load that chapter.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  const highlightsInChapter = useMemo(() => {
    const map = new Map<number, UserHighlightDoc>();
    for (const h of highlights) {
      if (h.book === book && h.chapter === chapter) map.set(h.verse, h);
    }
    return map;
  }, [highlights, book, chapter]);

  function handleBookChange(name: string) {
    setBook(name);
    setChapter(1);
  }

  function toggleVerse(verseNumber: number) {
    setSaveError(null);
    setOpenVerse(openVerse === verseNumber ? null : verseNumber);
  }

  async function handlePickColor(verse: BibleVerse, color: HighlightColor) {
    const reference = `${book} ${chapter}:${verse.verse}`;
    setSaveError(null);
    setSavingVerse(verse.verse);
    try {
      await highlightVerse(uid, reference, book, chapter, verse.verse, verse.text, color);
      setOpenVerse(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save that highlight.");
    } finally {
      setSavingVerse(null);
    }
  }

  async function handleRemoveHighlight(verseNumber: number) {
    setSaveError(null);
    setSavingVerse(verseNumber);
    try {
      await removeHighlight(uid, book, chapter, verseNumber);
      setOpenVerse(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not remove that highlight.");
    } finally {
      setSavingVerse(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-4 p-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-ink">The Word</h1>
        <p className="mt-1 text-xs text-stone">Tap a verse to highlight it.</p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-4 flex flex-col gap-3">
        <p className="font-serif text-2xl text-ink text-center">
          {book} {chapter}
        </p>
        <div className="flex gap-2">
          <label className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-stone">Book</span>
            <select
              value={book}
              onChange={(e) => handleBookChange(e.target.value)}
              className="w-full rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink"
            >
              {BIBLE_BOOKS.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <label className="w-24 flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-stone">
              Chapter
            </span>
            <select
              value={chapter}
              onChange={(e) => setChapter(Number(e.target.value))}
              className="w-full rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink"
            >
              {Array.from({ length: bookInfo.chapters }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-5">
        {loading && <p className="text-sm text-stone">Loading…</p>}
        {loadError && <p className="text-sm text-clay-700">{loadError}</p>}
        {!loading &&
          !loadError &&
          verses.map((verse) => {
            const highlight = highlightsInChapter.get(verse.verse);
            const isOpen = openVerse === verse.verse;
            const isSaving = savingVerse === verse.verse;
            return (
              <div key={verse.verse} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => toggleVerse(verse.verse)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors flex gap-3 ${
                    highlight ? HIGHLIGHT_BG[highlight.color] : "hover:bg-mist/40"
                  }`}
                >
                  <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-mist text-[10px] font-semibold text-stone">
                    {verse.verse}
                  </span>
                  <span className="font-serif text-[17px] leading-8 text-ink/90">
                    {verse.text}
                  </span>
                </button>

                {isOpen && (
                  <div className="flex items-center gap-2 px-3 py-1">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        disabled={isSaving}
                        aria-label={`Highlight ${HIGHLIGHT_LABEL[color]}`}
                        onClick={() => void handlePickColor(verse, color)}
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                          highlight?.color === color
                            ? "border-clay-600 text-ink"
                            : "border-mist text-stone"
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full ${HIGHLIGHT_SWATCH[color]}`} />
                        {HIGHLIGHT_LABEL[color]}
                      </button>
                    ))}
                    {highlight && (
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void handleRemoveHighlight(verse.verse)}
                        className="text-[11px] text-stone underline disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                    {isSaving && <span className="text-[11px] text-stone">Saving…</span>}
                  </div>
                )}
                {isOpen && saveError && (
                  <p className="px-3 text-xs text-clay-700">{saveError}</p>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
