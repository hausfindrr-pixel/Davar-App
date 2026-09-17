import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isPremiumExpired } from "@/lib/premium";
import { COLLECTIONS } from "@/types/firestore";

// Needs the Admin SDK — not compatible with the edge runtime.
export const runtime = "nodejs";

// Firestore batched writes cap at 500 operations.
const BATCH_SIZE = 500;

/**
 * Runs once a day via Vercel Cron (see vercel.json's `crons` entry) and
 * downgrades any user whose premiumUntil has passed back to "free".
 *
 * Deliberately queries `tier == "premium"` alone (a single equality
 * filter — no composite index needed, ever) rather than adding a second,
 * range-based filter on `premiumUntil` in the query itself: combining an
 * equality and a range filter on different fields requires a Firestore
 * composite index, and this app has already been bitten once this
 * project by rules/config that were written and tested but never
 * actually deployed (see README's Firestore rules "Known limitations").
 * A nightly batch job scanning every premium user and filtering
 * `isPremiumExpired` in code is simpler and has nothing to deploy wrong.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("cron expire-premium: CRON_SECRET is not configured");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const snap = await adminDb().collection(COLLECTIONS.users).where("tier", "==", "premium").get();

  const now = Date.now();
  const expired = snap.docs.filter((doc) => isPremiumExpired(doc.data().premiumUntil ?? null, now));

  for (let i = 0; i < expired.length; i += BATCH_SIZE) {
    const batch = adminDb().batch();
    for (const doc of expired.slice(i, i + BATCH_SIZE)) {
      batch.update(doc.ref, { tier: "free" });
    }
    await batch.commit();
  }

  console.log(`cron expire-premium: checked ${snap.size} premium users, downgraded ${expired.length}`, {
    downgradedUids: expired.map((doc) => doc.id),
  });

  return NextResponse.json({ checked: snap.size, downgraded: expired.length });
}
