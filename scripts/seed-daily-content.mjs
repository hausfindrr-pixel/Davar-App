#!/usr/bin/env node
// Seeds the daily_verses, daily_devotionals, and daily_prayers collections
// (the Today tab's rotating daily content) from
// scripts/daily-content-data.mjs, using the Firebase Admin SDK — client
// writes to these collections are denied by firestore.rules on purpose
// (managed content, not user data), so seeding needs an admin credential.
//
// Usage:
//   1. Firebase console -> Project settings -> Service accounts ->
//      Generate new private key. Save it as serviceAccountKey.json at the
//      repo root (gitignored — never commit it).
//   2. npm run seed:daily-content
//
// Or point at a key stored elsewhere:
//   SEED_SERVICE_ACCOUNT_KEY=/path/to/key.json npm run seed:daily-content

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { dailyDevotionals, dailyPrayers, dailyVerses } from "./daily-content-data.mjs";

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

async function seedCollection(name, items) {
  for (const item of items) {
    const { id, ...fields } = item;
    const ref = db.collection(name).doc(id);
    const snap = await ref.get();
    const payload = snap.exists
      ? { id, ...fields }
      : { id, ...fields, createdAt: FieldValue.serverTimestamp() };
    await ref.set(payload, { merge: true });
    console.log(`seeded ${name}/${id}${snap.exists ? " (updated)" : " (created)"}`);
  }
}

await seedCollection("daily_verses", dailyVerses);
await seedCollection("daily_devotionals", dailyDevotionals);
await seedCollection("daily_prayers", dailyPrayers);

console.log(
  `Done — seeded ${dailyVerses.length} verses, ${dailyDevotionals.length} devotionals, ${dailyPrayers.length} prayers.`,
);
