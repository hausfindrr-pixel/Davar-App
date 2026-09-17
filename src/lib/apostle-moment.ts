import {
  apostleForType,
  formatApostleMessage,
  pickApostleMessage,
  type Apostle,
  type NotificationType,
} from "@/lib/apostles";

export interface ApostleMomentContext {
  uid: string;
  today: string; // "YYYY-MM-DD"
  checkedInToday: boolean;
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
}

export interface ApostleMoment {
  type: NotificationType;
  apostle: Apostle;
  message: string;
}

/**
 * Decides which apostle "speaks" on the dashboard right now, or null if
 * none of the specific moments apply. The type is chosen by simple,
 * readable rules about where the user actually is — which apostle within
 * that type is fixed (see APOSTLE_FOR_TYPE) — only the specific message
 * text is picked per-occasion (deterministically per user per day, so it's
 * stable through a session but varies day to day):
 *
 *  1. Not checked in yet today → Peter (accountability nudge) — most
 *     actionable, so it takes priority.
 *  2. Checked in, but the streak just reset after being longer → Thomas
 *     (reassurance) — a broken streak is exactly a low-motivation moment.
 *  3. Checked in, and today lands on a weekly milestone → Matthew
 *     (progress recap).
 *  4. Otherwise → null — no specific moment applies today. John's steady,
 *     every-day encouragement lives in its own permanent spot on Today
 *     (MascotHero, src/components/MascotHero.tsx) instead of rotating in
 *     here, so there's no "encouragement" fallback case in this function.
 */
export function pickApostleMoment(ctx: ApostleMomentContext): ApostleMoment | null {
  const streakJustBroken = ctx.currentStreak <= 1 && ctx.longestStreak > 1;
  const isWeeklyMilestone = ctx.currentStreak > 0 && ctx.currentStreak % 7 === 0;

  let type: NotificationType;
  if (!ctx.checkedInToday) {
    type = "checkIn";
  } else if (streakJustBroken) {
    type = "reassurance";
  } else if (isWeeklyMilestone) {
    type = "progress";
  } else {
    return null;
  }

  const apostle = apostleForType(type);
  const seed = `${ctx.uid}-${ctx.today}-${type}`;
  const template = pickApostleMessage(apostle, seed);
  const message = formatApostleMessage(template, {
    streak: ctx.currentStreak,
    longest: ctx.longestStreak,
    xp: ctx.xp,
    level: ctx.level,
  });

  return { type, apostle, message };
}
