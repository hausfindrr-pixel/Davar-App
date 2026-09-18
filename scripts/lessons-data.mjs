/**
 * Seed content for the `lessons` collection — narrative Bible events/stories
 * (Creation, the Red Sea, David and Goliath, ...) rather than isolated
 * verses, each tied to a chapter range and tagged with its source book so
 * it slots into The Path's book-organized roadmap. Matches the
 * ReadingLessonDoc/FillBlankLessonDoc shapes in src/types/firestore.ts,
 * minus `createdAt` (the seed script stamps that on write). Fill-blank
 * entries mark each blank in `template` with the literal "_____" — see
 * BLANK_TOKEN in that same file. `lessonBook` must exactly match a `name`
 * in BIBLE_BOOKS (src/lib/bible.ts), e.g. "Psalms" not "Psalm".
 *
 * IDs are reused from the app's original single-verse lesson set (a
 * deliberate migration choice — see the "Lesson migration" discussion):
 * each ID keeps its original lessonType (reading stays reading, fillBlank
 * stays fillBlank) so re-seeding via merge:true never leaves stale
 * type-specific fields (template/answers/wordBank) behind on a doc that's
 * switched shape.
 */
export const lessons = [
  {
    id: "day-01-creation",
    title: "The Creation of the World",
    track: "scripture",
    order: 1,
    scriptureReference: "Genesis 1:1-2:3",
    lessonBook: "Genesis",
    summary:
      "In six days, God speaks a formless world into shape — light, sky, land, and every living thing — and calls it good. On the seventh, He rests, setting the pattern for a rhythm of work and rest that runs through the rest of Scripture. Before anything else is said about who you are, this is who God is: a Creator who speaks order out of chaos, on purpose.",
    xpReward: 15,
    estimatedMinutes: 8,
  },
  {
    id: "day-02-lords-prayer",
    title: "Noah and the Flood",
    track: "scripture",
    order: 2,
    scriptureReference: "Genesis 6:5-9:17",
    lessonBook: "Genesis",
    summary:
      "When the world's evil grieves God's heart, He chooses one faithful family to carry creation through judgment — not to punish for its own sake, but to start again. Noah builds, waits, and finally steps onto washed ground under a rainbow, God's promise never to flood the earth again. It's a story about judgment and mercy holding together, not one canceling the other out.",
    xpReward: 15,
    estimatedMinutes: 8,
  },
  {
    id: "day-03-the-shepherd",
    title: "Moses Parts the Red Sea",
    track: "scripture",
    order: 3,
    scriptureReference: "Exodus 14:1-31",
    lessonBook: "Exodus",
    summary:
      "Trapped between Pharaoh's army and the sea, Israel has nowhere left to run — so God makes a way where there wasn't one. Moses stretches out his hand, the waters part, and a people who were slaves yesterday walk out free on dry ground. Read it as more than a miracle story: it's what God does with a dead end.",
    xpReward: 15,
    estimatedMinutes: 7,
  },
  {
    id: "day-04-the-word-made-flesh",
    title: "Daniel in the Lions' Den",
    track: "scripture",
    order: 4,
    scriptureReference: "Daniel 6:1-23",
    lessonBook: "Daniel",
    summary:
      "Daniel keeps praying three times a day even after a law is passed specifically to trap him for it — because some things matter more than staying safe. Thrown to the lions overnight, he's found alive at dawn: \"my God sent his angel and shut the lions' mouths.\" A story about what steady, unspectacular faithfulness looks like when it actually costs something.",
    xpReward: 15,
    estimatedMinutes: 7,
  },
  {
    id: "day-05-fully-known",
    title: "The Birth of Jesus",
    track: "scripture",
    order: 5,
    scriptureReference: "Luke 2:1-20",
    lessonBook: "Luke",
    summary:
      "No room, no fanfare — God enters the world as a baby in a feeding trough, and the first people told are shepherds working the night shift, not anyone important. Luke wants you to notice who gets the news first: the overlooked, not the powerful. That's the shape the whole story keeps taking from here.",
    xpReward: 15,
    estimatedMinutes: 6,
  },
  {
    id: "day-06-do-not-be-anxious",
    title: "The Prodigal Son",
    track: "scripture",
    order: 6,
    scriptureReference: "Luke 15:11-32",
    lessonBook: "Luke",
    summary:
      "A son takes his inheritance early, wastes it, and comes home rehearsing an apology he never gets to finish — his father is already running to him. Jesus tells this one to people who thought grace had to be earned back. Notice which character you actually read yourself as today: the son who left, or the older brother still keeping score at the door.",
    xpReward: 15,
    estimatedMinutes: 8,
  },
  {
    id: "day-07-nothing-can-separate",
    title: "Jesus and the Woman Caught in Sin",
    track: "scripture",
    order: 7,
    scriptureReference: "John 8:1-11",
    lessonBook: "John",
    summary:
      "Dragged in front of Jesus to be stoned, a woman is used as a trap — until Jesus bends down, writes in the dust, and says whoever is without sin can throw the first stone. One by one, her accusers walk away, oldest first. \"Neither do I condemn you,\" He tells her, \"go now and leave your life of sin\" — grace and a real call to change, in the same breath.",
    xpReward: 15,
    estimatedMinutes: 7,
  },
  {
    id: "day-08-fillblank-john-3-16",
    title: "David and Goliath",
    track: "scripture",
    order: 8,
    scriptureReference: "1 Samuel 17:1-50",
    lessonBook: "1 Samuel",
    lessonType: "fillBlank",
    template:
      "You come against me with sword and spear, but I come against you in the _____ of the LORD _____.",
    answers: ["name", "Almighty"],
    wordBank: ["name", "Almighty", "power", "strength", "glory"],
    xpReward: 15,
    estimatedMinutes: 3,
  },
  {
    id: "day-09-fillblank-philippians-4-13",
    title: "Jesus Calms the Storm",
    track: "scripture",
    order: 9,
    scriptureReference: "Mark 4:35-41",
    lessonBook: "Mark",
    lessonType: "fillBlank",
    template: "He got up, rebuked the wind and said to the waves, '_____! Be _____!'",
    answers: ["Quiet", "still"],
    wordBank: ["Quiet", "still", "Peace", "calm", "silent"],
    xpReward: 15,
    estimatedMinutes: 3,
  },
  {
    id: "day-10-fillblank-psalm-23-1",
    title: "The Resurrection",
    track: "scripture",
    order: 10,
    scriptureReference: "John 20:1-18",
    lessonBook: "John",
    lessonType: "fillBlank",
    template: "Jesus said to her, '_____.' She turned toward him and cried out, '_____!'",
    answers: ["Mary", "Rabboni"],
    wordBank: ["Mary", "Rabboni", "Martha", "Teacher", "Lord"],
    xpReward: 15,
    estimatedMinutes: 3,
  },
];
