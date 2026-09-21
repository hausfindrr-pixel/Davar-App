import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyPlisioCallback } from "@/lib/plisio/verify";
import { grantPremium } from "@/lib/plisio/grant";
import { isPlanId, PLANS } from "@/lib/plisio/plans";
import { isMismatchAmountSufficient, parseAmount } from "@/lib/plisio/amountCheck";
import { COLLECTIONS, type PaymentEventDoc } from "@/types/firestore";

// Absorbs float/display rounding between Plisio and us (or a wallet UI that
// truncates to fewer decimals than the exact quoted amount) — not a real
// underpayment allowance. A dollar, not a percentage: the plans are cheap
// enough that a percentage tolerance would be too forgiving on the yearly
// plan and too strict on the monthly one.
const PAYMENT_AMOUNT_TOLERANCE_USD = 0.05;

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

function str(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** Best-effort audit-trail write — every delivery gets one row here so a
 * customer's payment can be traced later, but a logging failure must never
 * itself change the response Plisio sees (that response is decided purely
 * by whether premium was actually granted — see POST below). */
async function logPaymentEvent(event: Omit<PaymentEventDoc, "receivedAt">): Promise<void> {
  try {
    await adminDb()
      .collection(COLLECTIONS.paymentEvents)
      .add({ ...event, receivedAt: Timestamp.now() });
  } catch (err) {
    console.error("plisio webhook: failed to write payment_events audit log", {
      orderNumber: event.orderNumber,
      error: err instanceof Error ? err.message : String(err),
    });
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
      order_number: str(payload, "order_number"),
      txn_id: str(payload, "txn_id"),
    });
    // 400, not 5xx: an invalid signature will never become valid on retry.
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const orderNumber = str(payload, "order_number");
  const [uid, plan] = orderNumber ? orderNumber.split("__") : [null, null];
  const status = str(payload, "status");
  const txnId = str(payload, "txn_id");
  const sourceAmount = str(payload, "source_amount");
  const receivedAmount = str(payload, "amount");

  if (!orderNumber || !uid || !isPlanId(plan)) {
    // Malformed/unrecognized order_number — nothing to act on, but still
    // worth a permanent record in case it points at a real bug elsewhere
    // (e.g. an order created before an order_number format change).
    console.warn("plisio webhook: unrecognized order_number", { orderNumber, status, txnId });
    await logPaymentEvent({
      orderNumber,
      uid,
      plan: isPlanId(plan) ? plan : null,
      status,
      txnId,
      sourceAmount,
      receivedAmount,
      result: "error",
      errorMessage: "unrecognized or malformed order_number",
    });
    return NextResponse.json({ ok: true });
  }

  // Only "completed" is unconditionally a grant. "mismatch" is Plisio's
  // catch-all for "amount received != amount invoiced" — in *either*
  // direction, not just underpayment (a real overpaid Solana invoice was
  // seen going through this status without ever reaching "completed" at
  // all). Since we know exactly what this order should have cost
  // (PLANS[plan].amount, set by us at invoice creation, never trusted from
  // the client), a "mismatch" callback that reports at least that much
  // received is verified, real payment — grant it exactly like
  // "completed" rather than stranding a customer who paid enough just
  // because the amount wasn't penny-exact. Anything under that amount
  // (beyond a small rounding tolerance) is a genuine underpayment: never
  // grant, but log it distinctly (not a generic "ignored") since real,
  // partial funds did change hands and the customer needs following up.
  let shouldGrant = status === "completed";
  let underpaidAmount: number | null = null;

  if (!shouldGrant && status === "mismatch") {
    const requiredAmount = Number(PLANS[plan].amount);
    const receivedNumber = parseAmount(sourceAmount) ?? parseAmount(receivedAmount);
    if (isMismatchAmountSufficient(requiredAmount, receivedNumber, PAYMENT_AMOUNT_TOLERANCE_USD)) {
      shouldGrant = true;
    } else {
      underpaidAmount = receivedNumber;
    }
  }

  if (!shouldGrant) {
    // Covers: pending/new/expired/cancelled/error, a mismatch we
    // couldn't verify the amount for, and genuine underpayment.
    await logPaymentEvent({
      orderNumber,
      uid,
      plan,
      status,
      txnId,
      sourceAmount,
      receivedAmount,
      result: underpaidAmount !== null ? "underpaid" : "ignored",
      errorMessage:
        underpaidAmount !== null
          ? `received ${underpaidAmount} < required ${PLANS[plan].amount} (beyond ${PAYMENT_AMOUNT_TOLERANCE_USD} tolerance)`
          : null,
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const { duplicate } = await grantPremium(adminDb(), orderNumber, uid, plan, txnId);
    console.log(duplicate ? "plisio webhook: duplicate delivery, already granted" : "plisio webhook: upgraded user to premium", {
      uid,
      plan,
      orderNumber,
      txnId,
      status,
    });
    await logPaymentEvent({
      orderNumber,
      uid,
      plan,
      status,
      txnId,
      sourceAmount,
      receivedAmount,
      result: duplicate ? "duplicate" : "granted",
      errorMessage: null,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("plisio webhook: failed to upgrade user", { uid, plan, orderNumber, error: errorMessage });
    await logPaymentEvent({
      orderNumber,
      uid,
      plan,
      status,
      txnId,
      sourceAmount,
      receivedAmount,
      result: "error",
      errorMessage,
    });
    // 500, not 200: this was a real, verified "completed" payment that
    // failed to apply — Plisio must retry rather than give up, and the
    // transaction above guarantees a retry is safe (nothing was written
    // unless it fully committed, so there's nothing for a retry to
    // double-apply).
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
