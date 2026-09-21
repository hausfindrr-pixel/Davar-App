"use client";

import { useEffect, useMemo, useState } from "react";
import { ApostleAvatar } from "@/components/ApostleAvatar";
import { fetchLessonCheckIns } from "@/lib/db/checkIns";
import { subscribeToHighlights } from "@/lib/db/highlights";
import { subscribeToPrayers } from "@/lib/db/prayers";
import { dateKeyInTimeZone, daysBetweenKeys, formatDayLabel } from "@/lib/date";
import { buildLedgerEntries } from "@/lib/ledger";
import type { CheckInDoc, LessonDoc, PrayerDoc, UserHighlightDoc } from "@/types/firestore";

type LedgerShortcutProps = {
  uid: string;
  timeZone: string;
  lessons: LessonDoc[];
  onOpen: () => void;
};

function relativeDayLabel(entryDate: string, todayKey: string): string {
  const gap = daysBetweenKeys(entryDate, todayKey);
  if (gap === 0) return "today";
  if (gap === 1) return "yesterday";
  return formatDayLabel(entryDate);
}

function latestEntryLabel(kind: "lesson" | "prayer" | "highlight", title: string): string {
  if (kind === "lesson") return title;
  if (kind === "prayer") return "a prayer";
  return `${title} highlighted`;
}

/** A compact, secondary entry point into Matthew's Ledger from Today —
 * owns its own lightweight data (same pattern as PrayerJournal inside
 * PathTab), not routed through page.tsx's larger state. Renders nothing
 * until there's at least one entry, so a brand-new account's Today stays
 * exactly as clean as before this existed. */
export function LedgerShortcut({ uid, timeZone, lessons, onOpen }: LedgerShortcutProps) {
  const [checkIns, setCheckIns] = useState<CheckInDoc[]>([]);
  const [prayers, setPrayers] = useState<PrayerDoc[]>([]);
  const [highlights, setHighlights] = useState<UserHighlightDoc[]>([]);

  useEffect(() => {
    fetchLessonCheckIns(uid)
      .then(setCheckIns)
      .catch(() => setCheckIns([]));
  }, [uid]);

  useEffect(() => {
    return subscribeToPrayers(uid, setPrayers);
  }, [uid]);

  useEffect(() => {
    return subscribeToHighlights(uid, setHighlights);
  }, [uid]);

  const entries = useMemo(
    () => buildLedgerEntries(checkIns, [], lessons, prayers, highlights, timeZone),
    [checkIns, lessons, prayers, highlights, timeZone],
  );

  if (entries.length === 0) return null;

  const latest = entries[0];
  const todayKey = dateKeyInTimeZone(new Date(), timeZone);
  const latestTitle = latest.kind === "lesson" ? latest.title : latest.kind === "highlight" ? latest.reference : "";
  const summary = `${entries.length} ${entries.length === 1 ? "entry" : "entries"} · latest: ${latestEntryLabel(
    latest.kind,
    latestTitle,
  )}, ${relativeDayLabel(latest.date, todayKey)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full max-w-sm rounded-2xl bg-paper border border-mist px-4 py-3 flex items-center gap-3 text-left hover:bg-mist/20 transition-colors"
    >
      <ApostleAvatar apostleId="matthew" size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-clay-600">Matthew&apos;s Ledger</p>
        <p className="text-xs text-stone truncate">{summary}</p>
      </div>
    </button>
  );
}
