import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
// Relative imports here, not the usual "@/..." alias — this module is
// imported directly by scripts/plisio-grant.test.mjs under plain Node
// (--experimental-strip-types), which doesn't resolve tsconfig path
// aliases the way Next.js's webpack build does (same reason verify.ts,
// its neighbor, has no internal imports at all).
import { extendPremiumUntil } from "../premium.ts";
import { PLANS, type PlanId } from "./plans.ts";
import { COLLECTIONS } from "../../types/firestore.ts";

/**
 * Grants (or extends) premium for one order, guarded by a Firestore
 * transaction against `premium_grants/{orderNumber}` so a redelivered
 * "completed" webhook callback for the same order can never double-extend
 * — see PremiumGrantDoc (src/types/firestore.ts). Throws on any failure
 * (including a missing user doc) so the caller (the webhook route) can
 * return a retryable 500 on a genuine failure, per the "must not end up
 * paid but not unlocked" requirement: nothing here is written unless the
 * whole transaction commits, so a failed attempt leaves nothing for a
 * retry to conflict with. A pre-existing grant doc is not an error — it's
 * reported back via `duplicate` instead, so the same "completed" delivery
 * arriving twice (Plisio's own retry, or a manual resend) is a no-op the
 * second time, not a second extension.
 *
 * Pulled out of the webhook route itself so it can be exercised directly
 * against the Firestore emulator — see scripts/plisio-grant.test.mjs —
 * without needing real Admin SDK credentials or an HTTP round trip.
 */
export async function grantPremium(
  db: Firestore,
  orderNumber: string,
  uid: string,
  plan: PlanId,
  txnId: string | null,
): Promise<{ duplicate: boolean }> {
  const grantRef = db.collection(COLLECTIONS.premiumGrants).doc(orderNumber);
  const userRef = db.collection(COLLECTIONS.users).doc(uid);

  return db.runTransaction(async (tx) => {
    const [grantSnap, userSnap] = await Promise.all([tx.get(grantRef), tx.get(userRef)]);

    if (grantSnap.exists) {
      return { duplicate: true };
    }
    if (!userSnap.exists) {
      throw new Error(`user ${uid} does not exist`);
    }

    const previousPremiumUntil = (userSnap.data()?.premiumUntil as Timestamp | null | undefined) ?? null;
    const premiumSince = Timestamp.now();
    const newPremiumUntil = Timestamp.fromMillis(
      extendPremiumUntil(previousPremiumUntil, PLANS[plan].days, premiumSince.toMillis()),
    );

    tx.update(userRef, { tier: "premium", premiumSince, premiumUntil: newPremiumUntil, planId: plan });
    tx.set(grantRef, {
      orderNumber,
      uid,
      plan,
      txnId,
      grantedAt: premiumSince,
      previousPremiumUntil,
      newPremiumUntil,
    });

    return { duplicate: false };
  });
}
