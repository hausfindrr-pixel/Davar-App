import { daysBetweenKeys } from "@/lib/date";

interface DailyPoolItem {
  order: number;
}

/** 0-indexed day-of-year for a "YYYY-MM-DD" key (Jan 1 → 0, Dec 31 → 364/365). */
function dayOfYear(dateKey: string): number {
  const year = dateKey.slice(0, 4);
  return daysBetweenKeys(`${year}-01-01`, dateKey);
}

/**
 * Deterministically picks one item from `pool` for `dateKey` — the same
 * date always yields the same pick, rotating by day-of-year modulo pool
 * size so content doesn't repeat until the whole pool has cycled through
 * (unlike picking at random, which could repeat the same item two days
 * running). Global rather than per-user: every signed-in user sees the
 * same pick on the same date, deliberately — see the "Today: daily
 * content" README section for why.
 *
 * Indexed by each item's own `order` field after sorting, not by its
 * position in `pool` as passed in (e.g. query result order) — so the
 * rotation a user has already seen doesn't shift retroactively if new
 * content is appended to the pool later. Returns null for an empty pool.
 */
export function pickForDate<T extends DailyPoolItem>(pool: T[], dateKey: string): T | null {
  if (pool.length === 0) return null;
  const sorted = [...pool].sort((a, b) => a.order - b.order);
  const index = dayOfYear(dateKey) % sorted.length;
  return sorted[index];
}
