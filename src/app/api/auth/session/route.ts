import { NextResponse } from "next/server";
import { adminAuth, logTokenVerificationError } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/lib/admin/sessionCookie";

// Needs the Admin SDK — not compatible with the edge runtime.
export const runtime = "nodejs";

// Firebase session cookies max out at 14 days; 5 keeps re-auth frequent
// without being annoying — there's no refresh flow here, so once this
// expires the user just needs to sign in again (auth-context.tsx re-mints
// it on every sign-in, including a restored session on app load).
const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000;

/**
 * Exchanges a fresh Firebase ID token (short-lived, client-side only) for
 * an httpOnly session cookie the server can read on every request — the
 * one piece of server-side session state this app has, that exists solely
 * so /admin (see src/lib/admin/session.ts) can be gated in a Server
 * Component with a real redirect, not just a client-side check. Called
 * from AuthProvider on every sign-in (including a restored session on
 * page load), not from anywhere a user interacts with directly.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const idToken = typeof body?.idToken === "string" ? body.idToken : null;
  if (!idToken) {
    return NextResponse.json({ error: "Missing ID token." }, { status: 400 });
  }

  let sessionCookie: string;
  try {
    // Also verifies the token (rejects anything expired, forged, or from a
    // different Firebase project) before minting the cookie.
    sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS });
  } catch (err) {
    logTokenVerificationError("auth/session POST", err);
    return NextResponse.json({ error: "Could not start a session." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRES_IN_MS / 1000,
  });
  return res;
}

/** Clears the session cookie on sign-out. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}
