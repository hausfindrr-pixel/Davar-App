#!/usr/bin/env node
// Grants (or revokes) /admin access by setting `isAdmin` on a user's own
// users/{uid} doc — see UserDoc, src/types/firestore.ts. This is the ONLY
// supported way to set that field: firestore.rules locks it from every
// client write (the same way `tier` is locked), so there's no in-app UI
// for this on purpose.
//
// Usage:
//   1. Firebase console -> Project settings -> Service accounts ->
//      Generate new private key. Save it as serviceAccountKey.json at the
//      repo root (gitignored — never commit it).
//   2. node scripts/set-admin.mjs you@example.com
//
// Or point at a key stored elsewhere, and/or revoke instead of grant:
//   SEED_SERVICE_ACCOUNT_KEY=/path/to/key.json node scripts/set-admin.mjs you@example.com
//   node scripts/set-admin.mjs you@example.com --revoke

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath =
  process.env.SEED_SERVICE_ACCOUNT_KEY ?? join(__dirname, "..", "serviceAccountKey.json");

const args = process.argv.slice(2).filter((arg) => arg !== "--revoke");
const revoke = process.argv.includes("--revoke");
const email = args[0];

if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <email> [--revoke]");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, "utf8"));
} catch (error) {
  console.error(`Couldn't read service account key at ${keyPath}.`);
  console.error(
    "Generate one from the Firebase console (Project settings -> Service accounts " +
      "-> Generate new private key), save it as serviceAccountKey.json at the repo " +
      "root, or point SEED_SERVICE_ACCOUNT_KEY at it.",
  );
  console.error(error.message);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

let uid;
try {
  uid = (await auth.getUserByEmail(email)).uid;
} catch (error) {
  console.error(`No Firebase Auth user found for ${email} — have they signed up yet?`);
  console.error(error.message);
  process.exit(1);
}

const ref = db.collection("users").doc(uid);
const snap = await ref.get();
if (!snap.exists) {
  console.error(
    `Found the Auth account for ${email} (uid ${uid}), but users/${uid} doesn't exist yet — ` +
      "they need to have opened the app at least once before this can run.",
  );
  process.exit(1);
}

await ref.update({ isAdmin: !revoke });
console.log(`${revoke ? "Revoked" : "Granted"} /admin access for ${email} (uid ${uid}).`);
