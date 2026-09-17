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
  order: number;
  scriptureReference: string | null;
  /**
   * Which book of the Bible this lesson belongs to — the exact `name` of an
   * entry in `BIBLE_BOOKS` (src/lib/bible.ts), e.g. "Genesis" or "Psalms".
   * Drives The Path's book-organized sections; there's no separate books
   * collection, BIBLE_BOOKS is reused as the canonical ordering.
   */
  lessonBook: string;
  xpReward: number;
  estimatedMinutes: number;
  createdAt: Timestamp;
}

/**
 * lessons/{lessonId} — the original read-and-complete type. `lessonType`
 * is optional and defaults to "reading" when absent (every read path —
 * fetchLessons, LessonsSection — treats a missing value that way): the 7
 * lessons seeded before fill-in-the-blank existed don't have this field
 * at all, and don't need a migration to write it in. New reading lessons
 * can set it explicitly or just omit it; both are equivalent.
 */
export interface ReadingLessonDoc extends LessonDocBase {
  lessonType?: "reading";
  summary: string;
}

/**
 * lessons/{lessonId} — Duolingo-style fill-in-the-blank. `template` is the
 * verse with each blank marked by the literal substring `BLANK_TOKEN`
 * ("_____"); `answers` gives the correct word for each blank, in order
 * (same length as the number of blanks in `template`); `wordBank` is
 * `answers` plus a few decoy words — FillBlankCard shuffles it for
 * display, so storage order doesn't matter.
 */
export interface FillBlankLessonDoc extends LessonDocBase {
  lessonType: "fillBlank";
  template: string;
  answers: string[];
  wordBank: string[];
}

export type LessonDoc = ReadingLessonDoc | FillBlankLessonDoc;

/** The exact substring `template` uses to mark each blank. */
export const BLANK_TOKEN = "_____";

export function isFillBlankLesson(lesson: LessonDoc): lesson is FillBlankLessonDoc {
  return lesson.lessonType === "fillBlank";
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
  createdAt: Timestamp;
}

/**
 * daily_lesson_progress/{uid}_{date} — one doc per user per day, tracking
 * which lessons they've completed. This is the server-side source of truth
 * for the free-tier daily lesson cap (see firestore.rules); it exists
 * specifically so the limit can't be bypassed by refreshing the page or
 * clearing local state, since it lives in Firestore, not the client.
 */
export interface DailyLessonProgressDoc {
  userId: string;
  date: string; // "YYYY-MM-DD", in the user's timezone
  completedLessonIds: string[];
  updatedAt: Timestamp;
}

export const FREE_DAILY_LESSON_LIMIT = 3;

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
