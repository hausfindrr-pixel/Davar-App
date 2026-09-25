import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/types/firestore";
import { SESSION_COOKIE_NAME } from "@/lib/admin/sessionCookie";

/**
 * The *authoritative* check behind /admin — verifies the httpOnly session
 * cookie (see src/app/api/auth/session/route.ts) via the Admin SDK, then
 * confirms that uid's own users/{uid} doc has `isAdmin: true`. Both steps
 * are needed: a valid session cookie only proves who's signed in, not that
 * they're an admin — `isAdmin` is never embedded in the cookie/token
 * itself, so revoking it takes effect on this check's very next call, not
 * after some token/claim cache expires.
 *
 * Call this from every admin-facing Server Component and Route Handler
 * individually (see the Next.js authentication guide's Data Access Layer
 * pattern) — never rely on src/proxy.ts alone, which only does a cheap,
 * optimistic cookie-presence check as a pre-filter.
 */
export async function verifyAdminSession(): Promise<{ uid: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  let uid: string;
  try {
    const decoded = await adminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    // Expired, revoked, or forged — never distinguish which to the caller.
    return null;
  }

  const userSnap = await adminDb().collection(COLLECTIONS.users).doc(uid).get();
  if (userSnap.data()?.isAdmin !== true) return null;

  return { uid };
}
