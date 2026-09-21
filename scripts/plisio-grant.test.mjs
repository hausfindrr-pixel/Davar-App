// Integration test for src/lib/plisio/grant.ts's grantPremium — the core
// business logic the Plisio webhook applies on a "completed" callback.
// Runs against the Firestore emulator (Admin SDK, rules bypassed — rules
// themselves are covered separately by scripts/rules-test.mjs) so it can
// exercise the real transaction, including idempotency and the
// extend-from-current-premiumUntil renewal fix, without needing real
// Admin SDK credentials or an HTTP round trip through the route itself.
//
// Run with: npm run test:plisio-grant
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { grantPremium } from "../src/lib/plisio/grant.ts";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("This test must run against the Firestore emulator — use `npm run test:plisio-grant`.");
  process.exit(1);
}

initializeApp({ projectId: "demo-davar-test" });
const db = getFirestore();

let pass = 0;
let fail = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log("PASS:", name);
    pass++;
  } catch (err) {
    console.log("FAIL:", name, "—", err.message);
    fail++;
  }
}

function assertEqual(got, want, label) {
  if (got !== want) throw new Error(`${label}: got ${got}, want ${want}`);
}

const DAY = 24 * 60 * 60 * 1000;

async function seedUser(uid, premiumUntilMs) {
  await db.collection("users").doc(uid).set({
    uid,
    tier: premiumUntilMs !== null ? "premium" : "free",
    premiumSince: premiumUntilMs !== null ? Timestamp.now() : null,
    premiumUntil: premiumUntilMs !== null ? Timestamp.fromMillis(premiumUntilMs) : null,
    planId: premiumUntilMs !== null ? "monthly" : null,
  });
}

// --- Scenario 1: first-time purchase ---
await check("a first-time monthly purchase grants ~30 days from now", async () => {
  const uid = "user-first-time";
  await seedUser(uid, null);
  const before = Date.now();

  const { duplicate } = await grantPremium(db, "order-first-time", uid, "monthly", "txn-1");
  assertEqual(duplicate, false, "duplicate");

  const snap = await db.collection("users").doc(uid).get();
  const data = snap.data();
  assertEqual(data.tier, "premium", "tier");
  const untilMs = data.premiumUntil.toMillis();
  const expectedMs = before + 30 * DAY;
  if (Math.abs(untilMs - expectedMs) > 5000) {
    throw new Error(`premiumUntil off by ${untilMs - expectedMs}ms`);
  }
});

// --- Scenario 2: idempotency — the same order redelivered must not double-extend ---
await check("redelivering the same order's callback does not double-extend", async () => {
  const uid = "user-idempotent";
  await seedUser(uid, null);

  const first = await grantPremium(db, "order-idempotent", uid, "monthly", "txn-2");
  assertEqual(first.duplicate, false, "first delivery duplicate flag");
  const afterFirst = (await db.collection("users").doc(uid).get()).data().premiumUntil.toMillis();

  // Simulate Plisio redelivering the exact same "completed" callback.
  const second = await grantPremium(db, "order-idempotent", uid, "monthly", "txn-2");
  assertEqual(second.duplicate, true, "second delivery duplicate flag");
  const afterSecond = (await db.collection("users").doc(uid).get()).data().premiumUntil.toMillis();

  assertEqual(afterSecond, afterFirst, "premiumUntil after a duplicate delivery");
});

// --- Scenario 3: the bug this audit fixes — renewing early must not forfeit remaining time ---
await check("renewing 5 days before expiry extends from the existing premiumUntil, not from now", async () => {
  const uid = "user-renewal";
  const currentUntilMs = Date.now() + 5 * DAY;
  await seedUser(uid, currentUntilMs);

  const { duplicate } = await grantPremium(db, "order-renewal", uid, "monthly", "txn-3");
  assertEqual(duplicate, false, "duplicate");

  const newUntilMs = (await db.collection("users").doc(uid).get()).data().premiumUntil.toMillis();
  const expectedMs = currentUntilMs + 30 * DAY;
  if (Math.abs(newUntilMs - expectedMs) > 5000) {
    throw new Error(
      `premiumUntil off by ${newUntilMs - expectedMs}ms — got ${new Date(newUntilMs).toISOString()}, ` +
        `expected ~${new Date(expectedMs).toISOString()} (old expiry + 30 days, NOT now + 30 days)`,
    );
  }
});

// --- Scenario 4: a lapsed grant renews from now, not from the stale expiry date ---
await check("renewing after premium already lapsed starts fresh from now", async () => {
  const uid = "user-lapsed";
  const staleUntilMs = Date.now() - 10 * DAY;
  await seedUser(uid, staleUntilMs);
  const before = Date.now();

  await grantPremium(db, "order-lapsed", uid, "yearly", "txn-4");

  const newUntilMs = (await db.collection("users").doc(uid).get()).data().premiumUntil.toMillis();
  const expectedMs = before + 365 * DAY;
  if (Math.abs(newUntilMs - expectedMs) > 5000) {
    throw new Error(`premiumUntil off by ${newUntilMs - expectedMs}ms`);
  }
});

// --- Scenario 5: a missing user doc fails loudly rather than silently doing nothing ---
await check("granting to a nonexistent user throws (nothing to silently swallow)", async () => {
  try {
    await grantPremium(db, "order-orphan", "user-does-not-exist", "monthly", "txn-5");
    throw new Error("expected grantPremium to throw");
  } catch (err) {
    if (!err.message.includes("does not exist")) throw err;
  }
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
