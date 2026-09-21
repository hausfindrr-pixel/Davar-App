/** "YYYY-MM-DD" for the given date in the given IANA time zone. */
export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Shift a "YYYY-MM-DD" key by `days` (may be negative), calendar-wise. */
export function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Whole calendar-day difference between two "YYYY-MM-DD" keys (to − from). */
export function daysBetweenKeys(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

/** "Monday, 21 September" for a "YYYY-MM-DD" key — Matthew's Ledger's day
 * headings. The key is already a calendar date computed in the user's own
 * timezone (dateKeyInTimeZone), so this formats it in UTC rather than
 * shifting it again by the browser's local zone. Built from separately
 * formatted weekday/day/month parts (rather than one combined
 * Intl.DateTimeFormat call) since combined day-before-month formats are
 * locale-specific (e.g. en-GB drops the comma) and this exact
 * "Weekday, D Month" shape is the app's own copy, not a locale's. */
export function formatDayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(date);
  const monthName = new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(date);
  return `${weekday}, ${day} ${monthName}`;
}
