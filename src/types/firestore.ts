import type { Timestamp } from "firebase/firestore";

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
   * When a "premium" grant expires — set by the Plisio webhook alongside
   * `tier`, locked from client writes the same way. Crypto payments via
   * Plisio are one-time, not an auto-renewing subscription like Stripe, so
   * this is the record of how long a given payment's access lasts. Nothing
   * currently reads this to auto-downgrade back to "free" once it passes —
   * that's not built yet.
   */
  premiumUntil: Timestamp | null;
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

/** lessons/{lessonId} */
export interface LessonDoc {
  id: string;
  title: string;
  track: LessonTrack;
  order: number;
  scriptureReference: string | null;
  summary: string;
  xpReward: number;
  estimatedMinutes: number;
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
