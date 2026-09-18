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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
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
// A date distinct from TODAY, used by the prayer-journal tests below so
// they run against a fresh (no-progress-doc-yet) day rather than
// colliding with alice's TODAY progress doc, which the
// daily_lesson_progress tests above deliberately drive to its cap.
const PRAYER_DATE = "2026-09-10";

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
      premiumSince: null,
      premiumUntil: null,
      planId: tier === "premium" ? "yearly" : null,
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

await check("a brand-new user cannot self-create with a non-null planId", async () => {
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
      premiumUntil: null,
      planId: "yearly",
    }),
  );
});

await check("a brand-new user cannot self-create with a non-null premiumSince", async () => {
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
      premiumSince: new Date(),
      premiumUntil: null,
      planId: null,
    }),
  );
});

await check(
  "a brand-new user CAN self-create with tier=free, premiumSince=null, premiumUntil=null, planId=null",
  async () => {
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
        premiumSince: null,
        premiumUntil: null,
        planId: null,
      }),
    );
  },
);

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

await check("alice cannot grant herself a planId via update", async () => {
  await assertFails(updateDoc(doc(aliceDb, "users", ALICE), { planId: "yearly" }));
});

await check("alice cannot grant herself a premiumSince date via update", async () => {
  await assertFails(updateDoc(doc(aliceDb, "users", ALICE), { premiumSince: new Date() }));
});

await check("alice CAN update other fields on her own user doc (e.g. displayName)", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "users", ALICE), { displayName: "Alice" }),
  );
});

// --- daily_lesson_progress event cap, free tier (1/day) ---
const aliceProgressId = `${ALICE}_${TODAY}`;

await check("alice (free) can complete her 1st lesson today", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1"],
      prayerCount: 0,
    }),
  );
});

await check("alice (free) is BLOCKED from a 2nd lesson today", async () => {
  await assertFails(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2"],
      prayerCount: 0,
    }),
  );
});

// --- daily_lesson_progress prayer cap, free tier (3/day) — separate from the event cap above ---
await check("alice (free) can submit a prayer today even though her event cap is used up", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1"],
      prayerCount: 1,
    }),
  );
});

await check("alice (free) can submit a 2nd prayer today", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1"],
      prayerCount: 2,
    }),
  );
});

await check("alice (free) can submit a 3rd prayer today", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1"],
      prayerCount: 3,
    }),
  );
});

await check("alice (free) is BLOCKED from a 4th prayer today", async () => {
  await assertFails(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1"],
      prayerCount: 4,
    }),
  );
});

await check("alice is still blocked even if she resends the exact same blocked write", async () => {
  await assertFails(
    updateDoc(doc(aliceDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1"],
      prayerCount: 4,
    }),
  );
});

// --- daily_lesson_progress, premium tier: 3/day events, 15/day prayers ---
const bobProgressId = `${BOB}_${TODAY}`;
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "daily_lesson_progress", bobProgressId), {
    userId: BOB,
    date: TODAY,
    completedLessonIds: ["lesson-1", "lesson-2"],
    prayerCount: 0,
  });
});

await check("bob (premium) CAN complete his 3rd lesson today", async () => {
  await assertSucceeds(
    updateDoc(doc(bobDb, "daily_lesson_progress", bobProgressId), {
      userId: BOB,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
      prayerCount: 0,
    }),
  );
});

await check("bob (premium) is BLOCKED from a 4th lesson today", async () => {
  await assertFails(
    updateDoc(doc(bobDb, "daily_lesson_progress", bobProgressId), {
      userId: BOB,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3", "lesson-4"],
      prayerCount: 0,
    }),
  );
});

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "daily_lesson_progress", bobProgressId), {
    userId: BOB,
    date: TODAY,
    completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
    prayerCount: 14,
  });
});

await check("bob (premium) CAN submit his 15th prayer today", async () => {
  await assertSucceeds(
    updateDoc(doc(bobDb, "daily_lesson_progress", bobProgressId), {
      userId: BOB,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
      prayerCount: 15,
    }),
  );
});

await check("bob (premium) is BLOCKED from a 16th prayer today", async () => {
  await assertFails(
    updateDoc(doc(bobDb, "daily_lesson_progress", bobProgressId), {
      userId: BOB,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
      prayerCount: 16,
    }),
  );
});

// --- cross-user tampering ---
await check("bob cannot write to alice's daily_lesson_progress doc", async () => {
  await assertFails(
    updateDoc(doc(bobDb, "daily_lesson_progress", aliceProgressId), {
      userId: ALICE,
      date: TODAY,
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-x"],
      prayerCount: 1,
    }),
  );
});

await check("an unauthenticated client cannot read alice's progress doc", async () => {
  await assertFails(getDoc(doc(anonDb, "daily_lesson_progress", aliceProgressId)));
});

// --- user_highlights: docId derived from uid + reference ---
const aliceHighlightId = `${ALICE}_John_3_16`;

await check("alice can highlight a verse (docId matches uid+book+chapter+verse)", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "user_highlights", aliceHighlightId), {
      id: aliceHighlightId,
      userId: ALICE,
      reference: "John 3:16",
      book: "John",
      chapter: 3,
      verse: 16,
      color: "clay",
    }),
  );
});

await check("alice cannot create a highlight under a docId that doesn't match the verse", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "user_highlights", `${ALICE}_wrong_id`), {
      id: `${ALICE}_wrong_id`,
      userId: ALICE,
      reference: "John 3:16",
      book: "John",
      chapter: 3,
      verse: 16,
      color: "clay",
    }),
  );
});

await check("alice cannot create a highlight claiming to be bob", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "user_highlights", `${BOB}_John_3_16`), {
      id: `${BOB}_John_3_16`,
      userId: BOB,
      reference: "John 3:16",
      book: "John",
      chapter: 3,
      verse: 16,
      color: "clay",
    }),
  );
});

await check("alice can re-color her own highlight (update, same docId)", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "user_highlights", aliceHighlightId), {
      id: aliceHighlightId,
      userId: ALICE,
      reference: "John 3:16",
      book: "John",
      chapter: 3,
      verse: 16,
      text: "For God so loved the world...",
      color: "sage",
    }),
  );
});

await check("alice can attach a personal note to her own highlight (update, notes only)", async () => {
  await assertSucceeds(
    updateDoc(doc(aliceDb, "user_highlights", aliceHighlightId), {
      notes: "This is the one my grandmother always quoted.",
    }),
  );
});

await check("bob cannot attach a note to alice's highlight", async () => {
  await assertFails(
    updateDoc(doc(bobDb, "user_highlights", aliceHighlightId), {
      notes: "not mine to edit",
    }),
  );
});

await check("bob cannot read alice's highlight", async () => {
  await assertFails(getDoc(doc(bobDb, "user_highlights", aliceHighlightId)));
});

await check("bob cannot delete alice's highlight", async () => {
  await assertFails(deleteDoc(doc(bobDb, "user_highlights", aliceHighlightId)));
});

await check("alice can delete her own highlight", async () => {
  await assertSucceeds(deleteDoc(doc(aliceDb, "user_highlights", aliceHighlightId)));
});

// --- list-query patterns used by Peter's Watch (check_ins, accountability_links) ---
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "check_ins", "checkin-1"), {
    id: "checkin-1",
    userId: ALICE,
    lessonId: null,
    type: "custom",
    date: TODAY,
    xpEarned: 10,
    notes: null,
  });
  await setDoc(doc(ctx.firestore(), "accountability_links", "link-1"), {
    id: "link-1",
    userId: BOB,
    partnerId: ALICE,
    initiatedBy: BOB,
    status: "active",
    respondedAt: null,
    shareStreak: true,
    shareLastCheckIn: true,
  });
});

await check("alice can list her own check_ins via a where(userId==self) query", async () => {
  const snap = await getDocs(query(collection(aliceDb, "check_ins"), where("userId", "==", ALICE)));
  if (snap.size !== 1) throw new Error(`expected 1 doc, got ${snap.size}`);
});

await check("alice can list accountability_links where she's the partner (not the initiator)", async () => {
  const snap = await getDocs(
    query(collection(aliceDb, "accountability_links"), where("partnerId", "==", ALICE)),
  );
  if (snap.size !== 1) throw new Error(`expected 1 doc, got ${snap.size}`);
});

// --- conversations/{uid}/messages: Peter's Watch AI chat, read-only for clients ---
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(
    doc(ctx.firestore(), "conversations", ALICE, "messages", "msg-1"),
    {
      id: "msg-1",
      role: "user",
      apostleId: null,
      text: "I fell into it again today.",
    },
  );
});

await check("alice can read her own conversation message", async () => {
  await assertSucceeds(getDoc(doc(aliceDb, "conversations", ALICE, "messages", "msg-1")));
});

await check("bob cannot read alice's conversation message", async () => {
  await assertFails(getDoc(doc(bobDb, "conversations", ALICE, "messages", "msg-1")));
});

await check("alice cannot write directly to her own conversation (server-only)", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "conversations", ALICE, "messages", "msg-2"), {
      id: "msg-2",
      role: "assistant",
      apostleId: "peter",
      text: "forged reply",
    }),
  );
});

// --- watch_chat_usage: server-only, no client access at all ---
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "watch_chat_usage", `${ALICE}_${TODAY}`), {
    userId: ALICE,
    date: TODAY,
    messageCount: 3,
  });
});

await check("alice cannot read her own watch_chat_usage counter", async () => {
  await assertFails(getDoc(doc(aliceDb, "watch_chat_usage", `${ALICE}_${TODAY}`)));
});

await check("alice cannot write her own watch_chat_usage counter", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "watch_chat_usage", `${ALICE}_${TODAY}`), {
      userId: ALICE,
      date: TODAY,
      messageCount: 0,
    }),
  );
});

// --- users/{uid}/prayers: the custom prayer journal ---
await check("alice can create her own prayer (id field matches the docId)", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-1"), {
      id: "prayer-1",
      text: "Thank you for today.",
      date: PRAYER_DATE,
    }),
  );
});

await check("alice cannot create a prayer whose id field doesn't match the docId", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-2"), {
      id: "wrong-id",
      text: "Thank you for today.",
      date: PRAYER_DATE,
    }),
  );
});

await check("alice cannot create an empty prayer", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-3"), {
      id: "prayer-3",
      text: "",
      date: PRAYER_DATE,
    }),
  );
});

await check("alice cannot create a prayer without a date field", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-4"), {
      id: "prayer-4",
      text: "Thank you for today.",
    }),
  );
});

await check("alice cannot write a prayer under bob's uid", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "users", BOB, "prayers", "prayer-1"), {
      id: "prayer-1",
      text: "Not mine to write.",
      date: PRAYER_DATE,
    }),
  );
});

await check("bob cannot read alice's prayers", async () => {
  await assertFails(getDoc(doc(bobDb, "users", ALICE, "prayers", "prayer-1")));
});

await check("alice can read her own prayer", async () => {
  await assertSucceeds(getDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-1")));
});

await check("alice cannot edit an existing prayer (immutable journal)", async () => {
  await assertFails(updateDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-1"), { text: "edited" }));
});

await check("alice cannot delete her own prayer", async () => {
  await assertFails(deleteDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-1")));
});

// --- prayers have their own daily cap, separate from event completions ---
// Seed a completed event lesson already used today, via the progress doc —
// this should NOT count against the prayer cap, since the two are tracked
// separately now (unlike the old combined cap).
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "daily_lesson_progress", `${ALICE}_${PRAYER_DATE}`), {
    userId: ALICE,
    date: PRAYER_DATE,
    completedLessonIds: ["lesson-x"],
    prayerCount: 0,
  });
});

await check("alice (free) can submit a prayer even though her event cap is used up today", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-5"), {
      id: "prayer-5",
      text: "One more thing, Lord.",
      date: PRAYER_DATE,
    }),
  );
  // Mirror what submitPrayer's own transaction would also do in the real
  // app, so the next check starts from the right running total.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "daily_lesson_progress", `${ALICE}_${PRAYER_DATE}`), {
      prayerCount: 1,
    });
  });
});

await check("alice (free) can submit a 2nd prayer today", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-6"), {
      id: "prayer-6",
      text: "Still going.",
      date: PRAYER_DATE,
    }),
  );
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "daily_lesson_progress", `${ALICE}_${PRAYER_DATE}`), {
      prayerCount: 2,
    });
  });
});

await check("alice (free) can submit a 3rd prayer today", async () => {
  await assertSucceeds(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-7"), {
      id: "prayer-7",
      text: "Almost done.",
      date: PRAYER_DATE,
    }),
  );
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await updateDoc(doc(ctx.firestore(), "daily_lesson_progress", `${ALICE}_${PRAYER_DATE}`), {
      prayerCount: 3,
    });
  });
});

await check("alice (free) is BLOCKED from a 4th prayer today", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "users", ALICE, "prayers", "prayer-8"), {
      id: "prayer-8",
      text: "Should be blocked.",
      date: PRAYER_DATE,
    }),
  );
});

// --- daily_verses / daily_devotionals / daily_prayers: Today tab content ---
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "daily_verses", "verse-01"), {
    id: "verse-01",
    order: 1,
    reference: "Isaiah 41:10",
    text: "So do not fear, for I am with you.",
  });
  await setDoc(doc(ctx.firestore(), "daily_devotionals", "devotional-01"), {
    id: "devotional-01",
    order: 1,
    title: "Small Beginnings",
    text: "Nothing about today has to be dramatic to matter.",
  });
  await setDoc(doc(ctx.firestore(), "daily_prayers", "prayer-daily-01"), {
    id: "prayer-daily-01",
    order: 1,
    title: "For Today",
    text: "Lord, thank you for this day.",
  });
});

await check("alice (signed in) can read a daily verse", async () => {
  await assertSucceeds(getDoc(doc(aliceDb, "daily_verses", "verse-01")));
});

await check("an unauthenticated client cannot read a daily verse", async () => {
  await assertFails(getDoc(doc(anonDb, "daily_verses", "verse-01")));
});

await check("alice cannot write a daily verse", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "daily_verses", "verse-02"), {
      id: "verse-02",
      order: 2,
      reference: "Joshua 1:9",
      text: "Be strong and courageous.",
    }),
  );
});

await check("alice (signed in) can read a daily devotional", async () => {
  await assertSucceeds(getDoc(doc(aliceDb, "daily_devotionals", "devotional-01")));
});

await check("alice cannot write a daily devotional", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "daily_devotionals", "devotional-02"), {
      id: "devotional-02",
      order: 2,
      title: "Fake",
      text: "Not managed content.",
    }),
  );
});

await check("alice (signed in) can read a daily prayer", async () => {
  await assertSucceeds(getDoc(doc(aliceDb, "daily_prayers", "prayer-daily-01")));
});

await check("alice cannot write a daily prayer", async () => {
  await assertFails(
    setDoc(doc(aliceDb, "daily_prayers", "prayer-daily-02"), {
      id: "prayer-daily-02",
      order: 2,
      title: "Fake",
      text: "Not managed content.",
    }),
  );
});

console.log(`\n${pass} passed, ${fail} failed`);
await testEnv.cleanup();
process.exit(fail > 0 ? 1 : 0);
