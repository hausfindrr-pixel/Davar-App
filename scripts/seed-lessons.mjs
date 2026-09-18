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

// Fields from lesson shapes this schema no longer has (the old
// ReadingLessonDoc/FillBlankLessonDoc split, replaced by a single LessonDoc
// with `summary` + `verseActivity`) — explicitly deleted below so
// merge:true doesn't leave them stranded on docs seeded under the old
// shape (the 3 lessons that used to be pure fillBlank entries).
const OBSOLETE_FIELDS = ["lessonType", "template", "answers", "wordBank"];

for (const lesson of lessons) {
  const { id, ...fields } = lesson;
  const ref = db.collection("lessons").doc(id);
  // merge: true so re-running this to backfill a new field (e.g. lessonBook)
  // onto existing docs doesn't blow away fields it doesn't know about; the
  // createdAt stamp is only added on first creation so it isn't reset on
  // every re-run either.
  const snap = await ref.get();
  const payload = snap.exists
    ? {
        id,
        ...fields,
        ...Object.fromEntries(OBSOLETE_FIELDS.map((field) => [field, FieldValue.delete()])),
      }
    : { id, ...fields, createdAt: FieldValue.serverTimestamp() };
  await ref.set(payload, { merge: true });
  console.log(`seeded lessons/${id}${snap.exists ? " (updated)" : " (created)"}`);
}

console.log(`Done — seeded ${lessons.length} lessons.`);
