import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { pickForDate } from "@/lib/dailyContent";
import { dateKeyInTimeZone } from "@/lib/date";
import { COLLECTIONS, type DailyVerseDoc, type StreakDoc, type UserDoc } from "@/types/firestore";

// Needs the Admin SDK — not compatible with the edge runtime.
export const runtime = "nodejs";

// Fires once a day, at one fixed UTC time for every enabled user — not
// "8am in each user's own timezone" the way every other "today" in this
// app is computed (dateKeyInTimeZone, pickForDate both take a
// timezone). True per-user local-time delivery needs this route to run
// hourly so it can match each user's own local clock (see
// src/lib/date.ts's hourInTimeZone, written for exactly that and ready
// to use), but Vercel's Hobby plan only allows a cron job to fire once a
// day — an hourly schedule in vercel.json would likely fail to deploy
// there. This once-a-day version is the one that works regardless of
// plan: `lastDailyNotificationSentDate` (below) is still what makes it
// safe to run more than once a day, so going to Vercel Pro later is a
// two-line change — set vercel.json's schedule to `"0 * * * *"` and
// skip any user whose `hourInTimeZone(now, user.timezone ?? "UTC")`
// doesn't match the hour you want — not a rewrite.

// Notification bodies read badly past a couple of lines on a phone lock
// screen — truncate the verse text rather than let a long one run on.
const MAX_VERSE_CHARS = 120;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// FCM's own vocabulary for "this registration token will never work
// again" (uninstalled, permission revoked, app data cleared, or just a
// stale/malformed token) — worth pruning from fcmTokens the moment FCM
// says so; every other send failure (rate limiting, a transient
// network/server error) is left alone to retry on the next scheduled
// send rather than discarding a token that might still be good.
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("cron daily-notification: CRON_SECRET is not configured");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const usersSnap = await adminDb()
    .collection(COLLECTIONS.users)
    .where("notificationsEnabled", "==", true)
    .get();

  if (usersSnap.empty) {
    return NextResponse.json({ checked: 0, sent: 0 });
  }

  // Same pool TodayTab/Dashboard pick from client-side (fetchDailyVerses +
  // pickForDate, src/lib/db/dailyContent.ts + src/lib/dailyContent.ts) —
  // reused here via the Admin SDK rather than duplicated, so the verse in
  // the notification is always exactly the one the app shows that day.
  const versesSnap = await adminDb().collection(COLLECTIONS.dailyVerses).orderBy("order").get();
  const dailyVerses = versesSnap.docs.map((d) => d.data() as DailyVerseDoc);

  const now = new Date();
  let sent = 0;
  let skippedAlreadySentToday = 0;
  let skippedNoTokens = 0;

  for (const userSnap of usersSnap.docs) {
    const user = userSnap.data() as UserDoc;
    const uid = userSnap.id;
    const timeZone = user.timezone ?? "UTC";
    const today = dateKeyInTimeZone(now, timeZone);
    if (user.lastDailyNotificationSentDate === today) {
      skippedAlreadySentToday++;
      continue;
    }

    const tokens = user.fcmTokens ?? [];
    if (tokens.length === 0) {
      // Nothing to send to — don't record lastDailyNotificationSentDate,
      // so this user is simply reconsidered (cheaply) on the next day's
      // run rather than silently skipped once they do register a device.
      skippedNoTokens++;
      continue;
    }

    const verse = pickForDate(dailyVerses, today);
    const streakSnap = await adminDb().collection(COLLECTIONS.streaks).doc(uid).get();
    const streak = streakSnap.exists ? (streakSnap.data() as StreakDoc) : null;

    const verseLine = verse
      ? `${verse.reference} — "${truncate(verse.text, MAX_VERSE_CHARS)}"`
      : "Your daily verse is ready.";
    const streakLine =
      streak && streak.currentCount > 0 ? ` Day ${streak.currentCount} streak — keep it going.` : "";

    // Data-only (no top-level `notification` field) — worker/index.ts's
    // onBackgroundMessage is what actually displays this, so there's
    // exactly one notification shown, never a duplicate from FCM's own
    // default display.
    const response = await adminMessaging().sendEachForMulticast({
      tokens,
      data: { title: "Davar", body: `${verseLine}${streakLine}`, url: "/" },
    });

    const deadTokens = response.responses
      .map((r, i) => (!r.success && DEAD_TOKEN_CODES.has(r.error?.code ?? "") ? tokens[i] : null))
      .filter((t): t is string => t !== null);

    await userSnap.ref.update({
      lastDailyNotificationSentDate: today,
      ...(deadTokens.length > 0 ? { fcmTokens: FieldValue.arrayRemove(...deadTokens) } : {}),
    });
    sent += response.successCount;
  }

  console.log(
    `cron daily-notification: checked ${usersSnap.size} enabled users, sent to ${sent}, ` +
      `skipped (already sent today: ${skippedAlreadySentToday}, no tokens: ${skippedNoTokens})`,
  );

  return NextResponse.json({
    checked: usersSnap.size,
    sent,
    skippedAlreadySentToday,
    skippedNoTokens,
  });
}
