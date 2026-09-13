#!/usr/bin/env node
// Seeds the `lessons` collection from scripts/lessons-data.mjs using the
// Firebase Admin SDK. Client writes to `lessons` are denied by
// firestore.rules on purpose (see that file) — lessons are managed content,
// not user data — so seeding needs an admin credential, not the app's
// normal client config.
//
// Usage:
//   1. Firebase console -> Project settings -> Service accounts ->
//      Generate new private key. Save it as serviceAccountKey.json at the
//      repo root (gitignored — never commit it).
//   2. npm run seed:lessons
//
// Or point at a key stored elsewhere:
//   SEED_SERVICE_ACCOUNT_KEY=/path/to/key.json npm run seed:lessons

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { lessons } from "./lessons-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath =
  process.env.SEED_SERVICE_ACCOUNT_KEY ??
  join(__dirname, "..", "serviceAccountKey.json");

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
const db = getFirestore();

for (const lesson of lessons) {
  const { id, ...fields } = lesson;
  await db
    .collection("lessons")
    .doc(id)
    .set({ id, ...fields, createdAt: FieldValue.serverTimestamp() });
  console.log(`seeded lessons/${id}`);
}

console.log(`Done — seeded ${lessons.length} lessons.`);
