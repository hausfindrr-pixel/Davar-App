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

  let data: { status?: string; data?: { invoice_url?: string; message?: string } } | null = null;
  try {
    const response = await fetch(`https://api.plisio.net/api/v1/invoices/new?${params.toString()}`);
    data = await response.json();
  } catch (err) {
    console.error("plisio create-invoice: request to Plisio failed", err);
    return NextResponse.json({ error: "Could not reach Plisio." }, { status: 502 });
  }

  if (data?.status !== "success" || !data.data?.invoice_url) {
    console.error("plisio create-invoice: Plisio returned an error", data?.data?.message ?? data);
    return NextResponse.json({ error: "Could not create an invoice." }, { status: 502 });
  }

  return NextResponse.json({ invoiceUrl: data.data.invoice_url });
}
