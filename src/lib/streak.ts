import { addDaysToKey } from "@/lib/date";

type StreakState = {
  currentCount: number;
  longestCount: number;
  lastCheckInDate: string | null;
  freezesAvailable: number;
  freezesUsedDates: string[];
};

export type StreakUpdate = StreakState & {
  alreadyCheckedInToday: boolean;
  freezeConsumed: boolean;
};

const EMPTY_STATE: StreakState = {
  currentCount: 0,
  longestCount: 0,
  lastCheckInDate: null,
  freezesAvailable: 0,
  freezesUsedDates: [],
};

/**
 * Pure function computing the next streak state for a check-in on `today`.
 * A gap of exactly one missed day is bridged by a streak freeze if one is
 * available; a bigger gap resets the streak to 1.
 */
export function computeStreakUpdate(
  prev: StreakState | null,
  today: string,
): StreakUpdate {
  const base = prev ?? EMPTY_STATE;

  if (base.lastCheckInDate === today) {
    return { ...base, alreadyCheckedInToday: true, freezeConsumed: false };
  }

  const yesterday = addDaysToKey(today, -1);
  const twoDaysAgo = addDaysToKey(today, -2);

  let currentCount: number;
  let freezesAvailable = base.freezesAvailable;
  let freezesUsedDates = base.freezesUsedDates;
  let freezeConsumed = false;

  if (base.lastCheckInDate === null || base.lastCheckInDate === yesterday) {
    currentCount = base.currentCount + 1;
  } else if (base.lastCheckInDate === twoDaysAgo && base.freezesAvailable > 0) {
    currentCount = base.currentCount + 1;
    freezesAvailable -= 1;
    freezesUsedDates = [...freezesUsedDates, yesterday];
    freezeConsumed = true;
  } else {
    currentCount = 1;
  }

  return {
    currentCount,
    longestCount: Math.max(base.longestCount, currentCount),
    lastCheckInDate: today,
    freezesAvailable,
    freezesUsedDates,
    alreadyCheckedInToday: false,
    freezeConsumed,
  };
}
