import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { PLANS, isPlanId } from "@/lib/plisio/plans";

// Needs Node's crypto/Admin SDK — not compatible with the edge runtime.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secretKey = process.env.PLISIO_SECRET_KEY;
  if (!secretKey) {
    console.error("plisio create-invoice: PLISIO_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: "Your session has expired — sign in again." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const plan = body?.plan;
  if (!isPlanId(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  // order_number carries both who's paying and which plan, so the webhook
  // (which only gets this string back, not our request context) knows who
  // to upgrade and for how long. "__" can't appear in a Firebase uid.
  const orderNumber = `${uid}__${plan}__${Date.now()}`;
  const origin = new URL(req.url).origin;

  const params = new URLSearchParams({
    api_key: secretKey,
    order_number: orderNumber,
    order_name: PLANS[plan].label,
    source_currency: "USD",
    source_amount: PLANS[plan].amount,
    callback_url: `${origin}/api/plisio/webhook`,
    success_invoice_url: `${origin}/premium/success`,
    fail_invoice_url: `${origin}/premium/failed`,
  });

  let response: Response;
  try {
    response = await fetch(`https://api.plisio.net/api/v1/invoices/new?${params.toString()}`);
  } catch (err) {
    console.error(`plisio create-invoice: network error reaching Plisio (uid=${uid}, plan=${plan})`, err);
    return NextResponse.json({ error: "Could not reach Plisio." }, { status: 502 });
  }

  // Read as text first, not response.json() directly — an invalid/rotated
  // api_key or a Plisio-side outage can come back as an HTML or plain-text
  // body instead of JSON, and we want that raw body in the logs rather than
  // just a generic "invalid JSON" parse error with no clue what Plisio
  // actually said.
  const rawBody = await response.text();
  let data: { status?: string; data?: { invoice_url?: string; message?: string; name?: string } } | null = null;
  try {
    data = JSON.parse(rawBody);
  } catch {
    console.error(
      `plisio create-invoice: non-JSON response from Plisio (uid=${uid}, plan=${plan}, http ${response.status}): ${rawBody.slice(0, 500)}`,
    );
    return NextResponse.json({ error: "Could not reach Plisio." }, { status: 502 });
  }

  if (data?.status !== "success" || !data.data?.invoice_url) {
    // If PLISIO_SECRET_KEY was rotated in the Plisio dashboard but not
    // updated (and redeployed — a Vercel env var change alone doesn't
    // reach an already-running function) in Vercel, this is exactly where
    // it surfaces: Plisio's own error name/message, logged here in full.
    console.error(
      `plisio create-invoice: Plisio rejected the request (uid=${uid}, plan=${plan}, http ${response.status}):`,
      data?.data ?? data,
    );
    return NextResponse.json({ error: "Could not create an invoice." }, { status: 502 });
  }

  return NextResponse.json({ invoiceUrl: data.data.invoice_url });
}
