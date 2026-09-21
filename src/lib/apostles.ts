/**
 * The "Apostle Companion" system: every in-app nudge is framed as coming
 * from one of four apostles, each standing in for a different kind of
 * moment. The apostle for a given notification TYPE is fixed (Peter always
 * sends check-in nudges, never Matthew) — only which message from that
 * apostle's own list gets shown is picked per-occasion. See
 * `src/lib/apostle-moment.ts` for the dashboard logic that decides which
 * type applies right now.
 */

export type ApostleId = "peter" | "matthew" | "john" | "thomas";

export type NotificationType =
  | "checkIn" // Peter — accountability / check-in nudges
  | "progress" // Matthew — progress & stats recaps
  | "encouragement" // John — daily gentle encouragement to engage Scripture
  | "reassurance"; // Thomas — reassurance during doubt / low motivation

export interface Apostle {
  id: ApostleId;
  name: string;
  /** One line describing who they were, scripturally. */
  characteristic: string;
  /** How their messages should read. */
  tone: string;
  /** Short landing-page tagline — "who they are to you," not who they were. */
  role: string;
  notificationType: NotificationType;
  /** Message templates for this apostle's lane. May contain {streak} or
   * {longest} placeholders — see formatApostleMessage. */
  messages: string[];
}

export const APOSTLES: Record<ApostleId, Apostle> = {
  peter: {
    id: "peter",
    name: "Peter",
    characteristic: "Denied Jesus three times — then was restored and told to feed His sheep.",
    tone: "Bold and restorative — a stumble isn't the end of the story, so get back up.",
    role: "Accountability when you need it most",
    notificationType: "checkIn",
    messages: [
      "You stumbled — that's not the end of your story. Show up again today.",
      "Even Peter denied Him three times. Get back up and check in.",
      "One missed day doesn't undo what you've built. Come back in.",
      "Grace doesn't need you to be perfect — just present. Check in today.",
      "You're not disqualified. You're invited back in, right now.",
    ],
  },
  matthew: {
    id: "matthew",
    name: "Matthew",
    characteristic: "A tax collector who kept careful records — now numbers your days of faithfulness.",
    tone: "Precise and detail-oriented — your progress is worth counting.",
    role: "A gentle record of your progress",
    notificationType: "progress",
    messages: [
      "{streak}-day streak. Every number here is a day you showed up.",
      "This week you logged {streak} days in a row. That's not nothing — that's a pattern.",
      "I keep the records so you can see how far you've come — {streak} days and counting.",
      "{streak} days and counting. Small, faithful, countable — exactly how growth works.",
      "Longest streak so far: {longest} days. You've already proven you can do this.",
    ],
  },
  john: {
    id: "john",
    name: "John",
    characteristic: "The disciple who leaned close at the table — wrote most about love and abiding.",
    tone: "Warm and relational — like a close friend checking in, never a task reminder.",
    role: "Daily encouragement to keep going",
    notificationType: "encouragement",
    messages: [
      "I'm glad you're here today. Even a few minutes in the Word matters.",
      "Come and see what's in today's reading — no pressure, just presence.",
      "\"Abide in me\" isn't a task, it's an invitation. Today's a good day to accept it.",
      "You don't have to have it figured out to open Scripture today. Just come.",
      "Wherever you are today, there's room for you here.",
    ],
  },
  thomas: {
    id: "thomas",
    name: "Thomas",
    characteristic: "Doubted until he saw — then was the first to call Him \"my Lord and my God.\"",
    tone: "Honest about doubt, never dismissive of it — still points back to faith.",
    role: "A steady presence in your doubt",
    notificationType: "reassurance",
    messages: [
      "It's okay to not feel sure today. Doubt isn't the opposite of faith — it's part of the walk.",
      "I needed to see it too, before I believed. Bring your doubts here — they're welcome.",
      "You don't need certainty to take the next small step.",
      "\"My Lord and my God\" came after doubt, not instead of it. There's room for you here.",
      "A quiet, uncertain day still counts. Come back when you're ready — no rush.",
    ],
  },
};

/** The fixed type → apostle mapping. Every check-in nudge is Peter's, every
 * progress recap is Matthew's — never randomized, unlike the message text
 * within that apostle's lane. */
export const APOSTLE_FOR_TYPE: Record<NotificationType, ApostleId> = {
  checkIn: "peter",
  progress: "matthew",
  encouragement: "john",
  reassurance: "thomas",
};

export function apostleForType(type: NotificationType): Apostle {
  return APOSTLES[APOSTLE_FOR_TYPE[type]];
}

/**
 * Matthew's line at the top of his Ledger (src/components/MatthewsLedger.tsx)
 * — a different lane from his dashboard progress recaps above (`matthew.
 * messages`), since this one speaks to the record itself, not a streak/XP
 * stat. Picked the same deterministic way (pickApostleMessage), so it's
 * stable through a session but changes day to day.
 */
export const MATTHEW_LEDGER_MESSAGES: string[] = [
  "I used to count coins. This is a better ledger.",
  "Every day you show up, I write it down. Nothing here is wasted.",
  "Forty-two days, and I've kept every one of them.",
  "You wrote this a month ago. Read it again — you may need it today.",
  "I kept careful books once, for the wrong reasons. This time, it's worth counting.",
  "Nothing you've written here is forgotten. I keep the record so you don't have to.",
];

/** A small, deterministic string hash — used to pick a message per
 * (user, day, type) so the "random" pick is stable across re-renders and
 * across a single day (no flicker), but still varies day to day and
 * apostle to apostle without needing extra component state. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Deterministically picks one item from `list` for a given `seed` — the
 * same no-flicker-but-varies-daily approach pickApostleMessage uses for an
 * apostle's own message lane, generalized for other message lists (e.g.
 * MATTHEW_LEDGER_MESSAGES). */
export function pickFromList<T>(list: T[], seed: string): T {
  const index = hashString(seed) % list.length;
  return list[index];
}

/** Picks one of `apostle`'s message templates, deterministically for a
 * given `seed` (e.g. `${uid}-${today}`) so it doesn't change on every
 * render but does change day to day. */
export function pickApostleMessage(apostle: Apostle, seed: string): string {
  return pickFromList(apostle.messages, `${apostle.id}:${seed}`);
}

export type ApostleMessageVars = {
  streak?: number;
  longest?: number;
};

/** Fills {streak}/{longest} placeholders in a message template. */
export function formatApostleMessage(template: string, vars: ApostleMessageVars): string {
  return template.replace(/\{(streak|longest)\}/g, (_match, key: keyof ApostleMessageVars) =>
    String(vars[key] ?? 0),
  );
}
