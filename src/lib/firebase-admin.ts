import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server-only (Admin SDK) — never imported from client components. Used by
// the Plisio routes to verify a caller's ID token and to write `tier`,
// which client-side Firestore rules refuse to let anyone but this credential
// change (see firestore.rules). Configure via three separate env vars
// rather than one JSON blob — simpler to paste into Vercel without escaping
// issues, and FIREBASE_PRIVATE_KEY's literal "\n" sequences are restored to
// real newlines below since most env var UIs can't store them directly.
function adminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are not configured — set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (see README).",
    );
  }

  // The #1 cause of "every ID token fails verification, even one from a
  // user who just signed in" is this env var silently pointing at a
  // different Firebase project than the one the client actually
  // authenticates against — verifyIdToken() checks the token's `aud`
  // claim against exactly this value, and rejects every single token if
  // it doesn't match, with no relation to whether the token is actually
  // fresh. NEXT_PUBLIC_ only controls client-bundle exposure, not server
  // visibility, so it's readable here too — catch the mismatch loudly at
  // startup instead of letting it surface only as a downstream 401.
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (clientProjectId && clientProjectId !== projectId) {
    console.error(
      `firebase-admin: FIREBASE_PROJECT_ID ("${projectId}") does not match ` +
        `NEXT_PUBLIC_FIREBASE_PROJECT_ID ("${clientProjectId}") — every ID token ` +
        "verifyIdToken() sees will fail with an \"aud\" (audience) claim mismatch. " +
        "The Admin SDK service account must be from the same Firebase project as " +
        "the client config.",
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

/**
 * Logs the specific reason an incoming ID token failed verification.
 * Every route that calls adminAuth().verifyIdToken() used to swallow the
 * error entirely and return a generic "session expired" message — which
 * made a real, fixable cause (e.g. the project-ID mismatch above, or an
 * actually-expired token) indistinguishable in the logs. Call this from
 * the catch block, then still return your own generic error to the
 * client — the specific reason belongs in server logs, not the response.
 */
export function logTokenVerificationError(route: string, err: unknown): void {
  const code =
    err && typeof err === "object" && "code" in err ? String((err as { code?: unknown }).code) : "unknown";
  const message = err instanceof Error ? err.message : String(err);
  console.error(`${route}: ID token verification failed (code=${code}): ${message}`);
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
