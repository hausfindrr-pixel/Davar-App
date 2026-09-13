import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyPlisioCallback } from "@/lib/plisio/verify";
import { PLANS, isPlanId } from "@/lib/plisio/plans";

// Needs Node's crypto/Admin SDK — not compatible with the edge runtime.
export const runtime = "nodejs";

/** Plisio posts either JSON or classic form-urlencoded, depending on setup. */
async function parseBody(req: Request): Promise<Record<string, unknown>> {
  const raw = await req.text();
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through to form parsing below
    }
  }

  const fromForm: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(raw).entries()) fromForm[key] = value;
  if (Object.keys(fromForm).length > 0) return fromForm;

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const secretKey = process.env.PLISIO_SECRET_KEY;
  if (!secretKey) {
    console.error("plisio webhook: PLISIO_SECRET_KEY is not configured");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const payload = await parseBody(req);

  if (!verifyPlisioCallback(payload, secretKey)) {
    // Never log the payload or any computed hash here — an attacker who can
    // read these logs could use them as a signing oracle for the next call.
    console.warn("plisio webhook: signature verification failed", {
      order_number: typeof payload.order_number === "string" ? payload.order_number : undefined,
      txn_id: typeof payload.txn_id === "string" ? payload.txn_id : undefined,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const orderNumber = typeof payload.order_number === "string" ? payload.order_number : "";
  const [uid, plan] = orderNumber.split("__");
  const status = typeof payload.status === "string" ? payload.status : null;

  if (uid && isPlanId(plan) && status === "completed") {
    const premiumUntil = Timestamp.fromMillis(Date.now() + PLANS[plan].days * 24 * 60 * 60 * 1000);
    try {
      await adminDb().collection("users").doc(uid).update({ tier: "premium", premiumUntil });
      console.log("plisio webhook: upgraded user to premium", { uid, plan, txn_id: payload.txn_id });
    } catch (err) {
      // Log and move on rather than returning non-2xx: Plisio retries
      // failed callbacks, and a transient Firestore error shouldn't turn
      // into a retry storm. This needs a human to look at the log instead.
      console.error("plisio webhook: failed to upgrade user", {
        uid,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
