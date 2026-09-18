/**
 * Seed content for the `lessons` collection — narrative Bible events/stories
 * (Creation, the Red Sea, David and Goliath, ...) rather than isolated
 * verses, each tied to a chapter range and tagged with its source book so
 * it slots into The Path's book-organized roadmap. Matches the LessonDoc
 * shape in src/types/firestore.ts, minus `createdAt` (the seed script
 * stamps that on write).
 *
 * Every lesson pairs its narrative `summary` with a `verseActivity` — up to
 * 5 of the passage's most important verses (fewer if the passage doesn't
 * have that many worth quizzing; never padded to 5), each turned into a
 * fill-in-the-blank line (VerseBlank: reference + template + answers).
 * `template` marks each blank with the literal "_____" — see BLANK_TOKEN in
 * that same file. `wordBank` pools every verse's answers plus a roughly
 * matching number of decoy words, so the activity reads as one bigger,
 * richer word bank rather than a single 2-word quiz. `lessonBook` must
 * exactly match a `name` in BIBLE_BOOKS (src/lib/bible.ts), e.g. "Psalms"
 * not "Psalm".
 *
 * IDs are reused from the app's original single-verse lesson set (a
 * deliberate migration choice — see the "Lesson migration" discussion).
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
    verseActivity: {
      verses: [
        {
          reference: "Genesis 1:1",
          template: "In the beginning God created the heavens and the _____.",
          answers: ["earth"],
        },
        {
          reference: "Genesis 1:3",
          template: "And God said, 'Let there be _____,' and there was light.",
          answers: ["light"],
        },
        {
          reference: "Genesis 1:27",
          template:
            "So God created mankind in his own _____; male and female he created them.",
          answers: ["image"],
        },
        {
          reference: "Genesis 1:31",
          template: "God saw all that he had made, and it was very _____.",
          answers: ["good"],
        },
        {
          reference: "Genesis 2:2",
          template: "On the seventh day God rested from all his _____.",
          answers: ["work"],
        },
      ],
      wordBank: ["earth", "light", "image", "good", "work", "sky", "water", "glory", "evil", "rest"],
    },
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
    verseActivity: {
      verses: [
        {
          reference: "Genesis 6:8",
          template: "But Noah found _____ in the eyes of the LORD.",
          answers: ["favor"],
        },
        {
          reference: "Genesis 7:12",
          template: "And rain fell on the earth forty days and forty _____.",
          answers: ["nights"],
        },
        {
          reference: "Genesis 8:11",
          template: "There in its beak was a freshly plucked olive _____!",
          answers: ["leaf"],
        },
        {
          reference: "Genesis 9:13",
          template:
            "I have set my _____ in the clouds as a sign of the covenant between me and the earth.",
          answers: ["rainbow"],
        },
        {
          reference: "Genesis 9:15",
          template: "Never again will the waters become a _____ to destroy all life.",
          answers: ["flood"],
        },
      ],
      wordBank: [
        "favor",
        "nights",
        "leaf",
        "rainbow",
        "flood",
        "mercy",
        "days",
        "branch",
        "promise",
        "storm",
      ],
    },
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
    verseActivity: {
      verses: [
        {
          reference: "Exodus 14:13",
          template:
            "Do not be afraid. Stand firm and you will see the _____ the LORD will bring you today.",
          answers: ["deliverance"],
        },
        {
          reference: "Exodus 14:14",
          template: "The LORD will fight for you; you need only to be _____.",
          answers: ["still"],
        },
        {
          reference: "Exodus 14:21",
          template:
            "Moses stretched out his hand, and the LORD drove the sea back with a strong east _____.",
          answers: ["wind"],
        },
        {
          reference: "Exodus 14:22",
          template: "The Israelites went through the sea on dry _____.",
          answers: ["ground"],
        },
        {
          reference: "Exodus 14:31",
          template: "The people feared the LORD and put their _____ in him.",
          answers: ["trust"],
        },
      ],
      wordBank: [
        "deliverance",
        "still",
        "wind",
        "ground",
        "trust",
        "rescue",
        "quiet",
        "storm",
        "land",
        "faith",
      ],
    },
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
    verseActivity: {
      verses: [
        {
          reference: "Daniel 6:10",
          template: "Three times a day Daniel got down on his knees and _____.",
          answers: ["prayed"],
        },
        {
          reference: "Daniel 6:16",
          template: "May your God, whom you serve continually, _____ you!",
          answers: ["rescue"],
        },
        {
          reference: "Daniel 6:20",
          template: "Has your God been able to rescue you from the _____?",
          answers: ["lions"],
        },
        {
          reference: "Daniel 6:22",
          template: "My God sent his _____, and he shut the mouths of the lions.",
          answers: ["angel"],
        },
        {
          reference: "Daniel 6:23",
          template: "No wound was found on him, because he had _____ in his God.",
          answers: ["trusted"],
        },
      ],
      wordBank: [
        "prayed",
        "rescue",
        "lions",
        "angel",
        "trusted",
        "fasted",
        "deliver",
        "den",
        "messenger",
        "believed",
      ],
    },
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
    verseActivity: {
      verses: [
        {
          reference: "Luke 2:7",
          template: "She wrapped him in cloths and placed him in a _____.",
          answers: ["manger"],
        },
        {
          reference: "Luke 2:10",
          template: "I bring you good news that will cause great _____ for all the people.",
          answers: ["joy"],
        },
        {
          reference: "Luke 2:11",
          template: "Today in the town of David a _____ has been born to you.",
          answers: ["Savior"],
        },
        {
          reference: "Luke 2:14",
          template:
            "Glory to God in the highest, and on earth _____ to those on whom his favor rests.",
          answers: ["peace"],
        },
        {
          reference: "Luke 2:20",
          template: "The shepherds returned, glorifying and _____ God for all they had heard and seen.",
          answers: ["praising"],
        },
      ],
      wordBank: [
        "manger",
        "joy",
        "Savior",
        "peace",
        "praising",
        "stable",
        "fear",
        "King",
        "hope",
        "thanking",
      ],
    },
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
    verseActivity: {
      verses: [
        {
          reference: "Luke 15:18",
          template:
            "I will go back to my father and say, 'I have _____ against heaven and against you.'",
          answers: ["sinned"],
        },
        {
          reference: "Luke 15:20",
          template:
            "While he was still a long way off, his father saw him and was filled with _____ for him.",
          answers: ["compassion"],
        },
        {
          reference: "Luke 15:22",
          template: "Quick! Bring the best _____ and put it on him.",
          answers: ["robe"],
        },
        {
          reference: "Luke 15:24",
          template: "This son of mine was dead and is alive again; he was lost and is _____.",
          answers: ["found"],
        },
        {
          reference: "Luke 15:32",
          template:
            "We had to celebrate and be glad, because this brother of yours was dead and is alive _____.",
          answers: ["again"],
        },
      ],
      wordBank: [
        "sinned",
        "compassion",
        "robe",
        "found",
        "again",
        "failed",
        "pity",
        "coat",
        "saved",
        "anew",
      ],
    },
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
    verseActivity: {
      verses: [
        {
          reference: "John 8:7",
          template: "Let any one of you who is without sin be the first to throw a _____ at her.",
          answers: ["stone"],
        },
        {
          reference: "John 8:9",
          template: "Those who heard began to go away one at a time, the _____ ones first.",
          answers: ["older"],
        },
        {
          reference: "John 8:10",
          template: "Woman, where are they? Has no one _____ you?",
          answers: ["condemned"],
        },
        {
          reference: "John 8:11",
          template: "Neither do I condemn you. Go now and leave your life of _____.",
          answers: ["sin"],
        },
      ],
      wordBank: ["stone", "older", "condemned", "sin", "rock", "younger", "judged", "shame"],
    },
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
    summary:
      "A giant no one else will face, and a shepherd boy who shows up with a sling and a reason bigger than fear: \"the LORD who rescued me from the lion and the bear will rescue me from this Philistine.\" Goliath brings a sword; David brings a name. It's the same choice underneath every fight that feels too big — whose reputation is actually on the line here.",
    verseActivity: {
      verses: [
        {
          reference: "1 Samuel 17:37",
          template:
            "The LORD who rescued me from the lion and the bear will rescue me from this _____.",
          answers: ["Philistine"],
        },
        {
          reference: "1 Samuel 17:45",
          template:
            "You come against me with sword and spear, but I come against you in the name of the LORD _____.",
          answers: ["Almighty"],
        },
        {
          reference: "1 Samuel 17:47",
          template: "It is not by sword or spear that the LORD _____; for the battle is the LORD's.",
          answers: ["saves"],
        },
        {
          reference: "1 Samuel 17:49",
          template: "David slung it and struck the Philistine on the _____.",
          answers: ["forehead"],
        },
        {
          reference: "1 Samuel 17:50",
          template: "So David triumphed over the Philistine with a sling and a _____.",
          answers: ["stone"],
        },
      ],
      wordBank: [
        "Philistine",
        "Almighty",
        "saves",
        "forehead",
        "stone",
        "giant",
        "Mighty",
        "wins",
        "chest",
        "rock",
      ],
    },
    xpReward: 15,
    estimatedMinutes: 8,
  },
  {
    id: "day-09-fillblank-philippians-4-13",
    title: "Jesus Calms the Storm",
    track: "scripture",
    order: 9,
    scriptureReference: "Mark 4:35-41",
    lessonBook: "Mark",
    summary:
      "The storm is real, the boat is actually taking on water, and the disciples actually think they're going to die — Jesus is just asleep through all of it. He wakes up, says three words to the wind and waves, and it's over. The question He asks next isn't really about the storm: \"why are you so afraid? Do you still have no faith?\"",
    verseActivity: {
      verses: [
        {
          reference: "Mark 4:38",
          template: "Teacher, don't you care if we _____?",
          answers: ["drown"],
        },
        {
          reference: "Mark 4:39",
          template: "Quiet! Be _____! Then the wind died down and it was completely calm.",
          answers: ["still"],
        },
        {
          reference: "Mark 4:40",
          template: "Why are you so afraid? Do you still have no _____?",
          answers: ["faith"],
        },
        {
          reference: "Mark 4:41",
          template: "Even the wind and the waves _____ him!",
          answers: ["obey"],
        },
      ],
      wordBank: ["drown", "still", "faith", "obey", "sink", "calm", "hope", "listen"],
    },
    xpReward: 15,
    estimatedMinutes: 6,
  },
  {
    id: "day-10-fillblank-psalm-23-1",
    title: "The Resurrection",
    track: "scripture",
    order: 10,
    scriptureReference: "John 20:1-18",
    lessonBook: "John",
    summary:
      "Mary comes to grieve at a tomb and finds it empty — her first thought is that someone took the body. Then a familiar voice says her name, and everything turns: the gardener she didn't recognize is the risen Christ. She runs to tell the others the only sentence that matters: \"I have seen the Lord!\"",
    verseActivity: {
      verses: [
        {
          reference: "John 20:2",
          template:
            "They have taken the _____ out of the tomb, and we don't know where they have put him!",
          answers: ["Lord"],
        },
        {
          reference: "John 20:15",
          template: "Woman, why are you _____? Who is it you are looking for?",
          answers: ["crying"],
        },
        {
          reference: "John 20:16",
          template: "Jesus said to her, '_____.' She turned toward him and cried out, 'Rabboni!'",
          answers: ["Mary"],
        },
        {
          reference: "John 20:17",
          template: "Go instead to my brothers and tell them, 'I am ascending to my _____.'",
          answers: ["Father"],
        },
      ],
      wordBank: ["Lord", "crying", "Mary", "Father", "Teacher", "weeping", "Martha", "God"],
    },
    xpReward: 15,
    estimatedMinutes: 6,
  },
];
