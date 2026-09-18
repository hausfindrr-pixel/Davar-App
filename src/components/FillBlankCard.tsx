"use client";

import { useMemo, useState } from "react";
import { CONTENT_TYPE_META } from "@/lib/contentType";
import { BLANK_TOKEN, type FillBlankLessonDoc } from "@/types/firestore";

type FillBlankCardProps = {
  lesson: FillBlankLessonDoc;
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

/** Duolingo-style fill-in-the-blank: tap word-bank words to fill the
 * verse's blanks in order, then check. Wrong isn't final — "not quite,
 * try again" and a reset, never a locked-out failure state, matching this
 * app's never-shaming tone everywhere else. */
export function FillBlankCard({ lesson, isDone, isLocked, isPending, onComplete }: FillBlankCardProps) {
  const meta = CONTENT_TYPE_META[lesson.track];
  const segments = useMemo(() => lesson.template.split(BLANK_TOKEN), [lesson.template]);
  const blankCount = segments.length - 1;
  const bankWords = useMemo(() => shuffled(lesson.wordBank), [lesson.wordBank]);

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
    const isCorrect = blanks.every((word, i) => word === lesson.answers[i]);
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

  // Completed (in a past session, or just now): show the filled verse,
  // read-only, no word bank.
  if (isDone) {
    return (
      <div className="flex flex-wrap gap-1 text-sm leading-relaxed">
        {segments.map((segment, i) => (
          <span key={i}>
            {segment}
            {i < blankCount && (
              <span className="font-semibold text-sage-700">{lesson.answers[i]}</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5 text-sm leading-relaxed">
        {segments.map((segment, i) => (
          <span key={i} className="contents">
            <span>{segment}</span>
            {i < blankCount && (
              <button
                type="button"
                disabled={!interactive || blanks[i] === null}
                onClick={() => clearBlank(i)}
                className={`inline-flex min-w-[4.5rem] items-center justify-center rounded-lg border-2 px-2.5 py-1 text-sm font-bold transition-colors ${
                  blanks[i] === null
                    ? `border-dashed ${meta.currentBorderClass} text-transparent select-none`
                    : feedback === "correct"
                      ? "border-sage-600 bg-sage-600 text-paper"
                      : feedback === "incorrect"
                        ? `border-transparent ${meta.incorrectBgClass} text-paper`
                        : `border-transparent ${meta.buttonClass}`
                }`}
              >
                {blanks[i] ?? "___"}
              </button>
            )}
          </span>
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
                usedIndices.has(i) || isLocked
                  ? "bg-mist text-stone/50"
                  : meta.buttonClass
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
          className={`self-start rounded-full px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${meta.buttonClass}`}
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
