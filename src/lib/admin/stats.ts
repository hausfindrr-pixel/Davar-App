import { AggregateField, Timestamp } from "firebase-admin/firestore";
import type { CollectionReference, Query } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { PLANS, type PlanId } from "@/lib/plisio/plans";
import { COLLECTIONS, type PaymentEventDoc, type UserDoc, type WatchChatUsageDoc } from "@/types/firestore";

/**
 * All read-side aggregation for the admin dashboard (app/admin/page.tsx) —
 * Admin SDK only, so it bypasses firestore.rules entirely rather than
 * needing them opened up for cross-user reads. Every function here is
 * computed live, on each dashboard load, not from a precomputed rollup:
 * at the app's current scale, Firestore's count()/sum() aggregation
 * queries (billed per matched index entry, not per document) and a few
 * small, `limit()`-ed document reads are cheap enough that a nightly
 * cron-maintained rollup collection would be optimizing a cost that
 * doesn't exist yet. If usage ever grows enough to matter, the fix is a
 * Vercel Cron job (same pattern as /api/cron/expire-premium) writing
 * compact rollup docs — not a change to this module's shape, just a
 * caching layer in front of it.
 */

const DAY_MS = 86_400_000;
const SONNET_5_INPUT_USD_PER_M = 2;
const SONNET_5_OUTPUT_USD_PER_M = 10;
const EXPIRING_SOON_DAYS = 7;

function utcDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Sums a plan's fixed USD price across `count` granted payments — revenue
 * is derived from what was actually invoiced per plan, not from the raw
 * `sourceAmount` string logged on PaymentEventDoc (kept as a string there
 * purely for audit fidelity, and can vary slightly with crypto
 * overpayment). Assumes PLANS' prices are stable over time; if a price is
 * ever changed, older granted payments will be valued at the *current*
 * price here, not what was actually charged at the time — acceptable for
 * an operational dashboard, called out so it isn't mistaken for exact
 * accounting. */
function planPriceUsd(plan: PlanId): number {
  return Number(PLANS[plan].amount);
}

export interface DayCount {
  date: string; // "YYYY-MM-DD", UTC
  count: number;
}

export interface DayAmount {
  date: string;
  amountUsd: number;
}

/** Buckets documents matching `since`+`extra` by their `timestampField`'s
 * UTC day, reading only that field (a Firestore `select()` projection) to
 * keep the read cheap. Used for any "count per day, last N days" chart —
 * there's no Firestore aggregation primitive for "group by day", so this
 * is a bounded, small document read rather than an aggregation query. */
async function countsByDay(
  collectionRef: CollectionReference,
  timestampField: string,
  days: number,
  extra?: (q: Query) => Query,
): Promise<DayCount[]> {
  const since = Timestamp.fromMillis(Date.now() - days * DAY_MS);
  let q: Query = collectionRef.where(timestampField, ">=", since);
  if (extra) q = extra(q);
  // Safety cap, not an expected ceiling — this app is nowhere near it; it
  // just keeps a single admin dashboard load bounded no matter what.
  const snap = await q.select(timestampField).limit(20_000).get();

  const buckets = new Map<string, number>();
  for (const docSnap of snap.docs) {
    const ts = docSnap.get(timestampField) as Timestamp | undefined;
    if (!ts) continue;
    const key = utcDayKey(ts.toMillis());
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const result: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = utcDayKey(Date.now() - i * DAY_MS);
    result.push({ date: key, count: buckets.get(key) ?? 0 });
  }
  return result;
}

export interface AdminUserStats {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  active1d: number;
  active7d: number;
  active30d: number;
  signupsByDay: DayCount[];
}

export async function getUserStats(): Promise<AdminUserStats> {
  const users = adminDb().collection(COLLECTIONS.users);
  const now = Date.now();

  const [totalSnap, freeSnap, premiumSnap, active1dSnap, active7dSnap, active30dSnap, signupsByDay] =
    await Promise.all([
      users.count().get(),
      users.where("tier", "==", "free").count().get(),
      users.where("tier", "==", "premium").count().get(),
      users.where("lastActiveAt", ">=", Timestamp.fromMillis(now - 1 * DAY_MS)).count().get(),
      users.where("lastActiveAt", ">=", Timestamp.fromMillis(now - 7 * DAY_MS)).count().get(),
      users.where("lastActiveAt", ">=", Timestamp.fromMillis(now - 30 * DAY_MS)).count().get(),
      countsByDay(users, "createdAt", 30),
    ]);

  return {
    totalUsers: totalSnap.data().count,
    freeUsers: freeSnap.data().count,
    premiumUsers: premiumSnap.data().count,
    active1d: active1dSnap.data().count,
    active7d: active7dSnap.data().count,
    active30d: active30dSnap.data().count,
    signupsByDay,
  };
}

export interface AdminRetentionCohort {
  cohortStart: string; // Monday of the signup week, "YYYY-MM-DD"
  cohortSize: number;
  stillActive7d: number;
}

/** For each of the last `weeks` signup weeks, how many of the users who
 * signed up that week were active (lastActiveAt) in the last 7 days —
 * both numbers via count() aggregation (2 queries per cohort, no document
 * reads), using the composite index on (createdAt, lastActiveAt) declared
 * in firestore.indexes.json (two range filters on different fields need
 * one — Firestore can't build it automatically). */
export async function getRetention(weeks = 8): Promise<AdminRetentionCohort[]> {
  const users = adminDb().collection(COLLECTIONS.users);
  const activeCutoff = Timestamp.fromMillis(Date.now() - 7 * DAY_MS);

  // Monday-anchored weeks in UTC, most recent complete-ish week last.
  const nowDate = new Date();
  const dayOfWeek = (nowDate.getUTCDay() + 6) % 7; // 0 = Monday
  const thisWeekMonday = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate() - dayOfWeek,
  );

  const cohorts: { start: number; end: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = thisWeekMonday - i * 7 * DAY_MS;
    cohorts.push({ start, end: start + 7 * DAY_MS });
  }

  return Promise.all(
    cohorts.map(async ({ start, end }) => {
      const startTs = Timestamp.fromMillis(start);
      const endTs = Timestamp.fromMillis(end);
      const [sizeSnap, activeSnap] = await Promise.all([
        users.where("createdAt", ">=", startTs).where("createdAt", "<", endTs).count().get(),
        users
          .where("createdAt", ">=", startTs)
          .where("createdAt", "<", endTs)
          .where("lastActiveAt", ">=", activeCutoff)
          .count()
          .get(),
      ]);
      return {
        cohortStart: utcDayKey(start),
        cohortSize: sizeSnap.data().count,
        stillActive7d: activeSnap.data().count,
      };
    }),
  );
}

export interface AdminPaymentRow {
  orderNumber: string | null;
  uid: string | null;
  email: string | null;
  plan: PlanId | null;
  amountUsd: number | null;
  status: string | null;
  result: PaymentEventDoc["result"];
  receivedAtMs: number;
}

export interface AdminExpiringPremiumRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  planId: PlanId | null;
  premiumUntilMs: number;
  daysRemaining: number;
  expiringSoon: boolean;
}

export interface AdminRevenueStats {
  totalRevenueUsd: number;
  revenueByDay: DayAmount[];
  recentPayments: AdminPaymentRow[];
  problemInvoices: AdminPaymentRow[];
  activePremiumCount: number;
  premiumByPlan: Record<string, number>;
  expiringPremium: AdminExpiringPremiumRow[];
}

/** Batch-fetches a small set of users/{uid} docs and returns a uid->email
 * lookup — used to join payment/usage rows (which only carry a uid) with a
 * human-readable email for the dashboard's tables, without a per-row read. */
async function emailsByUid(uids: (string | null)[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(uids.filter((u): u is string => !!u))];
  if (unique.length === 0) return new Map();
  const refs = unique.map((uid) => adminDb().collection(COLLECTIONS.users).doc(uid));
  const snaps = await adminDb().getAll(...refs);
  const map = new Map<string, string | null>();
  for (const snap of snaps) {
    if (snap.exists) map.set(snap.id, (snap.data()?.email as string | null | undefined) ?? null);
  }
  return map;
}

function toPaymentRow(data: PaymentEventDoc, email: string | null): AdminPaymentRow {
  return {
    orderNumber: data.orderNumber,
    uid: data.uid,
    email,
    plan: data.plan,
    amountUsd: data.plan ? planPriceUsd(data.plan) : null,
    status: data.status,
    result: data.result,
    receivedAtMs: data.receivedAt?.toMillis() ?? 0,
  };
}

export async function getRevenueStats(): Promise<AdminRevenueStats> {
  const paymentEvents = adminDb().collection(COLLECTIONS.paymentEvents);
  const users = adminDb().collection(COLLECTIONS.users);

  const [
    grantedMonthlySnap,
    grantedYearlySnap,
    recentGrantedSnap,
    problemSnap,
    revenueByDay,
    activePremiumSnap,
  ] = await Promise.all([
    paymentEvents.where("result", "==", "granted").where("plan", "==", "monthly").count().get(),
    paymentEvents.where("result", "==", "granted").where("plan", "==", "yearly").count().get(),
    paymentEvents.where("result", "==", "granted").orderBy("receivedAt", "desc").limit(50).get(),
    paymentEvents
      .where("result", "in", ["underpaid", "error"])
      .orderBy("receivedAt", "desc")
      .limit(50)
      .get(),
    countsByDayAmount(paymentEvents, 30),
    users.where("tier", "==", "premium").orderBy("premiumUntil", "asc").limit(500).get(),
  ]);

  const totalRevenueUsd =
    grantedMonthlySnap.data().count * planPriceUsd("monthly") +
    grantedYearlySnap.data().count * planPriceUsd("yearly");

  const paymentUids = [
    ...recentGrantedSnap.docs.map((d) => (d.data() as PaymentEventDoc).uid),
    ...problemSnap.docs.map((d) => (d.data() as PaymentEventDoc).uid),
  ];
  const emailMap = await emailsByUid(paymentUids);

  const recentPayments = recentGrantedSnap.docs.map((d) => {
    const data = d.data() as PaymentEventDoc;
    return toPaymentRow(data, data.uid ? emailMap.get(data.uid) ?? null : null);
  });
  const problemInvoices = problemSnap.docs.map((d) => {
    const data = d.data() as PaymentEventDoc;
    return toPaymentRow(data, data.uid ? emailMap.get(data.uid) ?? null : null);
  });

  const now = Date.now();
  const premiumByPlan: Record<string, number> = { monthly: 0, yearly: 0 };
  const expiringPremium: AdminExpiringPremiumRow[] = [];
  for (const docSnap of activePremiumSnap.docs) {
    const user = docSnap.data() as UserDoc;
    if (user.planId) premiumByPlan[user.planId] = (premiumByPlan[user.planId] ?? 0) + 1;
    const premiumUntilMs = user.premiumUntil?.toMillis() ?? 0;
    const daysRemaining = Math.ceil((premiumUntilMs - now) / DAY_MS);
    expiringPremium.push({
      uid: docSnap.id,
      email: user.email,
      displayName: user.displayName,
      planId: user.planId,
      premiumUntilMs,
      daysRemaining,
      expiringSoon: daysRemaining <= EXPIRING_SOON_DAYS,
    });
  }

  return {
    totalRevenueUsd,
    revenueByDay,
    recentPayments,
    problemInvoices,
    activePremiumCount: activePremiumSnap.size,
    premiumByPlan,
    expiringPremium,
  };
}

/** Same shape as countsByDay, but sums each granted payment's plan price
 * instead of just counting rows — used for the revenue trend chart. An
 * equality filter (result) plus a range filter (receivedAt) with no
 * explicit orderBy needs its OWN composite index, ascending on
 * receivedAt — a *different* index shape than getRevenueStats' recent-
 * payments/problem-invoices queries below, which explicitly orderBy
 * receivedAt desc. Both are declared in firestore.indexes.json; missing
 * this one is exactly what broke /admin in production the first time
 * (FAILED_PRECONDITION on this query alone — the other payment_events
 * queries already had their index and worked fine). */
async function countsByDayAmount(paymentEvents: CollectionReference, days: number): Promise<DayAmount[]> {
  const since = Timestamp.fromMillis(Date.now() - days * DAY_MS);
  const snap = await paymentEvents
    .where("result", "==", "granted")
    .where("receivedAt", ">=", since)
    .select("plan", "receivedAt")
    .limit(20_000)
    .get();

  const buckets = new Map<string, number>();
  for (const docSnap of snap.docs) {
    const plan = docSnap.get("plan") as PlanId | undefined;
    const ts = docSnap.get("receivedAt") as Timestamp | undefined;
    if (!plan || !ts) continue;
    const key = utcDayKey(ts.toMillis());
    buckets.set(key, (buckets.get(key) ?? 0) + planPriceUsd(plan));
  }

  const result: DayAmount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = utcDayKey(Date.now() - i * DAY_MS);
    result.push({ date: key, amountUsd: buckets.get(key) ?? 0 });
  }
  return result;
}

export interface AdminWatchUserRow {
  uid: string;
  email: string | null;
  date: string;
  messageCount: number;
}

export interface AdminWatchStats {
  totalMessages: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  topUsersLast7d: AdminWatchUserRow[];
}

export async function getWatchStats(): Promise<AdminWatchStats> {
  const usage = adminDb().collection(COLLECTIONS.watchChatUsage);

  // Summing three fields in one aggregate() call needs a composite index
  // covering all three (declared in firestore.indexes.json) — Firestore
  // doesn't cover a multi-field aggregate with the automatic per-field
  // indexing that a single count()/sum() gets.
  const agg = await usage
    .aggregate({
      totalMessages: AggregateField.sum("messageCount"),
      totalInputTokens: AggregateField.sum("inputTokens"),
      totalOutputTokens: AggregateField.sum("outputTokens"),
    })
    .get();
  const totals = agg.data();

  // Firestore `in` tops out at 30 values — 7 day keys is well under that,
  // and lets this skip a composite index entirely (a single equality-ish
  // filter, no orderBy on a different field).
  const dateKeys = Array.from({ length: 7 }, (_, i) => utcDayKey(Date.now() - i * DAY_MS));
  const recentSnap = await usage.where("date", "in", dateKeys).get();
  const rows = recentSnap.docs.map((d) => d.data() as WatchChatUsageDoc);
  rows.sort((a, b) => b.messageCount - a.messageCount);
  const topRows = rows.slice(0, 10);

  const emailMap = await emailsByUid(topRows.map((r) => r.userId));
  const topUsersLast7d = topRows.map((r) => ({
    uid: r.userId,
    email: emailMap.get(r.userId) ?? null,
    date: r.date,
    messageCount: r.messageCount,
  }));

  const totalInputTokens = totals.totalInputTokens ?? 0;
  const totalOutputTokens = totals.totalOutputTokens ?? 0;

  return {
    totalMessages: totals.totalMessages ?? 0,
    totalInputTokens,
    totalOutputTokens,
    estimatedCostUsd:
      (totalInputTokens / 1_000_000) * SONNET_5_INPUT_USD_PER_M +
      (totalOutputTokens / 1_000_000) * SONNET_5_OUTPUT_USD_PER_M,
    topUsersLast7d,
  };
}

export interface AdminLessonStats {
  lessonId: string;
  title: string;
  starts: number;
  completions: number;
  completionRate: number | null;
}

/** Per lesson: how many users opened it (lesson_starts) vs. how many
 * finished it (check_ins, type "lesson") — two count() queries per lesson,
 * both plain multi-equality filters, so neither needs a composite index.
 * Fine to run for every lesson on each dashboard load at this library's
 * size (dozens, not thousands, of lessons). */
export async function getLessonStats(): Promise<AdminLessonStats[]> {
  const lessonsSnap = await adminDb().collection(COLLECTIONS.lessons).select("title").get();
  const checkIns = adminDb().collection(COLLECTIONS.checkIns);
  const lessonStarts = adminDb().collection(COLLECTIONS.lessonStarts);

  const results = await Promise.all(
    lessonsSnap.docs.map(async (docSnap) => {
      const lessonId = docSnap.id;
      const title = (docSnap.get("title") as string | undefined) ?? lessonId;
      const [startsSnap, completionsSnap] = await Promise.all([
        lessonStarts.where("lessonId", "==", lessonId).count().get(),
        checkIns.where("type", "==", "lesson").where("lessonId", "==", lessonId).count().get(),
      ]);
      const starts = startsSnap.data().count;
      const completions = completionsSnap.data().count;
      return {
        lessonId,
        title,
        starts,
        completions,
        completionRate: starts > 0 ? completions / starts : null,
      };
    }),
  );

  return results;
}

export interface AdminDashboardData {
  users: AdminUserStats;
  retention: AdminRetentionCohort[];
  revenue: AdminRevenueStats;
  watch: AdminWatchStats;
  lessons: AdminLessonStats[];
  prayerCount: number;
  ledgerHighlightCount: number;
  generatedAtMs: number;
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [users, retention, revenue, watch, lessons, prayerCountSnap, highlightCountSnap] = await Promise.all([
    getUserStats(),
    getRetention(),
    getRevenueStats(),
    getWatchStats(),
    getLessonStats(),
    adminDb().collectionGroup("prayers").count().get(),
    adminDb().collection(COLLECTIONS.userHighlights).count().get(),
  ]);

  return {
    users,
    retention,
    revenue,
    watch,
    lessons,
    prayerCount: prayerCountSnap.data().count,
    ledgerHighlightCount: highlightCountSnap.data().count,
    generatedAtMs: Date.now(),
  };
}
