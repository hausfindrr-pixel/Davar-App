"use client";

import { useEffect, useMemo, useState } from "react";
import { BIBLE_BOOKS, fetchChapter, type BibleVerse } from "@/lib/bible";
import { highlightVerse, removeHighlight, subscribeToHighlights } from "@/lib/db/highlights";
import type { HighlightColor, UserHighlightDoc } from "@/types/firestore";

type WordTabProps = {
  uid: string;
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
 * (user_highlights) and reload with the chapter. */
export function WordTab({ uid }: WordTabProps) {
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(3);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<UserHighlightDoc[]>([]);
  const [openVerse, setOpenVerse] = useState<number | null>(null);

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

  async function handlePickColor(verse: BibleVerse, color: HighlightColor) {
    const reference = `${book} ${chapter}:${verse.verse}`;
    await highlightVerse(uid, reference, book, chapter, verse.verse, color);
    setOpenVerse(null);
  }

  async function handleRemoveHighlight(verseNumber: number) {
    await removeHighlight(uid, book, chapter, verseNumber);
    setOpenVerse(null);
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-4 p-6">
      <div className="text-center">
        <h1 className="text-lg font-semibold text-ink">The Word</h1>
        <p className="mt-1 text-xs text-stone">Tap a verse to highlight it.</p>
      </div>

      <div className="w-full max-w-sm flex gap-2">
        <select
          value={book}
          onChange={(e) => handleBookChange(e.target.value)}
          className="flex-1 rounded-xl border border-mist bg-paper px-3 py-2 text-sm text-ink"
        >
          {BIBLE_BOOKS.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={chapter}
          onChange={(e) => setChapter(Number(e.target.value))}
          className="w-24 rounded-xl border border-mist bg-paper px-3 py-2 text-sm text-ink"
        >
          {Array.from({ length: bookInfo.chapters }, (_, i) => i + 1).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-1">
        {loading && <p className="text-sm text-stone">Loading…</p>}
        {loadError && <p className="text-sm text-clay-700">{loadError}</p>}
        {!loading &&
          !loadError &&
          verses.map((verse) => {
            const highlight = highlightsInChapter.get(verse.verse);
            const isOpen = openVerse === verse.verse;
            return (
              <div key={verse.verse}>
                <button
                  type="button"
                  onClick={() => setOpenVerse(isOpen ? null : verse.verse)}
                  className={`w-full text-left rounded-lg px-2 py-1.5 transition-colors ${
                    highlight ? HIGHLIGHT_BG[highlight.color] : "hover:bg-mist/40"
                  }`}
                >
                  <span className="text-sm leading-relaxed text-ink/85">
                    <sup className="text-[10px] text-stone mr-0.5">{verse.verse}</sup>
                    {verse.text}
                  </span>
                </button>
                {isOpen && (
                  <div className="flex items-center gap-2 px-2 py-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Highlight ${color}`}
                        onClick={() => void handlePickColor(verse, color)}
                        className={`h-6 w-6 rounded-full ${HIGHLIGHT_SWATCH[color]} ${
                          highlight?.color === color ? "ring-2 ring-offset-2 ring-clay-600" : ""
                        }`}
                      />
                    ))}
                    {highlight && (
                      <button
                        type="button"
                        onClick={() => void handleRemoveHighlight(verse.verse)}
                        className="text-xs text-stone underline ml-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
