/**
 * Seed content for the `lessons` collection — a first week of daily
 * discipleship content mixing scripture, prayer, and devotional tracks,
 * plus a few Duolingo-style fill-in-the-blank lessons. Matches the
 * ReadingLessonDoc/FillBlankLessonDoc shapes in src/types/firestore.ts,
 * minus `createdAt` (the seed script stamps that on write). Fill-blank
 * entries mark each blank in `template` with the literal "_____" — see
 * BLANK_TOKEN in that same file.
 */
export const lessons = [
  {
    id: "day-01-creation",
    title: "In the Beginning",
    track: "scripture",
    order: 1,
    scriptureReference: "Genesis 1:1-5",
    summary:
      "God speaks, and the formless world takes shape by His word alone. Before anything else is said about who we are, Scripture opens with who God is: a Creator who speaks light into darkness.",
    xpReward: 10,
    estimatedMinutes: 5,
  },
  {
    id: "day-02-lords-prayer",
    title: "Teach Us to Pray",
    track: "prayer",
    order: 2,
    scriptureReference: "Matthew 6:9-13",
    summary:
      "When His disciples asked how to pray, Jesus gave them a pattern, not a script: praise, dependence, confession, protection. Pray it slowly today, phrase by phrase, and notice which line you need most.",
    xpReward: 10,
    estimatedMinutes: 5,
  },
  {
    id: "day-03-the-shepherd",
    title: "The Lord Is My Shepherd",
    track: "devotional",
    order: 3,
    scriptureReference: "Psalm 23",
    summary:
      "A shepherd leads, restores, and stays present even in the valley. Read the psalm twice — once for what God does, once for how it feels to be the sheep — and sit with whichever verse stops you.",
    xpReward: 10,
    estimatedMinutes: 7,
  },
  {
    id: "day-04-the-word-made-flesh",
    title: "The Word Became Flesh",
    track: "scripture",
    order: 4,
    scriptureReference: "John 1:1-14",
    summary:
      "The same Word that spoke creation into being steps into it as a person. John wants you to see Jesus as both the beginning and the arrival — trace how he says the same thing about Christ three different ways.",
    xpReward: 15,
    estimatedMinutes: 8,
  },
  {
    id: "day-05-fully-known",
    title: "Fully Known",
    track: "prayer",
    order: 5,
    scriptureReference: "Psalm 139:1-6, 23-24",
    summary:
      "David prays as someone with nothing left to hide — search me, know me, lead me. Before you ask God for anything today, try just being honest with Him about where you actually are.",
    xpReward: 10,
    estimatedMinutes: 6,
  },
  {
    id: "day-06-do-not-be-anxious",
    title: "Do Not Be Anxious",
    track: "devotional",
    order: 6,
    scriptureReference: "Philippians 4:4-7",
    summary:
      "Paul doesn't say don't feel anxious — he says what to do with it: bring it to God, specifically, with thanks attached. Name one real worry and hand it over in those terms today.",
    xpReward: 10,
    estimatedMinutes: 6,
  },
  {
    id: "day-07-nothing-can-separate",
    title: "Nothing Can Separate Us",
    track: "scripture",
    order: 7,
    scriptureReference: "Romans 8:28-39",
    summary:
      "A week that started with God speaking the world into order ends with His love holding you in it — nothing in your list, and nothing outside it, is stronger than this. Read the closing verses aloud as a closing word over your week.",
    xpReward: 15,
    estimatedMinutes: 8,
  },
  {
    id: "day-08-fillblank-john-3-16",
    title: "For God So Loved",
    track: "scripture",
    order: 8,
    scriptureReference: "John 3:16",
    lessonType: "fillBlank",
    template:
      "For God so _____ the world that he gave his one and only Son, that whoever _____ in him shall not perish but have eternal life.",
    answers: ["loved", "believes"],
    wordBank: ["loved", "believes", "made", "trusts", "hopes"],
    xpReward: 15,
    estimatedMinutes: 3,
  },
  {
    id: "day-09-fillblank-philippians-4-13",
    title: "Through Christ Who Strengthens",
    track: "scripture",
    order: 9,
    scriptureReference: "Philippians 4:13",
    lessonType: "fillBlank",
    template: "I can do all _____ through Christ who _____ me.",
    answers: ["things", "strengthens"],
    wordBank: ["things", "strengthens", "prayers", "forgives", "helps"],
    xpReward: 15,
    estimatedMinutes: 3,
  },
  {
    id: "day-10-fillblank-psalm-23-1",
    title: "The Lord Is My Shepherd",
    track: "scripture",
    order: 10,
    scriptureReference: "Psalm 23:1",
    lessonType: "fillBlank",
    template: "The Lord is my _____; I shall not _____.",
    answers: ["shepherd", "want"],
    wordBank: ["shepherd", "want", "guide", "need", "fear"],
    xpReward: 15,
    estimatedMinutes: 3,
  },
];
