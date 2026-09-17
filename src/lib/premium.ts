/**
 * Pure logic for premium expiry — how many days remain, whether the
 * renewal-reminder banner should show, and whether a grant has actually
 * expired. Kept dependency-free (no Firestore Admin/client SDK import) so
 * it works identically from the client (the renewal banner) and the
 * server (the daily expiry cron), and can be unit-tested directly.
 *
 * `TimestampLike` is a minimal structural type rather than importing
 * either `firebase/firestore`'s or `firebase-admin/firestore`'s concrete
 * `Timestamp` class — both satisfy it, and this file needs to work with
 * whichever one the caller has.
 */
export type TimestampLike = { toMillis(): number };

/** Days remaining until `premiumUntil`, rounded up — zero or negative
 * once it's passed. Null if there's no expiry to compute against (free
 * tier, or a legacy grant with no premiumUntil recorded). */
export function daysUntilExpiry(premiumUntil: TimestampLike | null, now: number = Date.now()): number | null {
  if (!premiumUntil) return null;
  return Math.ceil((premiumUntil.toMillis() - now) / (24 * 60 * 60 * 1000));
}

/** How many days out the renewal reminder starts showing. */
export const RENEWAL_REMINDER_WINDOW_DAYS = 3;

/** Whether to show the "your Premium access ends soon" banner — only
 * while still premium, only in the final RENEWAL_REMINDER_WINDOW_DAYS
 * days, and never once it's already passed (the daily cron owns that
 * transition, not this banner). */
export function shouldShowRenewalReminder(
  isPremium: boolean,
  premiumUntil: TimestampLike | null,
  now: number = Date.now(),
): boolean {
  if (!isPremium) return false;
  const days = daysUntilExpiry(premiumUntil, now);
  return days !== null && days > 0 && days <= RENEWAL_REMINDER_WINDOW_DAYS;
}

/** Whether a premium grant has actually expired — used by the daily cron
 * to decide who to downgrade back to "free". */
export function isPremiumExpired(premiumUntil: TimestampLike | null, now: number = Date.now()): boolean {
  return premiumUntil !== null && premiumUntil.toMillis() <= now;
}
