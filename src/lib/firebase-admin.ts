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

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}

export function adminAuth(): Auth {
  return getAuth(adminApp());
}
