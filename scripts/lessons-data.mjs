/**
 * Seed content for the `lessons` collection — narrative Bible events/stories
 * (Creation, the Red Sea, David and Goliath, ...), each a guided,
 * one-screen-at-a-time sequence rather than a single scrolling card.
 * Matches the LessonDoc shape in src/types/firestore.ts, minus `createdAt`
 * (the seed script stamps that on write).
 *
 * Every lesson has:
 * - `chronologicalOrder` — its position in the single sequence across the
 *   whole library (sparse, multiples of 100, so later lessons can be
 *   inserted between two existing ones without renumbering the rest).
 * - `summary` — the opening screen's scene-setup text. Deliberately
 *   doesn't give away the ending; `resolution` does that.
 * - `screens` — the question screens in between: a mix of "scenario" (free
 *   text, no wrong answer), "multipleChoice" (plausible distractors),
 *   "shortAnswer" (self-marked), and "verseBlank" (the existing
 *   fill-in-the-blank activity, reused as one screen type — same
 *   VerseActivity shape as before: up to 5 of the passage's most
 *   important verses, fewer when the passage doesn't have that many
 *   worth quizzing, `template` marking each blank with the literal
 *   "_____" — see BLANK_TOKEN, src/types/firestore.ts).
 * - `resolution` — what actually happened in Scripture, shown on the
 *   final screen.
 * - `nextHook` — a cliffhanger pointing at the next lesson in
 *   chronological order, shown alongside `resolution`.
 * - `imageUrl` — null for every lesson today (no illustrations generated
 *   yet); the UI falls back to a placeholder gradient+icon.
 *
 * `lessonBook` must exactly match a `name` in BIBLE_BOOKS (src/lib/bible.ts).
 * IDs are reused from the app's original single-verse lesson set (a
 * deliberate migration choice — see the "Lesson migration" discussion) —
 * they no longer correlate with the current title, only with docId
 * continuity.
 */
export const lessons = [
  {
    id: "day-01-creation",
    title: "The Creation of the World",
    track: "scripture",
    chronologicalOrder: 100,
    scriptureReference: "Genesis 1:1-2:3",
    lessonBook: "Genesis",
    imageUrl: null,
    summary:
      "In six days, God speaks a formless world into shape — light, sky, land, and every living thing — and calls it good. Before anything else is said about who you are, this is who God is: a Creator who speaks order out of chaos, on purpose.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "Picture the moment before anything existed — no light, no shape, nothing. If you'd watched God speak the first word ('Let there be light') and seen it actually happen, what's the first thing you'd want to ask Him?",
        placeholder: "Write what you'd ask…",
        context:
          "Job 38:4-7 records God later asking Job the same kind of question in reverse: \"Where were you when I laid the earth's foundation?… the morning stars sang together.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did God do on the seventh day, after six days of creating?",
        options: ["Created the first humans", "Rested", "Flooded the earth", "Gave Moses the commandments"],
        correctIndex: 1,
        context:
          "Genesis 2:2-3 — \"By the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work… he blessed the seventh day and made it holy.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "God calls what He made 'good' six times before humans ever do anything right or wrong. What does that tell you about how God saw the world — and you — from the very start?",
        context:
          "This 'good' comes before the fall in Genesis 3 — before sin enters the story at all. Worth sitting with: goodness was the starting point, not something earned.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 1:1", template: "In the beginning God created the heavens and the _____.", answers: ["earth"] },
            { reference: "Genesis 1:3", template: "And God said, 'Let there be _____,' and there was light.", answers: ["light"] },
            { reference: "Genesis 1:27", template: "So God created mankind in his own _____; male and female he created them.", answers: ["image"] },
            { reference: "Genesis 1:31", template: "God saw all that he had made, and it was very _____.", answers: ["good"] },
            { reference: "Genesis 2:2", template: "On the seventh day God rested from all his _____.", answers: ["work"] },
          ],
          wordBank: ["earth", "light", "image", "good", "work", "sky", "water", "glory", "evil", "rest"],
        },
      },
    ],
    resolution:
      "In six days, God speaks a formless world into shape — light, sky, land, every living thing — and calls it good. On the seventh, He rests, setting a rhythm of work and rest that runs through the whole of Scripture.",
    nextHook:
      "Not long after, that same 'very good' world breaks — and God's response isn't to walk away from it. Next: one family, a flood, and a promise that outlasts the water.",
    estimatedMinutes: 8,
  },
  {
    id: "day-02-lords-prayer",
    title: "Noah and the Flood",
    track: "scripture",
    chronologicalOrder: 200,
    scriptureReference: "Genesis 6:5-9:17",
    lessonBook: "Genesis",
    imageUrl: null,
    summary:
      "When the world's evil grieves God's heart, He chooses one faithful family to carry creation through judgment — not to punish for its own sake, but to start again. Noah spends over a year on a boat he built on dry land, trusting a flood he was told was coming.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're Noah, and God has just told you to build a massive boat — on dry land, with no rain in sight, for a flood no one else believes is coming. What do you say back to Him?",
        placeholder: "Write what you'd say…",
        context:
          "Scripture never records Noah arguing or asking for proof — Genesis 6:22 just says: \"Noah did everything just as God commanded him.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "How did Noah know it was finally safe to leave the ark?",
        options: [
          "God sent an angel to tell him",
          "A dove came back with an olive leaf",
          "The rain sound stopped completely",
          "He counted exactly 40 days",
        ],
        correctIndex: 1,
        context:
          "Genesis 8:10-11 — after a raven and a first dove found nowhere to land, Noah sent the dove out again, and it returned \"in the evening… in its beak was a freshly plucked olive leaf.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "God could have just ended evil outright. Instead He saves one family and starts over through them. Why start over instead of starting from nothing?",
        context:
          "The flood story ends not with a clean slate but with a promise (Genesis 9:11): \"Never again will all life be destroyed by the waters of a flood.\" Judgment and covenant, back to back.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 6:8", template: "But Noah found _____ in the eyes of the LORD.", answers: ["favor"] },
            { reference: "Genesis 7:12", template: "And rain fell on the earth forty days and forty _____.", answers: ["nights"] },
            { reference: "Genesis 8:11", template: "There in its beak was a freshly plucked olive _____!", answers: ["leaf"] },
            { reference: "Genesis 9:13", template: "I have set my _____ in the clouds as a sign of the covenant between me and the earth.", answers: ["rainbow"] },
            { reference: "Genesis 9:15", template: "Never again will the waters become a _____ to destroy all life.", answers: ["flood"] },
          ],
          wordBank: ["favor", "nights", "leaf", "rainbow", "flood", "mercy", "days", "branch", "promise", "storm"],
        },
      },
    ],
    resolution:
      "Noah builds, waits, and finally steps onto washed ground under a rainbow — God's promise never to flood the earth again. Judgment and mercy, holding together rather than canceling each other out.",
    nextHook:
      "Generations later, that same family's descendants will find themselves trapped between an army and the sea — and discover the same God still makes a way through what looks like the end. Next: the Red Sea.",
    estimatedMinutes: 8,
  },
  {
    id: "day-03-the-shepherd",
    title: "Moses Parts the Red Sea",
    track: "scripture",
    chronologicalOrder: 300,
    scriptureReference: "Exodus 14:1-31",
    lessonBook: "Exodus",
    imageUrl: null,
    summary:
      "Trapped between Pharaoh's army and the sea, Israel has nowhere left to run. Moses raises his hand toward the water and tells a terrified people to stand firm and watch what God is about to do.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're standing with the Israelites at the sea, watching Pharaoh's army close in behind you. What do you say to Moses?",
        placeholder: "Write what you'd say…",
        context:
          "The people's actual response was panic and blame (Exodus 14:11-12): \"Was it because there were no graves in Egypt that you brought us to die in the wilderness?\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did Moses tell the people to do as Pharaoh's army approached?",
        options: [
          "Turn and fight the Egyptians",
          "Stand firm and watch what God would do",
          "Run further into the wilderness",
          "Send a messenger to negotiate with Pharaoh",
        ],
        correctIndex: 1,
        context:
          "Exodus 14:13-14 — \"Do not be afraid. Stand firm and you will see the deliverance the LORD will bring you today… The LORD will fight for you; you need only to be still.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "In your own words: why do you think God waited until the people were trapped — sea ahead, army behind — before making a way through?",
        context:
          "There's no single \"correct\" answer here — but Scripture repeatedly shows God working right at the point where every human option has run out.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Exodus 14:13", template: "Do not be afraid. Stand firm and you will see the _____ the LORD will bring you today.", answers: ["deliverance"] },
            { reference: "Exodus 14:14", template: "The LORD will fight for you; you need only to be _____.", answers: ["still"] },
            { reference: "Exodus 14:21", template: "Moses stretched out his hand, and the LORD drove the sea back with a strong east _____.", answers: ["wind"] },
            { reference: "Exodus 14:22", template: "The Israelites went through the sea on dry _____.", answers: ["ground"] },
            { reference: "Exodus 14:31", template: "The people feared the LORD and put their _____ in him.", answers: ["trust"] },
          ],
          wordBank: ["deliverance", "still", "wind", "ground", "trust", "rescue", "quiet", "storm", "land", "faith"],
        },
      },
    ],
    resolution:
      "Moses stretched out his hand, and the LORD drove the sea back with a strong east wind, turning it into dry ground. Israel crossed with a wall of water on both sides, and everyone who saw it \"feared the LORD and put their trust in him.\"",
    nextHook:
      "Free on the far shore, Israel will spend generations in the land God promised them — kings rise and fall, and eventually a shepherd boy with a sling will face a giant no soldier would touch. Next: David and Goliath.",
    estimatedMinutes: 7,
  },
  {
    id: "day-08-fillblank-john-3-16",
    title: "David and Goliath",
    track: "scripture",
    chronologicalOrder: 400,
    scriptureReference: "1 Samuel 17:1-50",
    lessonBook: "1 Samuel",
    imageUrl: null,
    summary:
      "A giant no one else will face, and a shepherd boy who shows up with a sling and a reason bigger than fear. Goliath brings a sword; David brings a name.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're one of Israel's soldiers, watching a teenager walk out to face a nine-foot-tall champion with nothing but a sling. What do you shout after him?",
        placeholder: "Write what you'd shout…",
        context:
          "1 Samuel 17:11 says when Goliath first issued his challenge, \"Saul and all the Israelites were dismayed and terrified\" — nobody moved for forty days, until David showed up.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "Why did David refuse to wear Saul's armor before the fight?",
        options: [
          "It was the wrong size and he wasn't used to it",
          "He wanted the glory for himself alone",
          "Goliath had already seen it",
          "Samuel told him not to",
        ],
        correctIndex: 0,
        context:
          "1 Samuel 17:39 — David tried it on, then said, \"I cannot go in these, because I am not used to them.\" He fought with what he actually knew: a sling.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "David tells Goliath the battle 'is the LORD's' before he's even thrown a stone. What's the difference between confidence in yourself and confidence in who's fighting for you?",
        context:
          "This is the same posture Moses called for at the Red Sea — \"the LORD will fight for you; you need only to be still\" — except here David is the one moving, not standing still. Trust doesn't always look like waiting.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "1 Samuel 17:37", template: "The LORD who rescued me from the lion and the bear will rescue me from this _____.", answers: ["Philistine"] },
            { reference: "1 Samuel 17:45", template: "You come against me with sword and spear, but I come against you in the name of the LORD _____.", answers: ["Almighty"] },
            { reference: "1 Samuel 17:47", template: "It is not by sword or spear that the LORD _____; for the battle is the LORD's.", answers: ["saves"] },
            { reference: "1 Samuel 17:49", template: "David slung it and struck the Philistine on the _____.", answers: ["forehead"] },
            { reference: "1 Samuel 17:50", template: "So David triumphed over the Philistine with a sling and a _____.", answers: ["stone"] },
          ],
          wordBank: ["Philistine", "Almighty", "saves", "forehead", "stone", "giant", "Mighty", "wins", "chest", "rock"],
        },
      },
    ],
    resolution:
      "A giant no one else would face, and a shepherd boy who shows up with a sling and a reason bigger than fear. 'The battle is the LORD's' — and David triumphs with nothing but that sling and a stone.",
    nextHook:
      "David's own story doesn't stay this simple — a king's life gets complicated in ways a shepherd's never does. Centuries later, another young man faces his own impossible test, not with a sling but with prayer, in a den of lions. Next: Daniel.",
    estimatedMinutes: 8,
  },
  {
    id: "day-04-the-word-made-flesh",
    title: "Daniel in the Lions' Den",
    track: "scripture",
    chronologicalOrder: 500,
    scriptureReference: "Daniel 6:1-23",
    lessonBook: "Daniel",
    imageUrl: null,
    summary:
      "Daniel keeps praying three times a day even after a law is passed specifically to trap him for it — because some things matter more than staying safe. That night, he's thrown into a den of lions.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You've just learned the king signed a law making it illegal to pray to anyone but him for the next thirty days — and you know people are watching to see if you'll stop. What do you do that evening?",
        placeholder: "Write what you'd do…",
        context:
          "Daniel 6:10 says when Daniel heard about the decree, he did exactly what he always did: went home and prayed three times a day, \"just as he had done before.\" No dramatic gesture — just his ordinary habit, kept.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "Why did Daniel's rivals target his prayer habits specifically, instead of some other accusation?",
        options: [
          "They caught him stealing",
          "It was the only thing they could find fault with",
          "He had insulted the king publicly",
          "He refused to work on the Sabbath",
        ],
        correctIndex: 1,
        context:
          "Daniel 6:4-5 — his rivals searched for grounds to accuse him and \"could find no corruption in him,\" so they concluded, \"We will never find any basis for charges against this man Daniel unless it has something to do with the law of his God.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Daniel didn't pray louder or more dramatically once it became illegal — he just kept doing what he'd always done. What does that say about what faithfulness actually looks like day to day?",
        context:
          "Contrast this with a crisis-mode faith that only shows up under pressure. Daniel's prayer life the night before the law passed and the night after look identical.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Daniel 6:10", template: "Three times a day Daniel got down on his knees and _____.", answers: ["prayed"] },
            { reference: "Daniel 6:16", template: "May your God, whom you serve continually, _____ you!", answers: ["rescue"] },
            { reference: "Daniel 6:20", template: "Has your God been able to rescue you from the _____?", answers: ["lions"] },
            { reference: "Daniel 6:22", template: "My God sent his _____, and he shut the mouths of the lions.", answers: ["angel"] },
            { reference: "Daniel 6:23", template: "No wound was found on him, because he had _____ in his God.", answers: ["trusted"] },
          ],
          wordBank: ["prayed", "rescue", "lions", "angel", "trusted", "fasted", "deliver", "den", "messenger", "believed"],
        },
      },
    ],
    resolution:
      "Daniel keeps praying three times a day even after a law is passed to trap him for it. Thrown to the lions overnight, he's found alive at dawn: \"my God sent his angel and shut the lions' mouths.\"",
    nextHook:
      "Centuries of waiting for God to make good on His promises come to a point no one expects — not in a palace, but in a feeding trough, in an unremarkable town, to parents nobody would have picked. Next: the birth of Jesus.",
    estimatedMinutes: 7,
  },
  {
    id: "day-05-fully-known",
    title: "The Birth of Jesus",
    track: "scripture",
    chronologicalOrder: 600,
    scriptureReference: "Luke 2:1-20",
    lessonBook: "Luke",
    imageUrl: null,
    summary:
      "No room, no fanfare — God enters the world as a baby in a feeding trough, and the first people told are shepherds working the night shift, not anyone important.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're one of the shepherds out in the fields that night, and an angel just told you the Messiah was born a few minutes' walk away, wrapped in cloths, lying in a manger. What do you say to the other shepherds?",
        placeholder: "Write what you'd say…",
        context:
          "Luke 2:15 records their actual response: \"Let's go to Bethlehem and see this thing that has happened, which the Lord has told us about.\" They didn't debate it — they went.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "Who were the first people told about Jesus' birth, according to Luke?",
        options: [
          "The religious leaders in Jerusalem",
          "King Herod's court",
          "Shepherds in the fields nearby",
          "Wise men from the East",
        ],
        correctIndex: 2,
        context:
          "Luke 2:8-12 — shepherds, working the night shift, low on the social ladder of the time. (The wise men show up later, in Matthew's Gospel, and not to a manger.)",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Of all the people God could have told first — kings, priests, scholars — He picked shepherds. Why do you think that detail is in the story at all?",
        context:
          "This pattern doesn't stop at the manger — Jesus keeps showing up for the overlooked throughout His ministry: tax collectors, the sick, the outsiders.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Luke 2:7", template: "She wrapped him in cloths and placed him in a _____.", answers: ["manger"] },
            { reference: "Luke 2:10", template: "I bring you good news that will cause great _____ for all the people.", answers: ["joy"] },
            { reference: "Luke 2:11", template: "Today in the town of David a _____ has been born to you.", answers: ["Savior"] },
            { reference: "Luke 2:14", template: "Glory to God in the highest, and on earth _____ to those on whom his favor rests.", answers: ["peace"] },
            { reference: "Luke 2:20", template: "The shepherds returned, glorifying and _____ God for all they had heard and seen.", answers: ["praising"] },
          ],
          wordBank: ["manger", "joy", "Savior", "peace", "praising", "stable", "fear", "King", "hope", "thanking"],
        },
      },
    ],
    resolution:
      "God enters the world as a baby in a feeding trough, and the first people told are shepherds working the night shift — not anyone important. The overlooked get the news first; that's the shape the whole story keeps taking.",
    nextHook:
      "That baby grows up — and the grown man will do something that terrifies even His closest friends: fall asleep in a boat, in the middle of a storm that has them convinced they're about to die. Next: Jesus calms the storm.",
    estimatedMinutes: 6,
  },
  {
    id: "day-09-fillblank-philippians-4-13",
    title: "Jesus Calms the Storm",
    track: "scripture",
    chronologicalOrder: 700,
    scriptureReference: "Mark 4:35-41",
    lessonBook: "Mark",
    imageUrl: null,
    summary:
      "The storm is real, the boat is actually taking on water, and the disciples actually think they're going to die — Jesus is just asleep through all of it.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're in the boat, waves crashing over the side, and Jesus is asleep in the stern like nothing's wrong. What do you say when you finally wake Him up?",
        placeholder: "Write what you'd say…",
        context:
          "Mark 4:38 records the disciples' actual words: \"Teacher, don't you care if we drown?\" — half question, half accusation.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What happened immediately after Jesus said 'Quiet! Be still' to the storm?",
        options: [
          "The disciples started rowing harder",
          "The wind died down and it was completely calm",
          "The boat sank anyway",
          "The storm got worse before it stopped",
        ],
        correctIndex: 1,
        context: "Mark 4:39 — the calm wasn't gradual. The text says it happened the instant He spoke.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The disciples were experienced fishermen — they'd seen storms before. What do you think actually scared them more: the storm itself, or realizing what kind of person Jesus was?",
        context:
          "Mark 4:41 — after the storm stops, they're described as \"terrified\" in a different way: \"Who is this? Even the wind and the waves obey him!\" The fear shifts from the storm to Jesus Himself.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Mark 4:38", template: "Teacher, don't you care if we _____?", answers: ["drown"] },
            { reference: "Mark 4:39", template: "Quiet! Be _____! Then the wind died down and it was completely calm.", answers: ["still"] },
            { reference: "Mark 4:40", template: "Why are you so afraid? Do you still have no _____?", answers: ["faith"] },
            { reference: "Mark 4:41", template: "Even the wind and the waves _____ him!", answers: ["obey"] },
          ],
          wordBank: ["drown", "still", "faith", "obey", "sink", "calm", "hope", "listen"],
        },
      },
    ],
    resolution:
      "The storm is real, the disciples are convinced they're about to die — and Jesus says three words to the wind and waves, and it's over. The real question isn't about the storm: \"why are you so afraid? Do you still have no faith?\"",
    nextHook:
      "Not every storm Jesus calms is made of wind and water — some of His hardest stories are about a father waiting for a son who ran, and whether we'd actually want him to come home. Next: the Prodigal Son.",
    estimatedMinutes: 6,
  },
  {
    id: "day-06-do-not-be-anxious",
    title: "The Prodigal Son",
    track: "scripture",
    chronologicalOrder: 800,
    scriptureReference: "Luke 15:11-32",
    lessonBook: "Luke",
    imageUrl: null,
    summary:
      "A son takes his inheritance early, wastes it, and finally turns back toward home — rehearsing an apology he's not sure will be enough. Notice which character you actually read yourself as today: the son who left, or the older brother still keeping score at the door.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're the younger son, walking back up the road toward home, rehearsing your apology, sure you no longer deserve to be called a son. What do you actually say when your father comes running toward you?",
        placeholder: "Write what you'd say…",
        context:
          "Luke 15:21 — he barely gets the words out: \"Father, I have sinned against heaven and against you. I am no longer worthy to be called your son.\" He doesn't even finish the speech he planned — the father's already calling for a robe and a ring.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did the father do when he saw his son coming while he was still a long way off?",
        options: [
          "Waited at the door for him to apologize first",
          "Sent a servant to bring the son to him",
          "Ran to meet him",
          "Refused to come out of the house",
        ],
        correctIndex: 2,
        context:
          "Luke 15:20 — \"while he was still a long way off, his father saw him and was filled with compassion for him; he ran to his son, threw his arms around him and kissed him.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The older brother refuses to join the celebration because it doesn't seem fair. Is he wrong to feel that way — and does the father actually dismiss his complaint?",
        context:
          "Luke 15:31 — the father doesn't scold the older son, he reassures him: \"My son, you are always with me, and everything I have is yours.\" The story ends unresolved — we don't know if the older brother ever goes in.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Luke 15:18", template: "I will go back to my father and say, 'I have _____ against heaven and against you.'", answers: ["sinned"] },
            { reference: "Luke 15:20", template: "While he was still a long way off, his father saw him and was filled with _____ for him.", answers: ["compassion"] },
            { reference: "Luke 15:22", template: "Quick! Bring the best _____ and put it on him.", answers: ["robe"] },
            { reference: "Luke 15:24", template: "This son of mine was dead and is alive again; he was lost and is _____.", answers: ["found"] },
            { reference: "Luke 15:32", template: "We had to celebrate and be glad, because this brother of yours was dead and is alive _____.", answers: ["again"] },
          ],
          wordBank: ["sinned", "compassion", "robe", "found", "again", "failed", "pity", "coat", "saved", "anew"],
        },
      },
    ],
    resolution:
      "A son wastes everything and comes home rehearsing an apology he never gets to finish — his father is already running toward him. Grace that isn't earned back, offered to a son who thought he'd disqualified himself.",
    nextHook:
      "Not everyone around Jesus is as ready to extend that grace — some people are far more interested in catching someone in the act than in seeing them get free of it. Next: the woman caught in sin.",
    estimatedMinutes: 8,
  },
  {
    id: "day-07-nothing-can-separate",
    title: "Jesus and the Woman Caught in Sin",
    track: "scripture",
    chronologicalOrder: 900,
    scriptureReference: "John 8:1-11",
    lessonBook: "John",
    imageUrl: null,
    summary:
      "Dragged in front of Jesus to be stoned, a woman is used as a trap. Jesus bends down, writes in the dust, and says something that changes who's holding the stones.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're standing in the crowd that dragged this woman in front of Jesus, stones already in hand, and He's just said 'let anyone among you who is without sin cast the first stone.' What do you do?",
        placeholder: "Write what you'd do…",
        context:
          "John 8:9 says the crowd left \"one at a time, beginning with the oldest\" — the ones with the most years to reflect on their own record left first.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did Jesus say to the woman after everyone else had left?",
        options: [
          "'Go and sin no more, and don't get caught again'",
          "'Neither do I condemn you; go now and leave your life of sin'",
          "'Your accusers were right to bring you here'",
          "He said nothing and walked away",
        ],
        correctIndex: 1,
        context:
          "John 8:11 — both halves matter: genuine forgiveness (\"neither do I condemn you\") and a real call forward (\"go now and leave your life of sin\"), not one without the other.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The men who brought her were using her as a trap for Jesus, not out of concern for the law. Does that change how you read the story — and does it matter why someone points out someone else's sin?",
        context:
          "John 8:6 says outright: \"they were using this question as a trap, in order to have a basis for accusing him.\" The woman was a means to an end for them, not a person.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "John 8:7", template: "Let any one of you who is without sin be the first to throw a _____ at her.", answers: ["stone"] },
            { reference: "John 8:9", template: "Those who heard began to go away one at a time, the _____ ones first.", answers: ["older"] },
            { reference: "John 8:10", template: "Woman, where are they? Has no one _____ you?", answers: ["condemned"] },
            { reference: "John 8:11", template: "Neither do I condemn you. Go now and leave your life of _____.", answers: ["sin"] },
          ],
          wordBank: ["stone", "older", "condemned", "sin", "rock", "younger", "judged", "shame"],
        },
      },
    ],
    resolution:
      "A woman is dragged in front of Jesus as a trap — until He tells her accusers that whoever is without sin can throw the first stone, and they walk away one by one. \"Neither do I condemn you,\" He tells her, \"go now and leave your life of sin.\"",
    nextHook:
      "Grace this real costs something — and not long after, the people who wanted Jesus gone will finally get their way. But the story doesn't end at a cross. Next: the resurrection.",
    estimatedMinutes: 7,
  },
  {
    id: "day-10-fillblank-psalm-23-1",
    title: "The Resurrection",
    track: "scripture",
    chronologicalOrder: 1000,
    scriptureReference: "John 20:1-18",
    lessonBook: "John",
    imageUrl: null,
    summary:
      "Mary comes to grieve at a tomb and finds it empty — her first thought is that someone has taken the body.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're Mary, standing outside the empty tomb in tears, certain someone has taken the body — and then the man you thought was the gardener says your name. What's the first thing you say back to Him?",
        placeholder: "Write what you'd say…",
        context:
          "John 20:16 records her actual, one-word answer: \"Rabboni!\" — \"Teacher.\" Not a speech. Just recognition, all at once.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What was Mary's first assumption when she found the tomb empty?",
        options: [
          "That Jesus had risen as He predicted",
          "That someone had taken the body",
          "That she'd come to the wrong tomb",
          "That it was a trick by the religious leaders",
        ],
        correctIndex: 1,
        context:
          "John 20:2 — her first words to Peter and John: \"They have taken the Lord out of the tomb, and we don't know where they have put him!\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Mary doesn't recognize Jesus until He says her name. What do you think it means that recognition came through something so personal, rather than how He looked?",
        context:
          "This isn't the only resurrection appearance where someone doesn't immediately recognize Him (see also Luke 24:13-35, the road to Emmaus) — recognition consistently comes through something relational, not just sight.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "John 20:2", template: "They have taken the _____ out of the tomb, and we don't know where they have put him!", answers: ["Lord"] },
            { reference: "John 20:15", template: "Woman, why are you _____? Who is it you are looking for?", answers: ["crying"] },
            { reference: "John 20:16", template: "Jesus said to her, '_____.' She turned toward him and cried out, 'Rabboni!'", answers: ["Mary"] },
            { reference: "John 20:17", template: "Go instead to my brothers and tell them, 'I am ascending to my _____.'", answers: ["Father"] },
          ],
          wordBank: ["Lord", "crying", "Mary", "Father", "Teacher", "weeping", "Martha", "God"],
        },
      },
    ],
    resolution:
      "Mary comes to grieve at an empty tomb — then a familiar voice says her name, and everything turns. She runs to tell the others the only sentence that matters: \"I have seen the Lord!\"",
    nextHook:
      "This is where the seeded library stands today — more stories, spanning both testaments, are on their way. Come back for what's next.",
    estimatedMinutes: 6,
  },
];
