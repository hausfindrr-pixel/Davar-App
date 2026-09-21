"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, CompassIcon, LockIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { UnlockCard, blurredPreviewClass } from "@/components/PremiumGate";
import { MATTHEW_LEDGER_MESSAGES, pickFromList } from "@/lib/apostles";
import { fetchLessonCheckIns } from "@/lib/db/checkIns";
import { removeHighlight, subscribeToHighlights } from "@/lib/db/highlights";
import { deleteLessonAnswer, fetchLessonAnswers } from "@/lib/db/lessonAnswers";
import { deletePrayer, subscribeToPrayers } from "@/lib/db/prayers";
import { dateKeyInTimeZone, formatDayLabel } from "@/lib/date";
import {
  buildLedgerEntries,
  findOnThisDay,
  groupLedgerEntriesByDay,
  searchLedgerEntries,
  type LedgerEntry,
} from "@/lib/ledger";
import type {
  CheckInDoc,
  HighlightColor,
  LessonAnswerDoc,
  LessonDoc,
  PrayerDoc,
  UserHighlightDoc,
} from "@/types/firestore";

type MatthewsLedgerProps = {
  uid: string;
  timeZone: string;
  isPremium: boolean;
  lessons: LessonDoc[];
  getIdToken: () => Promise<string>;
  onBack: () => void;
  /** Jumps to The Word tab, open to this book/chapter — see WordFocusRequest
   * (src/components/tabs/WordTab.tsx). Closes the Ledger itself. */
  onNavigateToVerse: (book: string, chapter: number) => void;
};

type EntryFilter = "all" | "lesson" | "prayer" | "highlight";

const HIGHLIGHT_LABEL: Record<HighlightColor, string> = {
  clay: "Clay",
  sage: "Sage",
  stone: "Stone",
};

const HIGHLIGHT_DOT: Record<HighlightColor, string> = {
  clay: "bg-clay-400",
  sage: "bg-sage-400",
  stone: "bg-stone",
};

function entrySummary(entry: LedgerEntry): string {
  if (entry.kind === "lesson") return entry.title;
  if (entry.kind === "highlight") return entry.reference;
  const trimmed = entry.text.trim();
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed;
}

function formatEntryTime(timestampMs: number): string {
  if (!timestampMs) return "";
  return new Date(timestampMs).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

const ENTRY_KIND_LABEL: Record<LedgerEntry["kind"], string> = {
  lesson: "Lesson",
  prayer: "Prayer",
  highlight: "Highlight",
};

function EntryRow({
  entry,
  isOpen,
  onToggle,
  onDelete,
  onNavigateToVerse,
  deleting,
}: {
  entry: LedgerEntry;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => Promise<void>;
  onNavigateToVerse: (book: string, chapter: number) => void;
  deleting: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const canDelete = entry.kind !== "lesson" || entry.answers.length > 0;

  const dotClass =
    entry.kind === "lesson"
      ? "bg-clay-600"
      : entry.kind === "prayer"
        ? "bg-dusk-600"
        : HIGHLIGHT_DOT[entry.color];

  return (
    <div className="border-b border-mist last:border-b-0 py-3">
      <button type="button" onClick={onToggle} className="w-full flex items-start justify-between gap-3 text-left">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} />
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-stone">
              {ENTRY_KIND_LABEL[entry.kind]}
              {entry.kind === "highlight" && ` · ${HIGHLIGHT_LABEL[entry.color]}`}
              {formatEntryTime(entry.timestampMs) && ` · ${formatEntryTime(entry.timestampMs)}`}
            </span>
            <p className="text-sm text-ink font-serif leading-snug truncate">{entrySummary(entry)}</p>
          </div>
        </div>
        <span className="text-stone text-xs shrink-0 mt-0.5">{isOpen ? "–" : "+"}</span>
      </button>

      {isOpen && (
        <div className="mt-2.5 pl-4 flex flex-col gap-3">
          {entry.kind === "lesson" &&
            (entry.answers.length > 0 ? (
              entry.answers.map((answer) => (
                <div key={answer.screenId} className="flex flex-col gap-1">
                  {answer.prompt && <p className="text-xs text-stone leading-relaxed">{answer.prompt}</p>}
                  <p className="text-sm text-ink/85 font-serif leading-relaxed whitespace-pre-wrap">
                    {answer.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-stone">No saved answers for this lesson.</p>
            ))}

          {entry.kind === "prayer" && (
            <p className="text-sm text-ink/85 font-serif leading-relaxed whitespace-pre-wrap">{entry.text}</p>
          )}

          {entry.kind === "highlight" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink/85 font-serif leading-relaxed whitespace-pre-wrap">{entry.text}</p>
              {entry.notes && (
                <p className="text-xs text-ink/70 leading-relaxed border-l-2 border-mist pl-2.5">
                  {entry.notes}
                </p>
              )}
              <button
                type="button"
                onClick={() => onNavigateToVerse(entry.book, entry.chapter)}
                className="self-start flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:text-clay-700 transition-colors"
              >
                <CompassIcon className="h-3.5 w-3.5" />
                Go to {entry.book} {entry.chapter} in The Word
              </button>
            </div>
          )}

          {canDelete && (
            <div className="flex items-center gap-3">
              {!confirming ? (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="flex items-center gap-1 text-xs text-stone hover:text-clay-700 transition-colors"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="text-stone">Delete this entry?</span>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void onDelete()}
                    className="font-semibold text-clay-700 disabled:opacity-60"
                  >
                    {deleting ? "Deleting…" : "Delete"}
                  </button>
                  <button type="button" onClick={() => setConfirming(false)} className="text-stone">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** "Matthew's Ledger (Archives)" — a personal, private record of completed
 * lessons, prayers, and highlighted verses, kept as a reverse-chronological
 * timeline grouped by day. Reuses existing data end to end (see
 * src/lib/ledger.ts) — no new Firestore collection. Highlights load via
 * the same live subscription The Word tab uses, so deleting one here (or
 * there) is never out of sync with the other. */
export function MatthewsLedger({
  uid,
  timeZone,
  isPremium,
  lessons,
  getIdToken,
  onBack,
  onNavigateToVerse,
}: MatthewsLedgerProps) {
  const [checkIns, setCheckIns] = useState<CheckInDoc[]>([]);
  const [lessonAnswers, setLessonAnswers] = useState<LessonAnswerDoc[]>([]);
  const [prayers, setPrayers] = useState<PrayerDoc[]>([]);
  const [highlights, setHighlights] = useState<UserHighlightDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EntryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // loading/loadError start at their "fetch just began" values already
  // (useState below), so this effect only ever needs to report the
  // outcome — never resets them synchronously in the effect body itself.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchLessonCheckIns(uid), fetchLessonAnswers(uid)])
      .then(([fetchedCheckIns, fetchedAnswers]) => {
        if (cancelled) return;
        setCheckIns(fetchedCheckIns);
        setLessonAnswers(fetchedAnswers);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Could not load your ledger.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    return subscribeToPrayers(uid, setPrayers);
  }, [uid]);

  // Live, not a one-time fetch — the same subscription The Word tab
  // itself uses, so a highlight deleted from either place is just gone
  // from the one underlying doc; the two views never need reconciling.
  useEffect(() => {
    return subscribeToHighlights(uid, setHighlights);
  }, [uid]);

  const allEntries = useMemo(
    () => buildLedgerEntries(checkIns, lessonAnswers, lessons, prayers, highlights, timeZone),
    [checkIns, lessonAnswers, lessons, prayers, highlights, timeZone],
  );

  const todayKey = dateKeyInTimeZone(new Date(), timeZone);
  const onThisDay = useMemo(() => findOnThisDay(allEntries, todayKey), [allEntries, todayKey]);

  const matthewMessage = useMemo(
    () => pickFromList(MATTHEW_LEDGER_MESSAGES, `matthew-ledger-${uid}-${todayKey}`),
    [uid, todayKey],
  );

  const visibleEntries = useMemo(() => {
    let filtered = filter === "all" ? allEntries : allEntries.filter((e) => e.kind === filter);
    if (isPremium && searchQuery.trim()) {
      filtered = searchLedgerEntries(filtered, searchQuery);
    }
    return filtered;
  }, [allEntries, filter, isPremium, searchQuery]);

  const days = useMemo(() => groupLedgerEntriesByDay(visibleEntries), [visibleEntries]);

  async function handleDeleteEntry(entry: LedgerEntry) {
    setDeletingKey(entry.key);
    setDeleteError(null);
    try {
      if (entry.kind === "prayer") {
        await deletePrayer(uid, entry.prayerId);
      } else if (entry.kind === "highlight") {
        await removeHighlight(uid, entry.book, entry.chapter, entry.verse);
        // subscribeToHighlights updates highlights (and so The Word tab)
        // on its own — no local state to reconcile here.
      } else {
        await Promise.all(entry.answers.map((answer) => deleteLessonAnswer(uid, entry.lessonId, answer.screenId)));
        setLessonAnswers((prev) => prev.filter((answer) => answer.lessonId !== entry.lessonId));
      }
      setOpenKey(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete that entry.");
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-sm flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone hover:bg-mist/40 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-ink">Matthew&apos;s Ledger</h1>
          <p className="text-xs text-stone">(Archives)</p>
        </div>
      </div>

      <div className="w-full max-w-sm flex items-start gap-3">
        <div className="relative flex-1 rounded-2xl bg-paper border border-mist px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-clay-600">Matthew</span>
          <p className="mt-0.5 text-sm text-ink/85 leading-relaxed">{matthewMessage}</p>
          <span
            aria-hidden
            className="absolute -right-2 bottom-4 h-4 w-4 rotate-45 bg-paper border-r border-b border-mist"
          />
        </div>
        <Image
          src="/apostles/matthew.png"
          alt="Matthew"
          width={200}
          height={300}
          className="h-32 w-auto shrink-0"
        />
      </div>

      {onThisDay &&
        (isPremium ? (
          <section className="w-full max-w-sm rounded-2xl bg-sage-50 border border-sage-200 p-4 flex flex-col gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">
              {onThisDay.label}
            </span>
            <div className="flex flex-col gap-2">
              {onThisDay.entries.map((entry) => (
                <p key={entry.key} className="text-sm text-ink/85 font-serif leading-relaxed">
                  {entrySummary(entry)}
                </p>
              ))}
            </div>
          </section>
        ) : (
          <div className="w-full max-w-sm flex flex-col gap-3">
            <section className={`rounded-2xl bg-sage-50 border border-sage-200 p-4 flex flex-col gap-2.5 ${blurredPreviewClass}`}>
              <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">
                {onThisDay.label}
              </span>
              {onThisDay.entries.map((entry) => (
                <p key={entry.key} className="text-sm text-ink/85 font-serif leading-relaxed">
                  {entrySummary(entry)}
                </p>
              ))}
            </section>
            <UnlockCard
              title="Unlock On This Day"
              description="See what you wrote or completed on this date in earlier months, resurfaced automatically — plus search across your whole ledger."
              getIdToken={getIdToken}
            />
          </div>
        ))}

      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "lesson", "prayer", "highlight"] as EntryFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-clay-600 text-paper" : "bg-paper border border-mist text-stone"
              }`}
            >
              {f === "all" ? "All" : f === "lesson" ? "Lessons" : f === "prayer" ? "Prayers" : "Highlights"}
            </button>
          ))}
        </div>

        {isPremium ? (
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your ledger…"
              className="w-full rounded-xl border border-mist bg-paper pl-9 pr-3 py-2 text-sm text-ink placeholder:text-stone/70"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-mist bg-paper px-3 py-2 text-sm text-stone/70">
            <LockIcon className="h-3.5 w-3.5 shrink-0" />
            Search your ledger — Premium
          </div>
        )}
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {loading && <p className="text-sm text-stone text-center">Loading your ledger…</p>}
        {loadError && <p className="text-sm text-clay-700 text-center">{loadError}</p>}

        {!loading && !loadError && days.length === 0 && (
          <div className="rounded-2xl bg-paper border border-mist p-5 text-center">
            <p className="text-sm text-stone">
              Nothing here yet — complete a lesson, write a prayer, or highlight a verse, and Matthew starts
              keeping the record.
            </p>
          </div>
        )}

        {days.map((day) => (
          <section key={day.date} className="rounded-2xl bg-paper border border-mist px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-stone pt-3.5 pb-1">
              {formatDayLabel(day.date)}
            </h2>
            <div>
              {day.entries.map((entry) => (
                <EntryRow
                  key={entry.key}
                  entry={entry}
                  isOpen={openKey === entry.key}
                  onToggle={() => setOpenKey((prev) => (prev === entry.key ? null : entry.key))}
                  onDelete={() => handleDeleteEntry(entry)}
                  onNavigateToVerse={onNavigateToVerse}
                  deleting={deletingKey === entry.key}
                />
              ))}
            </div>
          </section>
        ))}

        {deleteError && <p className="text-xs text-clay-700 text-center">{deleteError}</p>}
      </div>
    </div>
  );
}
