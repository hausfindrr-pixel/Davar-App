import { daysBetweenKeys } from "@/lib/date";

/** Never shows before the user's 3rd completed lesson — "never on the
 * first 2." */
const MIN_COMPLETED_BEFORE_ELIGIBLE = 3;

/** At most once every 3-4 completed lessons after that — enforced here as
 * a minimum gap of 3 since last shown. */
const MIN_LESSONS_SINCE_LAST_SHOWN = 3;

/** If they tapped it and backed out without upgrading, don't show it
 * again for at least a week. */
const TAPPED_COOLDOWN_DAYS = 7;

export interface PremiumNudgeState {
  lastShownDate: string | null; // "YYYY-MM-DD"
  lastShownCompletedCount: number | null;
  lastTappedDate: string | null; // "YYYY-MM-DD"
}

/**
 * Whether to show the passive premium nudge on a lesson's resolution
 * screen (see ResolutionScreen, src/components/LessonFlow.tsx). Never
 * called for premium users — this is Free-only by definition, so it
 * doesn't take a tier argument; the caller gates on `!isPremium` first.
 *
 * `completedCount` is `allTimeCompletedLessonIds.length` — the count
 * BEFORE this lesson's own completion (the resolution screen renders
 * before the user taps Complete), matching "never on the first 2
 * completed lessons" against lessons already finished.
 */
export function shouldShowPremiumNudge(
  completedCount: number,
  state: PremiumNudgeState,
  todayKey: string,
): boolean {
  if (completedCount < MIN_COMPLETED_BEFORE_ELIGIBLE) return false;

  if (state.lastTappedDate && daysBetweenKeys(state.lastTappedDate, todayKey) < TAPPED_COOLDOWN_DAYS) {
    return false;
  }

  if (
    state.lastShownCompletedCount !== null &&
    completedCount - state.lastShownCompletedCount < MIN_LESSONS_SINCE_LAST_SHOWN
  ) {
    return false;
  }

  return true;
}
