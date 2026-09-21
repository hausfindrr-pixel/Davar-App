"use client";

import { Fragment, useMemo, useState } from "react";
import { CONTENT_TYPE_META } from "@/lib/contentType";
import { BLANK_TOKEN, type LessonTrack, type VerseActivity } from "@/types/firestore";

type FillBlankCardProps = {
  activity: VerseActivity;
  track: LessonTrack;
  isDone: boolean;
  isLocked: boolean;
  isPending: boolean;
  onComplete: () => Promise<void>;
};

/** A small, stable shuffle — computed once per mount via useState's lazy
 * initializer, not re-shuffled on every render (which would make already-
 * placed words jump around as the user fills blanks). */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** One verse's template split into segments, with a global blank-index
 * offset so the flattened `blanks` state array below can address a blank
 * inside any verse by one running index across the whole activity. */
type VerseRender = {
  reference: string;
  segments: string[];
  blankCount: number;
  startIndex: number;
};

function renderVerses(verses: VerseActivity["verses"]): VerseRender[] {
  let offset = 0;
  return verses.map((verse) => {
    const segments = verse.template.split(BLANK_TOKEN);
    const blankCount = segments.length - 1;
    const render = { reference: verse.reference, segments, blankCount, startIndex: offset };
    offset += blankCount;
    return render;
  });
}

/** Duolingo-style fill-in-the-blank, spanning every verse in the event's
 * verse activity (up to 5 — see VerseActivity, src/types/firestore.ts):
 * tap word-bank words to fill each verse's blanks in order, then check all
 * of them at once. Wrong isn't final — "not quite, try again" and a reset,
 * never a locked-out failure state, matching this app's never-shaming tone
 * everywhere else. */
export function FillBlankCard({ activity, track, isDone, isLocked, isPending, onComplete }: FillBlankCardProps) {
  const meta = CONTENT_TYPE_META[track];
  const verseRenders = useMemo(() => renderVerses(activity.verses), [activity.verses]);
  const flatAnswers = useMemo(() => activity.verses.flatMap((v) => v.answers), [activity.verses]);
  const blankCount = flatAnswers.length;
  const bankWords = useMemo(() => shuffled(activity.wordBank), [activity.wordBank]);

  const [blanks, setBlanks] = useState<(string | null)[]>(() => Array(blankCount).fill(null));
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [checking, setChecking] = useState(false);

  const allFilled = blanks.every((b) => b !== null);
  const interactive = !isDone && !isLocked;

  function placeWord(bankIndex: number, word: string) {
    if (!interactive || feedback === "correct") return;
    const nextEmpty = blanks.findIndex((b) => b === null);
    if (nextEmpty === -1) return;
    const nextBlanks = [...blanks];
    nextBlanks[nextEmpty] = word;
    setBlanks(nextBlanks);
    setUsedIndices((prev) => new Set(prev).add(bankIndex));
    setFeedback(null);
  }

  function clearBlank(blankIndex: number) {
    if (!interactive || feedback === "correct") return;
    const word = blanks[blankIndex];
    if (word === null) return;
    // Free up exactly one matching, currently-used bank slot for this word
    // — not just "the first bank slot with this text", in case the word
    // appears more than once (as a real answer and/or a decoy).
    const bankIndexToFree = bankWords.findIndex((w, i) => w === word && usedIndices.has(i));
    setUsedIndices((prev) => {
      const next = new Set(prev);
      if (bankIndexToFree !== -1) next.delete(bankIndexToFree);
      return next;
    });
    const nextBlanks = [...blanks];
    nextBlanks[blankIndex] = null;
    setBlanks(nextBlanks);
    setFeedback(null);
  }

  async function handleCheck() {
    const isCorrect = blanks.every((word, i) => word === flatAnswers[i]);
    if (isCorrect) {
      setFeedback("correct");
      setChecking(true);
      try {
        await onComplete();
      } finally {
        setChecking(false);
      }
    } else {
      setFeedback("incorrect");
    }
  }

  function handleTryAgain() {
    setBlanks(Array(blankCount).fill(null));
    setUsedIndices(new Set());
    setFeedback(null);
  }

  // Completed (in a past session, or just now): show every verse filled
  // in, read-only, no word bank.
  if (isDone) {
    return (
      <div className="flex flex-col gap-2">
        {verseRenders.map((verse) => (
          <div key={verse.reference} className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone">
              {verse.reference}
            </span>
            <p className="text-lg leading-relaxed font-normal text-ink">
              {verse.segments.map((segment, i) => (
                <Fragment key={i}>
                  {segment}
                  {i < verse.blankCount && (
                    <span className="font-semibold text-sage-700">
                      {flatAnswers[verse.startIndex + i]}
                    </span>
                  )}
                </Fragment>
              ))}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        {verseRenders.map((verse) => (
          <div key={verse.reference} className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-stone">
              {verse.reference}
            </span>
            <p className="text-lg leading-relaxed font-normal text-ink">
              {verse.segments.map((segment, i) => {
                const blankIndex = verse.startIndex + i;
                return (
                  <Fragment key={i}>
                    {segment}
                    {i < verse.blankCount && (
                      <button
                        type="button"
                        disabled={!interactive || blanks[blankIndex] === null}
                        onClick={() => clearBlank(blankIndex)}
                        className={`mx-1 inline-flex min-w-[4.5rem] items-center justify-center rounded-lg border-2 px-2.5 py-1 align-middle text-sm font-bold transition-colors ${
                          blanks[blankIndex] === null
                            ? `border-dashed ${meta.emptyBlankClass} text-transparent select-none`
                            : feedback === "correct"
                              ? "border-transparent bg-sage-700 text-paper"
                              : feedback === "incorrect"
                                ? "border-transparent bg-ink text-paper"
                                : `border-transparent ${meta.activeBgClass}`
                        }`}
                      >
                        {blanks[blankIndex] ?? "___"}
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </p>
          </div>
        ))}
      </div>

      {interactive && feedback !== "correct" && (
        <div className="flex flex-wrap gap-2">
          {bankWords.map((word, i) => (
            <button
              key={i}
              type="button"
              disabled={usedIndices.has(i) || isLocked}
              onClick={() => placeWord(i, word)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors disabled:cursor-not-allowed ${
                usedIndices.has(i) || isLocked ? "bg-mist text-stone/50" : meta.activeBgClass
              }`}
            >
              {word}
            </button>
          ))}
        </div>
      )}

      {feedback === "incorrect" && (
        <div className="flex items-center gap-3">
          <p className={`text-xs font-medium ${meta.labelClass}`}>
            Not quite — take another look and try again.
          </p>
          <button
            type="button"
            onClick={handleTryAgain}
            className={`text-xs font-bold underline shrink-0 ${meta.labelClass}`}
          >
            Try again
          </button>
        </div>
      )}

      {isLocked && !isDone && (
        <span className="self-start rounded-full bg-mist text-stone px-4 py-1.5 text-xs font-medium">
          Locked
        </span>
      )}

      {allFilled && feedback !== "correct" && (
        <button
          type="button"
          disabled={!interactive || isPending}
          onClick={() => void handleCheck()}
          className={`self-start rounded-full px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${meta.activeBgClass}`}
        >
          Check answer
        </button>
      )}

      {feedback === "correct" && (
        <p className="text-xs text-sage-700">{checking || isPending ? "Saving…" : "Correct!"}</p>
      )}
    </div>
  );
}
