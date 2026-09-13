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
   * `users` update rule in firestore.rules. There's no billing integration
   * yet, so nothing currently grants "premium"; the field exists so the
   * free-tier lesson cap (daily_lesson_progress) has something real to key
   * off once one does.
   */
  tier: UserTier;
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
