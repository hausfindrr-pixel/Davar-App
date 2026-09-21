import type { Timestamp } from "firebase/firestore";
import type { ApostleId } from "@/lib/apostles";
import type { PlanId } from "@/lib/plisio/plans";

/**
 * Firestore collection names, kept in one place so a rename doesn't require
 * a grep across the codebase.
 */
export const COLLECTIONS = {
  users: "users",
  streaks: "streaks",
  lessons: "lessons",
  checkIns: "check_ins",
  accountabilityLinks: "accountability_links",
  dailyLessonProgress: "daily_lesson_progress",
  userHighlights: "user_highlights",
  conversations: "conversations",
  watchChatUsage: "watch_chat_usage",
  dailyVerses: "daily_verses",
  dailyDevotionals: "daily_devotionals",
  dailyPrayers: "daily_prayers",
} as const;

export type UserTier = "free" | "premium";

/** users/{uid} */
export interface UserDoc {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  xp: number;
  level: number;
  timezone: string | null;
  /**
   * Set to "free" on creation and never changed by the client — see the
   * `users` update rule in firestore.rules. Only the Plisio webhook (via
   * the Admin SDK, which bypasses these rules) sets this to "premium".
   */
  tier: UserTier;
  /**
   * When the current "premium" grant started — set by the Plisio webhook
   * alongside tier/premiumUntil/planId, locked from client writes the same
   * way. Exists mainly so premiumUntil's math (premiumSince + plan length)
   * is traceable, rather than only ever showing the computed end date.
   */
  premiumSince: Timestamp | null;
  /**
   * When a "premium" grant expires — set by the Plisio webhook alongside
   * `tier`, locked from client writes the same way. Crypto payments via
   * Plisio are one-time, not an auto-renewing subscription like Stripe, so
   * this is the record of how long a given payment's access lasts.
   * `src/app/api/cron/expire-premium/route.ts` runs daily via Vercel Cron
   * and downgrades `tier` back to "free" once this passes.
   */
  premiumUntil: Timestamp | null;
  /**
   * Which plan the current premium grant is for — set by the Plisio
   * webhook alongside tier/premiumUntil, locked from client writes the
   * same way. `null` for free users and for any premium grant made before
   * this field existed — the Profile page falls back to a plain "Premium
   * member" label rather than guessing when this is null.
   */
  planId: PlanId | null;
}

/** streaks/{uid} — one streak-state document per user. */
export interface StreakDoc {
  userId: string;
  currentCount: number;
  longestCount: number;
  lastCheckInDate: string | null; // "YYYY-MM-DD", in the user's timezone
  freezesAvailable: number;
  freezesUsedDates: string[];
  updatedAt: Timestamp;
}

export type LessonTrack = "scripture" | "prayer" | "devotional";

interface LessonDocBase {
  id: string;
  title: string;
  track: LessonTrack;
  /**
   * Position in the single chronological sequence across every lesson in
   * the library, every book and track alike — this is what The Path's
   * gating uses now (see "single global sequence" in src/lib/roadmap.ts),
   * replacing the old per-book `order` field entirely. Sparse (multiples
   * of 100: 100, 200, 300…), not dense, so a later lesson can be inserted
   * between two existing ones (e.g. 150) without renumbering the rest of
   * the library.
   */
  chronologicalOrder: number;
  scriptureReference: string | null;
  /**
   * Which book of the Bible this lesson belongs to — the exact `name` of an
   * entry in `BIBLE_BOOKS` (src/lib/bible.ts), e.g. "Genesis" or "Psalms".
   * Display metadata only (the book subheading on a card) — it no longer
   * drives ordering or gating; `chronologicalOrder` does that now.
   */
  lessonBook: string;
  /** A single illustration for the lesson, shown on its opening screen
   * (and as the card thumbnail in the list) — null renders the existing
   * placeholder gradient+icon. Deliberately one per lesson, not one per
   * screen. */
  imageUrl: string | null;
  xpReward: number;
  estimatedMinutes: number;
  createdAt: Timestamp;
}

/**
 * One of a verse activity's fill-in-the-blank lines — a single verse from
 * the event's passage, quoted with its own blank(s) marked by the literal
 * substring `BLANK_TOKEN` ("_____"). `answers` gives the correct word for
 * each blank in `template`, in order (same length as the number of blanks).
 */
export interface VerseBlank {
  /** The exact verse this line quotes, e.g. "Genesis 1:1". */
  reference: string;
  template: string;
  answers: string[];
}

/**
 * A lesson's embedded Duolingo-style verse activity — up to 5 of the
 * event's most important verses (fewer if the passage doesn't have that
 * many worth quizzing; never padded to 5), each its own `VerseBlank` line.
 * `wordBank` pools every verse's `answers` plus a roughly matching number
 * of decoy words — FillBlankCard shuffles it for display and fills blanks
 * across all verses in order, so storage order doesn't matter.
 */
export interface VerseActivity {
  verses: VerseBlank[];
  wordBank: string[];
}

/** The exact substring a VerseBlank's `template` uses to mark each blank. */
export const BLANK_TOKEN = "_____";

export type LessonScreenType = "scenario" | "multipleChoice" | "shortAnswer" | "verseBlank";

interface LessonScreenBase {
  /** Stable within the lesson (e.g. "q1") — also the `screenId` half of a
   * scenario answer's docId in LessonAnswerDoc below. */
  id: string;
  type: LessonScreenType;
  prompt: string;
  /** Optional extra context behind a collapsed chevron on the screen —
   * the fuller passage, background detail, or a hint. Collapsed by
   * default so the screen itself stays clean. */
  context?: string;
}

/** "You're standing with the Israelites at the sea — what do you say to
 * Moses?" Free text, no right/wrong answer — advancing just requires
 * something written, and the text is saved to the user's own record (see
 * LessonAnswerDoc) rather than checked against anything. */
export interface ScenarioScreen extends LessonScreenBase {
  type: "scenario";
  placeholder?: string;
}

/** A recall question with plausible distractors, not obvious filler.
 * Picking `correctIndex` unlocks Continue; a wrong pick shows a gentle
 * "not quite" and stays open to retry, never a dead end. */
export interface MultipleChoiceScreen extends LessonScreenBase {
  type: "multipleChoice";
  options: string[];
  correctIndex: number;
}

/** A typed, self-marked reflection — the user answers, then marks for
 * themselves whether they got the idea, rather than an auto-graded exact
 * match (which tends to false-negative a reasonable but differently
 * worded answer). */
export interface ShortAnswerScreen extends LessonScreenBase {
  type: "shortAnswer";
}

/** The existing verse fill-in-the-blank activity, reused as one screen
 * type among several rather than a lesson's only interactive content. */
export interface VerseBlankScreen extends LessonScreenBase {
  type: "verseBlank";
  activity: VerseActivity;
}

export type LessonScreen = ScenarioScreen | MultipleChoiceScreen | ShortAnswerScreen | VerseBlankScreen;

export function isMultipleChoiceScreen(screen: LessonScreen): screen is MultipleChoiceScreen {
  return screen.type === "multipleChoice";
}

/**
 * lessons/{lessonId} — a lesson is a guided, one-screen-at-a-time sequence
 * (LessonFlow.tsx), not a single scrolling card:
 *
 * 1. Intro screen — `imageUrl` (or the placeholder) + `summary` (the scene
 *    setup — deliberately doesn't give away the ending; see `resolution`).
 * 2. One question screen per entry in `screens`, one of the four
 *    LessonScreen types above.
 * 3. Resolution screen — `resolution` (what actually happened in
 *    Scripture) plus `nextHook` (a cliffhanger pointing at the next
 *    lesson in chronological order). This is where completing the lesson
 *    actually fires (completeLesson, src/lib/db/lessons.ts) — unchanged
 *    XP/streak/daily-cap mechanics, still keyed on `id`/`xpReward`.
 */
export interface LessonDoc extends LessonDocBase {
  summary: string;
  screens: LessonScreen[];
  resolution: string;
  nextHook: string;
}

/**
 * users/{uid}/lessonAnswers/{lessonId}_{screenId} — a user's own free-text
 * answer to a lesson's scenario screen. No right/wrong, same "just
 * preserved, not graded" spirit as the prayer journal (PrayerDoc) — this
 * is that same pattern applied to in-lesson scenario responses instead of
 * a standalone journal entry.
 */
export interface LessonAnswerDoc {
  id: string;
  lessonId: string;
  screenId: string;
  text: string;
  createdAt: Timestamp;
}

/**
 * daily_verses/{id}, daily_devotionals/{id}, daily_prayers/{id} — Today
 * tab's app-provided daily content, kept as three separate pools (not
 * pulled from `lessons`) so Today and The Path structurally never draw
 * from the same content on any given day. `order` is a stable position
 * used by the rotation (src/lib/dailyContent.ts) — not the array/query
 * position — so appending new content later doesn't shift historical
 * picks. Read-only for signed-in users (see firestore.rules); managed via
 * the console or the Admin SDK, same as `lessons`.
 */
export interface DailyVerseDoc {
  id: string;
  order: number;
  reference: string;
  text: string;
  createdAt: Timestamp;
}

/** daily_devotionals/{id} — see DailyVerseDoc. */
export interface DailyDevotionalDoc {
  id: string;
  order: number;
  title: string;
  text: string;
  createdAt: Timestamp;
}

/** daily_prayers/{id} — see DailyVerseDoc. The app's guided prayer of the
 * day, distinct from a user's own free-text prayer journal (PrayerDoc). */
export interface DailyPrayerDoc {
  id: string;
  order: number;
  title: string;
  text: string;
  createdAt: Timestamp;
}

export type CheckInType = "lesson" | "prayer" | "reading" | "custom";

/** check_ins/{checkInId} */
export interface CheckInDoc {
  id: string;
  userId: string;
  lessonId: string | null;
  type: CheckInType;
  date: string; // "YYYY-MM-DD", in the user's timezone
  completedAt: Timestamp;
  xpEarned: number;
  notes: string | null;
}

export const PRAYER_XP_REWARD = 10;

/**
 * users/{uid}/prayers/{prayerId} — a user's own free-text prayers, newest
 * first. A subcollection (ownership via the uid path segment, same pattern
 * as conversations/{uid}/messages) rather than a flat top-level collection
 * with a userId field, since there's no cross-user query need here.
 */
export interface PrayerDoc {
  id: string;
  text: string;
  /** "YYYY-MM-DD" in the user's timezone — lets firestore.rules locate
   * that day's daily_lesson_progress doc to enforce the daily prayer cap
   * without a separate query (rules can't query/count documents). */
  date: string;
  createdAt: Timestamp;
}

/**
 * daily_lesson_progress/{uid}_{date} — one doc per user per day, tracking
 * both which lessons they've completed and how many prayers they've
 * submitted *that day*. This is the server-side source of truth for the
 * daily caps (see firestore.rules, dailyEventLimit, dailyPrayerLimit
 * below) — it exists so the limits can't be bypassed by refreshing the
 * page or clearing local state, since it lives in Firestore, not the
 * client. Lessons keep their own IDs (so a completed lesson can show
 * "Completed" rather than just counting toward a total); prayers only need
 * a count, since the prayer journal itself already lists each prayer's own
 * text/date via its own subcollection.
 *
 * This doc is per-*day*, not per-user-lifetime — `completedLessonIds` here
 * only ever holds what was completed on this specific date. Whether a
 * lesson has EVER been completed (which drives The Path's gating — see
 * "The Path: completion-gated rotation" in the README) comes from
 * aggregating `completedLessonIds` across every one of a user's
 * daily_lesson_progress docs (fetchAllCompletedLessonIds,
 * src/lib/db/lessons.ts), not from any single day's doc.
 */
export interface DailyLessonProgressDoc {
  userId: string;
  date: string; // "YYYY-MM-DD", in the user's timezone
  completedLessonIds: string[];
  prayerCount: number;
  updatedAt: Timestamp;
}

/**
 * Daily caps, enforced by daily_lesson_progress's rules (see
 * firestore.rules) and checked in completeLesson/submitPrayer
 * (src/lib/db/lessons.ts, src/lib/db/prayers.ts). Event lessons (The
 * Path) and prayers (the prayer journal) have separate caps — they used
 * to share one combined number, but an event lesson and a prayer are
 * different kinds of daily practice, so they're budgeted separately.
 * Today's Verse/Devotional/Prayer have no completion action and aren't
 * part of either count.
 */
export const FREE_DAILY_EVENT_LIMIT = 1;
export const PREMIUM_DAILY_EVENT_LIMIT = 3;

export function dailyEventLimit(tier: UserTier): number {
  return tier === "premium" ? PREMIUM_DAILY_EVENT_LIMIT : FREE_DAILY_EVENT_LIMIT;
}

export const FREE_DAILY_PRAYER_LIMIT = 3;
export const PREMIUM_DAILY_PRAYER_LIMIT = 15;

export function dailyPrayerLimit(tier: UserTier): number {
  return tier === "premium" ? PREMIUM_DAILY_PRAYER_LIMIT : FREE_DAILY_PRAYER_LIMIT;
}

export type AccountabilityLinkStatus = "pending" | "active" | "ended";

/** accountability_links/{linkId} */
export interface AccountabilityLinkDoc {
  id: string;
  userId: string;
  partnerId: string;
  initiatedBy: string;
  status: AccountabilityLinkStatus;
  createdAt: Timestamp;
  respondedAt: Timestamp | null;
  shareStreak: boolean;
  shareLastCheckIn: boolean;
}

export type HighlightColor = "clay" | "sage" | "stone";

/** user_highlights/{highlightId} — a verse a user highlighted in The Word. */
export interface UserHighlightDoc {
  id: string;
  userId: string;
  reference: string; // e.g. "John 3:16" — the exact string used to look the verse back up
  book: string;
  chapter: number;
  verse: number;
  /** The verse text at the time it was highlighted, stored alongside it
   * (not re-fetched from the Bible API later) so the Profile page's
   * "Highlighted Verses" list works without a network round-trip per verse. */
  text: string;
  color: HighlightColor;
  /** A personal note the user attached to this verse, editable from Profile. */
  notes: string | null;
  createdAt: Timestamp;
}

export type ChatRole = "user" | "assistant";

/**
 * conversations/{uid}/messages/{messageId} — Peter's Watch AI chat history.
 * Read-only from the client (see firestore.rules) — only the Admin SDK,
 * via /api/watch-chat, ever writes. That's deliberate: the crisis-detection
 * and apostle-routing logic lives entirely in that server route, and a
 * client that could write directly to this collection could bypass it.
 */
export interface ConversationMessageDoc {
  id: string;
  role: ChatRole;
  /** Which apostle sent this — null for the user's own messages. */
  apostleId: ApostleId | null;
  text: string;
  /** True only on the scripted, in-character "closing" message sent when
   * the day's WATCH_CHAT_DAILY_LIMIT is hit (see src/lib/chat-apostle.ts).
   * Lets the client disable the input on reload without a separate
   * usage-counter read — it just checks whether today's last message
   * carries this flag. */
  limitReached: boolean;
  createdAt: Timestamp;
}

/**
 * watch_chat_usage/{uid}_{date} — a per-user-per-day counter of how many
 * messages Peter's Watch has answered, the same docId/reset pattern as
 * daily_lesson_progress. Server-only: the client never reads or writes
 * this directly (see firestore.rules) — the API route enforces the cap
 * with it and the client instead reads `limitReached` off the persisted
 * conversation message (see ConversationMessageDoc above).
 */
export interface WatchChatUsageDoc {
  userId: string;
  date: string; // "YYYY-MM-DD", in the user's timezone
  messageCount: number;
  updatedAt: Timestamp;
}
