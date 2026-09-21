/**
 * Decides whether a Plisio "mismatch" callback (amount received != amount
 * invoiced, in *either* direction — see the webhook route's own comment on
 * why this isn't assumed to mean underpayment only) represents a payment
 * that's still good enough to grant. Pulled out of the webhook route so
 * this arithmetic — the exact boundary between "close enough" and "a real
 * underpayment" — is unit-testable on its own, the same reasoning as
 * extendPremiumUntil (src/lib/premium.ts).
 */

/** Parses a Plisio payload amount field into a number, or null if it's
 * missing/unparseable — never throws. */
export function parseAmount(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * True if `receivedNumber` covers `requiredAmount` within `toleranceUsd` —
 * i.e. an exact match, an overpayment, or a difference small enough to be
 * float/display rounding rather than a real shortfall. False (including
 * when `receivedNumber` is null — an unparseable/missing amount is never
 * treated as "close enough") for anything short of that.
 */
export function isMismatchAmountSufficient(
  requiredAmount: number,
  receivedNumber: number | null,
  toleranceUsd: number,
): boolean {
  return receivedNumber !== null && receivedNumber >= requiredAmount - toleranceUsd;
}
