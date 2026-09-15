import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Turns whatever shape FIREBASE_PRIVATE_KEY ended up in after a paste into
 * Vercel's env var UI back into a real PEM string. Handles every variant
 * actually seen in practice (verified against Node's own PEM parser, not
 * just pattern-matched):
 * - a real multiline paste (already has real newlines — passes through)
 * - the standard trick of pasting the downloaded service account JSON's
 *   `private_key` field text as-is, literal "\n" sequences and all
 * - the same, but with a Windows-edited key whose newlines got escaped as
 *   literal "\r\n" instead of "\n"
 * - either of the above with an accidental pair of surrounding quote
 *   characters (a very easy copy-paste mistake: the quotes are PART of the
 *   JSON file's string delimiters, not the key itself)
 * - stray leading/trailing whitespace from the copy
 */
function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1).trim();
  }
  key = key.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  return key;
}

// Server-only (Admin SDK) — never imported from client components. Used by
// the Plisio routes to verify a caller's ID token and to write `tier`,
// which client-side Firestore rules refuse to let anyone but this credential
// change (see firestore.rules). Configure via three separate env vars
// rather than one JSON blob — simpler to paste into Vercel without escaping
// issues; see normalizePrivateKey() above for exactly which pasted shapes
// of FIREBASE_PRIVATE_KEY it accepts.
function adminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin credentials are not configured — set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY (see README).",
    );
  }

  // Fail loudly and specifically here, at startup, rather than letting a
  // malformed key surface later as a cryptic "Failed to parse" error deep
  // inside the Admin SDK's own crypto/JWT-signing code the first time it's
  // actually used (which is exactly what a raw parse failure looks like
  // from a route's try/catch — see logTokenVerificationError below).
  if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY doesn't look like a valid PEM private key after normalization " +
        "— double-check it was pasted correctly (see README's Firebase Admin SDK section " +
        "for the exact expected format).",
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
