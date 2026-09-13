// Tests firestore.rules against the local Firestore emulator — no network
// access to the real project, no service account needed. Run with:
//   npm run test:rules
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(join(__dirname, "..", "firestore.rules"), "utf8");

const testEnv = await initializeTestEnvironment({
  projectId: "demo-davar-test",
  firestore: { rules, host: "localhost", port: 8080 },
});

let pass = 0;
let fail = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    pass++;
  } catch (err) {
    console.log(`FAIL: ${name}`);
    console.log(`      ${err.message.split("\n")[0]}`);
    fail++;
  }
}

const ALICE = "alice-uid";
const BOB = "bob-uid";
const TODAY = "2026-09-13";

async function seedUser(uid, tier) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", uid), {
      uid,
      email: `${uid}@example.com`,
      displayName: null,
      photoURL: null,
      xp: 0,
      level: 1,
      timezone: "UTC",
      tier,
      premiumUntil: null,
    });
  });
}

await seedUser(ALICE, "free");
await seedUser(BOB, "premium");

const aliceDb = testEnv.authenticatedContext(ALICE).firestore();
const bobDb = testEnv.authenticatedContext(BOB).firestore();
const anonDb = testEnv.unauthenticatedContext().firestore();
const eveDb = testEnv.authenticatedContext("eve-uid").firestore();

// --- users/{uid} tier + premiumUntil lock ---
await check("a brand-new user cannot self-create with tier=premium", async () => {
  await assertFails(
    setDoc(doc(eveDb, "users", "eve-uid"), {
      uid: "eve-uid",
      email: null,
      displayName: null,
      photoURL: null,
      xp: 0,
      level: 1,
      timezone: null,
      tier: "premium",
      premiumUntil: null,
    }),
  );
});

await check("a brand-new user cannot self-create with a non-null premiumUntil", async () => {
  await assertFails(
    setDoc(doc(eveDb, "users", "eve-uid"), {
      uid: "eve-uid",
      email: null,
      displayName: null,
      photoURL: null,
      xp: 0,
      level: 1,
      timezone: null,
      tier: "free",
      premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }),
  );
});

await check("a brand-new user CAN self-create with tier=free, premiumUntil=null", async () => {
  await assertSucceeds(
    setDoc(doc(eveDb, "users", "eve-uid"), {
      uid: "eve-uid",
      email: null,
      displayName: null,
      photoURL: null,
      xp: 0,
      level: 1,
      timezone: null,
      tier: "free",
      premiumUntil: null,
    }),
  );
});

await check("alice cannot upgrade her own tier to premium via update", async () => {
  await assertFails(updateDoc(doc(aliceDb, "users", ALICE), { tier: "premium" }));
});

await check("alice cannot grant herself a premiumUntil date via update", async () => {
  await assertFails(
    updateDoc(doc(aliceDb, "users", ALICE), {
      premiumUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }),
  );
});

await check("alice CAN update other fields on her own user doc (e.g. displayName)", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "users", ALICE), { displayName: "Alice" }),
  );
});

// --- daily_lesson_progress cap, free tier ---
const aliceProgressId = `${ALICE}_${TODAY}`;

await check("alice (free) can complete her 1st lesson today", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1"],
    }),
  );
});

await check("alice (free) can complete her 2nd lesson today", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2"],
    }),
  );
});

await check("alice (free) can complete her 3rd lesson today", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
    }),
  );
});

await check("alice (free) is BLOCKED from a 4th lesson today", async () => {
  await assertFails(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3", "lesson-4"],
    }),
  );
});

await check("alice is still blocked even if she resends the exact same 4th write", async () => {
  await assertFails(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3", "lesson-4"],
    }),
  );
});

// --- daily_lesson_progress, premium tier bypasses the cap ---
const bobProgressId = `${BOB}_${TODAY}`;
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "daily_lesson_progress", bobProgressId), {
    userId: BOB,
    date: TODAY,
    completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
  });
});

await check("bob (premium) CAN complete a 4th lesson today", async () => {
  await assertSucceeds(
    updateDoc(doc(bobDb, "daily_lesson_progress", bobProgressId), {
      userId: BOB,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3", "lesson-4"],
    }),
  );
});

// --- cross-user tampering ---
await check("bob cannot write to alice's daily_lesson_progress doc", async () => {
  await assertFails(
    updateDoc(doc(bobDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3", "lesson-x"],
    }),
  );
});

await check("an unauthenticated client cannot read alice's progress doc", async () => {
  await assertFails(getDoc(doc(anonDb, "daily_lesson_progress", aliceProgressId)));
});

console.log(`\n${pass} passed, ${fail} failed`);
await testEnv.cleanup();
process.exit(fail > 0 ? 1 : 0);
