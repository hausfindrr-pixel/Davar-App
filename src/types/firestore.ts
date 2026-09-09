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
} as const;

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
