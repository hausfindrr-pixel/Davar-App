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
    imageUrl: "/events/creation.webp",
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
      "That same 'very good' world doesn't stay that way for long — one rule, one question from a serpent, and everything changes. Next: Adam and Eve in the Garden.",
    estimatedMinutes: 8,
  },
  {
    id: "adam-and-eve",
    title: "Adam and Eve in the Garden",
    track: "scripture",
    chronologicalOrder: 110,
    scriptureReference: "Genesis 2:4-3:24",
    lessonBook: "Genesis",
    imageUrl: "/events/adam-and-eve.webp",
    summary:
      "God places the first two humans in a garden with exactly one rule — and everything they could ever want except that. When a serpent asks a simple, twisted question ('Did God really say...?'), the whole story turns on how they answer it.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're standing in a garden that has everything you could want, with one tree off-limits. A voice asks, 'Did God really say you can't eat from any tree?' What's the first thing you notice about that question?",
        placeholder: "Write what you'd notice…",
        context:
          "Genesis 3:1 says the serpent was \"more crafty than any of the wild animals\" — the question itself is the first twist: God actually said they could eat from any tree but one.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "After Adam and Eve eat the fruit, what's the first thing they do?",
        options: ["Run to find God", "Hide from each other in shame", "Sew coverings and hide from God", "Blame the serpent to God's face"],
        correctIndex: 2,
        context:
          "Genesis 3:7-8 — \"they realized they were naked; so they sewed fig leaves together… Then the man and his wife hid from the LORD God.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "God asks Adam 'Where are you?' — not because He doesn't know, but because Adam is hiding. Why would God ask a question He already knows the answer to?",
        context:
          "The question isn't for information — it's an invitation to come out of hiding, the same pattern God uses throughout Scripture.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 2:17", template: "but you must not eat from the tree of the knowledge of good and evil, for when you eat from it you will certainly _____.", answers: ["die"] },
            { reference: "Genesis 3:6", template: "she took some and ate it. She also gave some to her husband, who was with her, and he _____ it.", answers: ["ate"] },
            { reference: "Genesis 3:9", template: "But the LORD God called to the man, 'Where are _____?'", answers: ["you"] },
            { reference: "Genesis 3:15", template: "he will crush your head, and you will strike his _____.", answers: ["heel"] },
            { reference: "Genesis 3:21", template: "The LORD God made garments of skin for Adam and his wife and _____ them.", answers: ["clothed"] },
          ],
          wordBank: ["die", "ate", "you", "heel", "clothed", "hide", "fruit", "serpent", "garden", "naked"],
        },
      },
    ],
    resolution:
      "Adam and Eve eat, and shame enters where trust used to be — but even as God pronounces the consequences, He also makes them clothing with His own hands and promises that the serpent's power will one day be crushed. Judgment and a promise, in the very same breath.",
    nextHook:
      "That promise doesn't stay abstract for long — within one generation, the first family will lose a son to the very kind of broken trust just introduced into the world. Next: Cain and Abel.",
    estimatedMinutes: 8,
  },
  {
    id: "cain-and-abel",
    title: "Cain and Abel",
    track: "scripture",
    chronologicalOrder: 120,
    scriptureReference: "Genesis 4:1-16",
    lessonBook: "Genesis",
    imageUrl: "/events/cain-and-abel.webp",
    summary:
      "Two brothers each bring an offering to God. One is accepted, one isn't — and instead of asking why, Cain lets the question curdle into something worse. God shows up before it's too late, but Cain answers anyway.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "Your offering wasn't accepted, but your brother's was — and God actually explains why (\"sin is crouching at your door… you must rule over it\"). What do you do with that answer?",
        placeholder: "Write what you'd do…",
        context:
          "God doesn't reject Cain — He warns him, in person, before anything happens. The whole tragedy takes place after a direct, personal warning.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does God ask Cain right after Abel is killed?",
        options: ["\"Why did you do this?\"", "\"Where is your brother Abel?\"", "\"Are you sorry?\"", "\"What have you done?\""],
        correctIndex: 1,
        context:
          "Genesis 4:9 — \"Then the LORD said to Cain, 'Where is your brother Abel?' 'I don't know,' he replied. 'Am I my brother's keeper?'\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Cain answers God's question with a question of his own: 'Am I my brother's keeper?' What do you think the honest answer to that is — and why does Cain dodge it?",
        context:
          "The rest of Scripture answers Cain's question loudly: yes. Love of neighbor is treated as inseparable from love of God (Matthew 22:39, 1 John 4:20-21).",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 4:5", template: "on Cain and his offering he did not look with favor. So Cain was very angry, and his face was _____.", answers: ["downcast"] },
            { reference: "Genesis 4:7", template: "sin is crouching at your door; it desires to have you, but you must _____ over it.", answers: ["rule"] },
            { reference: "Genesis 4:9", template: "\"Where is your brother Abel?\" \"I don't know,\" he replied. \"Am I my brother's _____?\"", answers: ["keeper"] },
            { reference: "Genesis 4:10", template: "Your brother's blood cries out to me from the _____.", answers: ["ground"] },
            { reference: "Genesis 4:15", template: "the LORD put a mark on Cain so that no one who found him would kill _____.", answers: ["him"] },
          ],
          wordBank: ["downcast", "rule", "keeper", "ground", "him", "angry", "offering", "mark", "wander", "favor"],
        },
      },
    ],
    resolution:
      "Cain kills Abel, lies to God about it, and is sent away to wander — but even then, God marks him for protection rather than leaving him to be killed in turn. Even Cain, the first murderer, isn't beyond God's protection.",
    nextHook:
      "Generations pass, and the world Cain's choice set in motion grows darker still — until God decides to start again through one faithful family. Next: Noah and the Flood.",
    estimatedMinutes: 8,
  },
  {
    id: "day-02-lords-prayer",
    title: "Noah and the Flood",
    track: "scripture",
    chronologicalOrder: 200,
    scriptureReference: "Genesis 6:5-9:17",
    lessonBook: "Genesis",
    imageUrl: "/events/noah-flood.webp",
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
      "Generations pass, and Noah's descendants — still speaking one language, still together — decide to build something that will make God unnecessary. Next: The Tower of Babel.",
    estimatedMinutes: 8,
  },
  {
    id: "tower-of-babel",
    title: "The Tower of Babel",
    track: "scripture",
    chronologicalOrder: 210,
    scriptureReference: "Genesis 11:1-9",
    lessonBook: "Genesis",
    imageUrl: "/events/tower-of-babel.webp",
    summary:
      "One people, one language, one plan: build a tower to the heavens and make a name for themselves before they're scattered. God doesn't destroy the tower — He just confuses their language, and the ambitious unity falls apart on its own.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "The whole world agrees: 'let us build ourselves a city… and make a name for ourselves.' Everyone around you is swept up in it. Do you build too, or hold back — and why?",
        placeholder: "Write what you'd do…",
        context:
          "Genesis 11:4 gives their stated motive plainly: to make a name for themselves and avoid being scattered — a bid for self-made permanence and control.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "How does God stop the tower from being finished?",
        options: ["He destroys it with fire", "He confuses their language", "He sends a flood", "He collapses it with an earthquake"],
        correctIndex: 1,
        context:
          "Genesis 11:7-8 — \"let us go down and confuse their language… So the LORD scattered them from there over all the earth, and they stopped building the city.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "God doesn't need to destroy anything here — confusing their language is enough to stop the whole plan. What does that tell you about where real unity actually comes from?",
        context:
          "Babel is the opposite of Pentecost (Acts 2), where the Spirit lets people from every language understand one message — scattering undone, not by force, but by the Spirit.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 11:1", template: "Now the whole world had one _____ and a common speech.", answers: ["language"] },
            { reference: "Genesis 11:4", template: "let us build ourselves a city, with a tower that reaches to the _____.", answers: ["heavens"] },
            { reference: "Genesis 11:6", template: "if as one people speaking the same language they have begun to do this, then nothing they plan to do will be _____ for them.", answers: ["impossible"] },
            { reference: "Genesis 11:7", template: "Let us go down and confuse their language so they will not understand each _____.", answers: ["other"] },
            { reference: "Genesis 11:9", template: "That is why it was called Babel — because there the LORD confused the language of the whole _____.", answers: ["world"] },
          ],
          wordBank: ["language", "heavens", "impossible", "other", "world", "tower", "scattered", "name", "build", "city"],
        },
      },
    ],
    resolution:
      "The city is never finished. God scatters the builders across the earth, speaking languages they no longer share — not as pure punishment, but as a check on a humanity trying to secure itself without Him.",
    nextHook:
      "Out of that same scattered humanity, God picks one man in one city and asks him to leave everything he knows, on nothing but a promise. Next: God's Call to Abram.",
    estimatedMinutes: 8,
  },
  {
    id: "abrams-call",
    title: "God's Call to Abram",
    track: "scripture",
    chronologicalOrder: 220,
    scriptureReference: "Genesis 12:1-9",
    lessonBook: "Genesis",
    imageUrl: "/events/abrams-call.webp",
    summary:
      "God tells a 75-year-old man to leave his country, his people, and his father's household for a land he hasn't seen yet — with nothing but a promise attached. Abram goes, 'as the LORD had told him.'",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "God says 'Go, to a land I will show you' — not where it is, not what it's like, just go. You're 75 and settled. What would make you actually pack up and leave?",
        placeholder: "Write what you'd need…",
        context:
          "Genesis 12:4 records the whole decision in one plain sentence: \"So Abram went, as the LORD had told him.\" No negotiation is recorded — just obedience.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does God promise Abram in this call, besides land?",
        options: ["Wealth beyond measure", "That he will become a great nation and be a blessing to all peoples", "Victory over every enemy", "A son within the year"],
        correctIndex: 1,
        context:
          "Genesis 12:2-3 — \"I will make you into a great nation… and all peoples on earth will be blessed through you.\" The promised son (Isaac) comes much later, after years of waiting.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Abram leaves everything familiar on the strength of a promise he won't fully see fulfilled in his lifetime. What's something you're being asked to trust God with before you can see how it turns out?",
        context:
          "Hebrews 11:8 looks back on this moment: \"By faith Abraham… obeyed and went, even though he did not know where he was going.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 12:1", template: "Leave your country, your people and your father's household and go to the land I will _____ you.", answers: ["show"] },
            { reference: "Genesis 12:2", template: "I will make you into a great nation, and I will bless you; I will make your name _____.", answers: ["great"] },
            { reference: "Genesis 12:3", template: "and all peoples on earth will be _____ through you.", answers: ["blessed"] },
            { reference: "Genesis 12:4", template: "So Abram went, as the LORD had told him; and Lot went with _____.", answers: ["him"] },
            { reference: "Genesis 12:7", template: "The LORD appeared to Abram and said, 'To your offspring I will give this _____.'", answers: ["land"] },
          ],
          wordBank: ["show", "great", "blessed", "him", "land", "nation", "promise", "altar", "journey", "country"],
        },
      },
    ],
    resolution:
      "Abram leaves Harran at 75 with his wife Sarai, his nephew Lot, and everything he owns — trusting a promise about a nation, a name, and a blessing he can't yet see. He builds an altar in the land God shows him and calls on the name of the LORD.",
    nextHook:
      "That promise gets tested in the hardest way possible, decades later, on a mountain with his own long-awaited son. Next: Abraham and Isaac.",
    estimatedMinutes: 8,
  },
  {
    id: "abraham-and-isaac",
    title: "Abraham and Isaac",
    track: "scripture",
    chronologicalOrder: 230,
    scriptureReference: "Genesis 22:1-19",
    lessonBook: "Genesis",
    imageUrl: "/events/abraham-and-isaac.webp",
    summary:
      "God asks Abraham to sacrifice Isaac — the son he waited decades for, the son the promise depended on. Abraham climbs the mountain anyway, and at the very last moment, God provides another way.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "God asks you to give up the one thing your whole future seems to depend on, with no explanation. You have three days of walking to think about it. What's going through your mind?",
        placeholder: "Write what you'd be thinking…",
        context:
          "Genesis 22:5 has Abraham tell his servants, \"We will worship and then we will come back to you\" — plural, suggesting he expected Isaac to return with him, somehow.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What stops Abraham at the last moment?",
        options: ["Isaac begs him to stop", "An angel calls out and a ram is caught in a thicket", "Sarah arrives just in time", "God changes His mind out loud"],
        correctIndex: 1,
        context:
          "Genesis 22:11-13 — the angel of the LORD calls from heaven just as Abraham raises the knife, and Abraham looks up to see a ram caught by its horns in a thicket.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "This story is hard to read. What do you think it reveals about the difference between what God asks and what God actually wants?",
        context:
          "Genesis 22:12 gives the point directly: \"Now I know that you fear God, because you have not withheld from me your son.\" The test was about Abraham's trust, not God's desire for the sacrifice.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 22:2", template: "Take your son, your only son, whom you love — Isaac — and go to the region of _____.", answers: ["Moriah"] },
            { reference: "Genesis 22:7", template: "'The fire and wood are here,' Isaac said, 'but where is the lamb for the burnt _____?'", answers: ["offering"] },
            { reference: "Genesis 22:8", template: "Abraham answered, 'God himself will provide the lamb for the burnt offering, my _____.'", answers: ["son"] },
            { reference: "Genesis 22:12", template: "Do not lay a hand on the boy… Now I know that you fear _____.", answers: ["God"] },
            { reference: "Genesis 22:14", template: "So Abraham called that place The LORD Will _____.", answers: ["Provide"] },
          ],
          wordBank: ["Moriah", "offering", "son", "God", "Provide", "ram", "altar", "knife", "mountain", "trust"],
        },
      },
    ],
    resolution:
      "At the last second, an angel stops Abraham's hand, and a ram caught in a thicket takes Isaac's place on the altar. Abraham names the place 'The LORD Will Provide' — a promise proven true at the exact moment it mattered most.",
    nextHook:
      "Isaac grows up, marries, and has twin sons of his own — one of whom will spend a whole night wrestling with God before he gets a new name. Next: Jacob Wrestles with God.",
    estimatedMinutes: 8,
  },
  {
    id: "jacob-wrestles-with-god",
    title: "Jacob Wrestles with God",
    track: "scripture",
    chronologicalOrder: 240,
    scriptureReference: "Genesis 32:22-32",
    lessonBook: "Genesis",
    imageUrl: "/events/jacob-wrestles-with-god.webp",
    summary:
      "Alone at night, on the eve of facing the brother he once cheated, Jacob wrestles with a stranger until daybreak — and won't let go until he's blessed. He walks away limping, and with a new name.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're about to face someone you deeply wronged years ago, with no idea how they'll react. The night before, you find yourself wrestling — literally or otherwise — until dawn. What are you actually fighting for?",
        placeholder: "Write what you're wrestling for…",
        context:
          "Genesis 32:24 simply says \"a man wrestled with him till daybreak\" — Jacob doesn't know at first who he's fighting.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does Jacob's name get changed to, and why?",
        options: ["Israel, because he 'struggled with God and with humans and overcome'", "Abram, to match his grandfather", "Edom, after the land he's approaching", "It isn't changed — only his hip is injured"],
        correctIndex: 0,
        context:
          "Genesis 32:28 — \"Your name will no longer be Jacob, but Israel, because you have struggled with God and with humans and have overcome.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Jacob walks away limping — he wins the blessing, but he doesn't walk away unmarked. Why might a blessing come with a limp attached?",
        context:
          "The limp (Genesis 32:31) becomes a permanent, physical reminder of the encounter — carried forward, not left behind, even after the blessing is given.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 32:24", template: "So Jacob was left alone, and a man wrestled with him till _____.", answers: ["daybreak"] },
            { reference: "Genesis 32:26", template: "the man said, 'Let me go, for it is daybreak.' But Jacob replied, 'I will not let you go unless you _____ me.'", answers: ["bless"] },
            { reference: "Genesis 32:27", template: "The man asked him, 'What is your _____?' 'Jacob,' he answered.", answers: ["name"] },
            { reference: "Genesis 32:28", template: "Your name will no longer be Jacob, but _____.", answers: ["Israel"] },
            { reference: "Genesis 32:30", template: "So Jacob called the place Peniel, saying, 'It is because I saw God face to face, and yet my life was _____.'", answers: ["spared"] },
          ],
          wordBank: ["daybreak", "bless", "name", "Israel", "spared", "wrestled", "limp", "hip", "struggle", "overcome"],
        },
      },
    ],
    resolution:
      "As dawn breaks, Jacob refuses to let go without a blessing — and gets one, along with a new name, Israel, and a permanent limp from where his hip is touched. He calls the place Peniel: 'I saw God face to face, and yet my life was spared.'",
    nextHook:
      "Jacob's twelve sons will carry that new name forward — but first, jealousy among brothers is about to nearly destroy one of them. Next: Joseph Sold by His Brothers.",
    estimatedMinutes: 8,
  },
  {
    id: "joseph-sold-by-brothers",
    title: "Joseph Sold by His Brothers",
    track: "scripture",
    chronologicalOrder: 250,
    scriptureReference: "Genesis 37:12-36",
    lessonBook: "Genesis",
    imageUrl: "/events/joseph-sold-by-brothers.webp",
    summary:
      "Joseph's brothers hate him for their father's favoritism and his own dreams of ruling over them — enough to sell him into slavery and tell their father he's dead. Joseph disappears into Egypt with nothing but the coat that's no longer his.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "Your brothers just sold you to traders and are about to lie to your father's face about it. You have a long walk to Egypt ahead, in chains, as a slave. What's the one thought you keep coming back to?",
        placeholder: "Write what you'd be thinking…",
        context:
          "Genesis 37:28 states it plainly: \"they sold Joseph to the Ishmaelites for twenty shekels of silver, and they took him to Egypt.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What do Joseph's brothers do with his richly ornamented coat?",
        options: ["Burn it", "Dip it in goat's blood and take it to their father", "Keep it as a trophy", "Sell it along with Joseph"],
        correctIndex: 1,
        context:
          "Genesis 37:31-32 — they dip the robe in goat's blood and bring it to Jacob, letting him conclude Joseph was torn apart by a wild animal.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Joseph did nothing in this scene to deserve what happens to him — it's pure injustice, dressed up as his brothers' problem with him. How do you sit with the fact that bad things sometimes happen to someone simply because of other people's jealousy?",
        context:
          "The rest of Joseph's story (Genesis 50:20) eventually answers this from the far side: \"You intended to harm me, but God intended it for good.\" That answer isn't available yet at this point in the story — worth sitting with the injustice on its own first.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 37:20", template: "Come now, let's kill him… Then we'll see what comes of his _____.", answers: ["dreams"] },
            { reference: "Genesis 37:24", template: "They took him and threw him into the cistern. The cistern was empty; there was no _____ in it.", answers: ["water"] },
            { reference: "Genesis 37:28", template: "they sold Joseph to the Ishmaelites for twenty shekels of _____.", answers: ["silver"] },
            { reference: "Genesis 37:33", template: "He recognized it and said, 'It is my son's robe! Some ferocious animal has devoured _____.'", answers: ["him"] },
            { reference: "Genesis 37:34", template: "Then Jacob tore his clothes, put on sackcloth and mourned for his son many _____.", answers: ["days"] },
          ],
          wordBank: ["dreams", "water", "silver", "him", "days", "cistern", "coat", "brothers", "Egypt", "slave"],
        },
      },
    ],
    resolution:
      "Joseph's brothers sell him to traders bound for Egypt and let their father believe he's dead. Jacob mourns for a son he thinks is gone, while Joseph — alive, enslaved, and far from home — disappears into Egypt.",
    nextHook:
      "Years pass, and Joseph rises from slavery to the second most powerful man in Egypt — setting up a reunion with the very brothers who sold him. Next: Joseph Forgives His Brothers.",
    estimatedMinutes: 8,
  },
  {
    id: "joseph-forgives-his-brothers",
    title: "Joseph Forgives His Brothers",
    track: "scripture",
    chronologicalOrder: 260,
    scriptureReference: "Genesis 45:1-15",
    lessonBook: "Genesis",
    imageUrl: "/events/joseph-forgives-his-brothers.webp",
    summary:
      "Decades later, famine drives Joseph's brothers to Egypt for grain — straight to the brother they sold, now second-in-command and unrecognizable. Joseph could destroy them. Instead, he weeps, and forgives.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "The people who sold you into slavery and lied about it for years are standing in front of you, powerless, needing something only you can give. You have every right to make them pay. What do you actually want to do?",
        placeholder: "Write what you'd want to do…",
        context:
          "Genesis 45:2 says Joseph \"wept so loudly that the Egyptians heard him\" — before he even reveals who he is, the emotion is already overwhelming him.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "How does Joseph explain what happened to him, once he reveals his identity?",
        options: ["He blames his brothers directly and demands an apology", "He says God sent him ahead to save lives during the famine", "He says it doesn't matter anymore", "He refuses to discuss it"],
        correctIndex: 1,
        context:
          "Genesis 45:5,7-8 — \"do not be grieved or angry with yourselves… God sent me ahead of you to preserve for you a remnant on earth.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Joseph reframes the worst thing that ever happened to him as part of how God saved many lives, including his brothers'. Is there something painful in your own life you've had to look at from a different angle to make peace with?",
        context:
          "Genesis 50:20, spoken later, is the fullest version of this: \"You intended to harm me, but God intended it for good, to accomplish what is now being done, the saving of many lives.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Genesis 45:3", template: "Joseph said to his brothers, 'I am Joseph! Is my father still _____?'", answers: ["living"] },
            { reference: "Genesis 45:4", template: "'I am your brother Joseph, the one you sold into _____.'", answers: ["Egypt"] },
            { reference: "Genesis 45:5", template: "do not be grieved or angry with yourselves for selling me here, because it was to save _____ that God sent me ahead of you.", answers: ["lives"] },
            { reference: "Genesis 45:8", template: "So then, it was not you who sent me here, but _____.", answers: ["God"] },
            { reference: "Genesis 45:15", template: "he kissed all his brothers and wept over them. Afterward his brothers talked with _____.", answers: ["him"] },
          ],
          wordBank: ["living", "Egypt", "lives", "God", "him", "weep", "forgive", "famine", "brothers", "reunion"],
        },
      },
    ],
    resolution:
      "Joseph reveals himself, forgives his brothers completely, and brings the whole family to Egypt to survive the famine — reuniting with his father Jacob, who believed he was dead for over twenty years.",
    nextHook:
      "Generations later, Jacob's family — now enslaved in the very country that once saved them — will need a rescuer of their own. Next: Moses and the Burning Bush.",
    estimatedMinutes: 8,
  },
  {
    id: "moses-burning-bush",
    title: "Moses and the Burning Bush",
    track: "scripture",
    chronologicalOrder: 270,
    scriptureReference: "Exodus 3:1-15",
    lessonBook: "Exodus",
    imageUrl: "/events/moses-burning-bush.webp",
    summary:
      "A bush burns without burning up, and a voice from inside it calls Moses by name — then asks him to go back to the country he fled and confront the most powerful man in the world. Moses' first response is every excuse he can think of.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "God tells you to go back to the place you ran from, to confront the person you're most afraid of, and lead people who don't even know your name. What's your honest first response?",
        placeholder: "Write your honest first response…",
        context:
          "Moses' actual first response (Exodus 3:11) is: \"Who am I, that I should go to Pharaoh?\" — the very first thing out of his mouth is doubt about himself, not about God.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What name does God give Moses when Moses asks who sent him?",
        options: ["The Lord of Hosts", "I AM WHO I AM", "The God of Miracles", "The Most High"],
        correctIndex: 1,
        context:
          "Exodus 3:14 — \"God said to Moses, 'I AM WHO I AM. This is what you are to say to the Israelites: I AM has sent me to you.'\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Moses gives God excuse after excuse and God answers every single one — not by removing the difficulty, but by promising 'I will be with you.' What excuse do you find yourself giving God most often?",
        context:
          "Exodus 3:12 — God's answer to Moses' first objection isn't proof of ability, it's a promise of presence: \"I will be with you.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Exodus 3:2", template: "There the angel of the LORD appeared to him in flames of fire from within a _____.", answers: ["bush"] },
            { reference: "Exodus 3:5", template: "Do not come any closer… Take off your sandals, for the place where you are standing is holy _____.", answers: ["ground"] },
            { reference: "Exodus 3:10", template: "So now, go. I am sending you to Pharaoh to bring my people the Israelites out of _____.", answers: ["Egypt"] },
            { reference: "Exodus 3:12", template: "And God said, 'I will be with _____.'", answers: ["you"] },
            { reference: "Exodus 3:14", template: "God said to Moses, 'I AM WHO I _____.'", answers: ["AM"] },
          ],
          wordBank: ["bush", "ground", "Egypt", "you", "AM", "fire", "sandals", "Pharaoh", "holy", "voice"],
        },
      },
    ],
    resolution:
      "Moses runs out of excuses, and God answers every one — not by making the mission easier, but by promising His own presence through it. Moses heads back to Egypt to say four words to Pharaoh: 'Let my people go.'",
    nextHook:
      "Pharaoh refuses, again and again, until the sea itself becomes the only way out. Next: Moses Parts the Red Sea.",
    estimatedMinutes: 8,
  },
  {
    id: "day-03-the-shepherd",
    title: "Moses Parts the Red Sea",
    track: "scripture",
    chronologicalOrder: 300,
    scriptureReference: "Exodus 14:1-31",
    lessonBook: "Exodus",
    imageUrl: "/events/moses-red-sea.webp",
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
      "Free on the far shore, Israel travels to a mountain in the desert, where God gives His rescued people ten instructions for how to actually live free. Next: The Ten Commandments.",
    estimatedMinutes: 7,
  },
  {
    id: "ten-commandments",
    title: "The Ten Commandments",
    track: "scripture",
    chronologicalOrder: 310,
    scriptureReference: "Exodus 20:1-17",
    lessonBook: "Exodus",
    imageUrl: "/events/ten-commandments.webp",
    summary:
      "Three months after leaving Egypt, God gives His freed people ten instructions on Mount Sinai — not a cage, but a design for how a rescued people can actually live free, with God and with each other.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You've just been freed from slavery, and instead of a blank check to do whatever you want, you're handed ten rules. What's your gut reaction — restriction, or relief?",
        placeholder: "Write your gut reaction…",
        context:
          "The commandments open with the reason they're given at all (Exodus 20:2): \"I am the LORD your God, who brought you out of Egypt, out of the land of slavery.\" Rescue comes first, rules second.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "Which of these is one of the Ten Commandments?",
        options: ["You shall not covet", "You shall not doubt", "You shall not question", "You shall not rest"],
        correctIndex: 0,
        context:
          "Exodus 20:17 — \"You shall not covet your neighbor's house… or anything that belongs to your neighbor.\" The last commandment, and the only one about an internal desire rather than an outward act.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The first four commandments are about loving God; the last six are about loving other people. Why might a rescued people need both halves, not just one?",
        context:
          "Jesus later summarizes the whole law this same way (Matthew 22:37-39): love God fully, and love your neighbor as yourself — the same two halves, boiled down to one sentence.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Exodus 20:2", template: "I am the LORD your God, who brought you out of Egypt, out of the land of _____.", answers: ["slavery"] },
            { reference: "Exodus 20:3", template: "You shall have no other gods before _____.", answers: ["me"] },
            { reference: "Exodus 20:8", template: "Remember the Sabbath day by keeping it _____.", answers: ["holy"] },
            { reference: "Exodus 20:12", template: "Honor your father and your mother, so that you may live long in the land the LORD your God is giving _____.", answers: ["you"] },
            { reference: "Exodus 20:17", template: "You shall not _____ your neighbor's house.", answers: ["covet"] },
          ],
          wordBank: ["slavery", "me", "holy", "you", "covet", "Sabbath", "honor", "steal", "murder", "Sinai"],
        },
      },
    ],
    resolution:
      "God gives Israel ten commandments on Mount Sinai — the first four about loving God, the last six about loving neighbor — as the shape of a free life, not a return to slavery under a different master.",
    nextHook:
      "Israel leaves Sinai for a promised land already occupied — and the first city standing in the way has walls nobody expects to fall by marching. Next: The Battle of Jericho.",
    estimatedMinutes: 8,
  },
  {
    id: "joshua-and-jericho",
    title: "The Battle of Jericho",
    track: "scripture",
    chronologicalOrder: 320,
    scriptureReference: "Joshua 6:1-20",
    lessonBook: "Joshua",
    imageUrl: "/events/joshua-and-jericho.webp",
    summary:
      "God commands Israel to march around the walled city of Jericho once a day for six days, seven times on the seventh, then blow trumpets and shout — no siege engines, no battering ram, just obedience shaped like a parade.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're one of Joshua's soldiers, marching in silence around a walled city for the sixth straight day, carrying no weapon but a trumpet. Nothing has happened yet. What's going through your mind?",
        placeholder: "Write what you'd be thinking…",
        context:
          "Joshua 6:10 — Joshua commanded the army \"not to give a war cry, not to raise your voices, not to say a word until the day I tell you to shout. Then, shout!\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What finally brought Jericho's walls down?",
        options: ["A battering ram", "A trumpet blast and a shout", "A surprise night attack", "A siege that starved the city"],
        correctIndex: 1,
        context:
          "Joshua 6:20 — \"the wall collapsed; so everyone charged straight in, and they took the city.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Israel's part in the miracle was walking in a circle and yelling — nothing that would actually knock down a wall by itself. Why do you think God asked for obedience that, on its own, looked useless?",
        context:
          "Hebrews 11:30 later names this a matter of faith, not strategy: \"By faith the walls of Jericho fell, after the army had marched around them for seven days.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Joshua 6:2", template: "See, I have delivered Jericho into your _____.", answers: ["hands"] },
            { reference: "Joshua 6:5", template: "the wall of the city will _____ and the people will go up, everyone straight in.", answers: ["collapse"] },
            { reference: "Joshua 6:10", template: "do not say a _____ until the day I tell you to shout. Then, shout!", answers: ["word"] },
            { reference: "Joshua 6:16", template: "Joshua said to the people, 'Shout! For the LORD has given you the _____!'", answers: ["city"] },
            { reference: "Joshua 6:27", template: "the LORD was with Joshua, and his fame spread throughout the _____.", answers: ["land"] },
          ],
          wordBank: ["hands", "collapse", "word", "city", "land", "wall", "shout", "trumpet", "silence", "gate"],
        },
      },
    ],
    resolution:
      "For six days, Israel marches around Jericho in silence. On the seventh, seven priests blow trumpets, the people shout, and the walls collapse outward — the city falls to obedience, not to any weapon Israel carried.",
    nextHook:
      "Jericho falls to a shout — but the next fight won't be won by trumpets at all. It'll take three hundred men, torches hidden in jars, and a leader almost too afraid to lead. Next: Gideon and the Three Hundred.",
    estimatedMinutes: 7,
  },
  {
    id: "gideon-and-the-three-hundred",
    title: "Gideon and the Three Hundred",
    track: "scripture",
    chronologicalOrder: 330,
    scriptureReference: "Judges 7:1-22",
    lessonBook: "Judges",
    imageUrl: "/events/gideon-and-the-three-hundred.webp",
    summary:
      "God keeps shrinking Gideon's army — from thirty-two thousand down to three hundred — before sending them into battle with nothing but torches, jars, and trumpets, so that when the victory comes, no one can say they won it themselves.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "God has just cut your army from thirty-two thousand men down to three hundred, right before the biggest fight of your life. You're Gideon. What do you pray that night?",
        placeholder: "Write your prayer…",
        context:
          "Judges 7:2 — \"the LORD said to Gideon, 'You have too many men for me to deliver Midian into their hands. In order that Israel may not boast against me that her own strength has saved her…'\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What weapons did Gideon's three hundred men actually carry into battle?",
        options: ["Swords and shields", "Bows and arrows", "Trumpets, torches, and empty jars", "Nothing at all"],
        correctIndex: 2,
        context:
          "Judges 7:16 — Gideon \"put trumpets and empty jars into the hands of all of them, with torches inside the jars.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "God shrinks the army specifically so Israel can't take credit for the win. Is there a place in your own life where a smaller, harder path might actually be the more honest one?",
        context:
          "Judges 7:2, in full — the whole strategy exists so that \"Israel may not boast against me, 'My own strength has saved me.'\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Judges 7:2", template: "so that Israel may not boast against me, 'My own strength has saved _____.'", answers: ["me"] },
            { reference: "Judges 7:7", template: "I will save you and give the Midianites into your _____. All the other men, let them go home.", answers: ["hands"] },
            { reference: "Judges 7:16", template: "He put trumpets and empty jars into the hands of all of them, with _____ inside the jars.", answers: ["torches"] },
            { reference: "Judges 7:18", template: "shout: 'For the LORD and for _____!'", answers: ["Gideon"] },
            { reference: "Judges 7:21", template: "every man held his position around the camp, and all the Midianites ran, crying out as they _____.", answers: ["fled"] },
          ],
          wordBank: ["me", "hands", "torches", "Gideon", "fled", "trumpets", "shout", "jars", "army", "sword"],
        },
      },
    ],
    resolution:
      "With just three hundred men, torches hidden inside jars, and a shout, Gideon's tiny force routs the entire Midianite army in one night — proof, exactly as God intended, that the win was never about the size of the army.",
    nextHook:
      "A judge who needed convincing gives way to another kind of story — one about staying faithful in someone else's grief, when leaving would have been so much easier. Next: Ruth's Loyalty.",
    estimatedMinutes: 7,
  },
  {
    id: "ruth-and-naomi",
    title: "Ruth's Loyalty",
    track: "scripture",
    chronologicalOrder: 340,
    scriptureReference: "Ruth 1:1-18",
    lessonBook: "Ruth",
    imageUrl: "/events/ruth-and-naomi.webp",
    summary:
      "Widowed, foreign, and free to go back to her own people, Ruth instead makes an oath to stay with her equally widowed mother-in-law Naomi — one of the most quoted vows of loyalty in Scripture, made to someone with nothing left to offer her.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're Naomi, urging your widowed daughters-in-law to go back to their own families and start over — it's the practical, sensible thing for them to do. One agrees. Ruth won't leave. What do you say to her?",
        placeholder: "Write what you'd say…",
        context:
          "Ruth 1:8 — Naomi tells them, \"Go back, each of you, to your mother's home. May the LORD show you kindness, as you have shown kindness to your dead husbands and to me.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does Ruth say when she refuses to leave Naomi?",
        options: [
          "\"Where you go I will go, and where you stay I will stay\"",
          "\"I will go only if you provide for me\"",
          "\"I have nowhere else to go\"",
          "She says nothing and simply follows",
        ],
        correctIndex: 0,
        context:
          "Ruth 1:16-17 — Ruth's full vow: \"Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Ruth had every practical reason to leave — she was young, foreign, and free to remarry among her own people. What do you think made her stay anyway?",
        context:
          "Ruth later becomes King David's great-grandmother (Ruth 4:17) and appears in Jesus' genealogy (Matthew 1:5) — her loyalty to Naomi ends up woven into the story of the Messiah.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Ruth 1:16", template: "Where you go I will go, and where you stay I will _____.", answers: ["stay"] },
            { reference: "Ruth 1:16", template: "Your people will be my people and your _____ my God.", answers: ["God"] },
            { reference: "Ruth 1:17", template: "Where you die I will die, and there I will be _____.", answers: ["buried"] },
            { reference: "Ruth 1:17", template: "May the LORD deal with me, be it ever so severely, if even death separates you and _____.", answers: ["me"] },
            { reference: "Ruth 1:18", template: "When Naomi realized that Ruth was determined to go with her, she stopped _____ her.", answers: ["urging"] },
          ],
          wordBank: ["stay", "God", "buried", "me", "urging", "people", "home", "widow", "Moab", "kindness"],
        },
      },
    ],
    resolution:
      "Ruth refuses to leave, binding herself to Naomi, to Naomi's people, and to Naomi's God with a vow she keeps. A foreigner with nothing to gain becomes, generations later, the great-grandmother of King David.",
    nextHook:
      "Ruth's steady loyalty in a quiet field sets up a much noisier calling — a boy asleep in a temple, hearing his name in the dark, not yet sure whose voice it is. Next: The Lord Calls Samuel.",
    estimatedMinutes: 7,
  },
  {
    id: "the-lord-calls-samuel",
    title: "The Lord Calls Samuel",
    track: "scripture",
    chronologicalOrder: 350,
    scriptureReference: "1 Samuel 3:1-21",
    lessonBook: "1 Samuel",
    imageUrl: "/events/the-lord-calls-samuel.webp",
    summary:
      "In the dark of the temple, a boy hears his name called three times and runs to Eli each time, thinking it's him — until Eli realizes it's the LORD calling, and tells Samuel exactly how to answer.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're a boy sleeping in the temple, and a voice calls your name in the dark for the third time tonight. Twice you ran to the old priest, sure it was him. Now he's told you it's God. What do you feel, waiting for the voice to call again?",
        placeholder: "Write what you'd feel…",
        context:
          "1 Samuel 3:7 — \"Samuel did not yet know the LORD: The word of the LORD had not yet been revealed to him.\" This was new to him, not routine.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did Eli tell Samuel to say the next time the voice called?",
        options: ["\"Who is speaking?\"", "\"Speak, LORD, for your servant is listening\"", "\"I am too young for this\"", "\"Send someone else\""],
        correctIndex: 1,
        context:
          "1 Samuel 3:9 — Eli's exact instruction: \"if he calls you, say, 'Speak, LORD, for your servant is listening.'\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The message God actually gives Samuel that night is a hard one — bad news for Eli's own household. What do you think it takes to deliver a hard word faithfully, the way Samuel does the next morning?",
        context:
          "1 Samuel 3:18 — Samuel \"told him everything, hiding nothing from him\" when Eli asked, and Eli's response was simply, \"He is the LORD; let him do what is good in his eyes.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "1 Samuel 3:4", template: "the LORD called Samuel, and he said, 'Here I _____.'", answers: ["am"] },
            { reference: "1 Samuel 3:9", template: "Speak, LORD, for your servant is _____.", answers: ["listening"] },
            { reference: "1 Samuel 3:10", template: "The LORD came and stood there, calling as at the other times, '_____! Samuel!'", answers: ["Samuel"] },
            { reference: "1 Samuel 3:19", template: "The LORD was with him and let none of his words fall to the _____.", answers: ["ground"] },
            { reference: "1 Samuel 3:20", template: "all Israel… recognized that Samuel was attested as a _____ of the LORD.", answers: ["prophet"] },
          ],
          wordBank: ["am", "listening", "Samuel", "ground", "prophet", "voice", "temple", "Eli", "servant", "night"],
        },
      },
    ],
    resolution:
      "Samuel answers the way Eli taught him — 'Speak, LORD, for your servant is listening' — and from that night on, none of his words fall to the ground. A boy who didn't yet know the LORD becomes one of Israel's most trusted prophets.",
    nextHook:
      "Samuel grows into the prophet who anoints Israel's first king, then its greatest — a shepherd boy who'll one day stand in a valley across from a giant nobody else will face. Next: David and Goliath.",
    estimatedMinutes: 6,
  },
  {
    id: "day-08-fillblank-john-3-16",
    title: "David and Goliath",
    track: "scripture",
    chronologicalOrder: 400,
    scriptureReference: "1 Samuel 17:1-50",
    lessonBook: "1 Samuel",
    imageUrl: "/events/david-goliath.webp",
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
      "David's own story doesn't stay this simple — a king's life gets complicated in ways a shepherd's never does. Generations later, one of his kingdom's prophets faces down four hundred fifty rivals with nothing but a single prayer. Next: Elijah and the Prophets of Baal.",
    estimatedMinutes: 8,
  },
  {
    id: "elijah-and-the-prophets-of-baal",
    title: "Elijah and the Prophets of Baal",
    track: "scripture",
    chronologicalOrder: 420,
    scriptureReference: "1 Kings 18:20-39",
    lessonBook: "1 Kings",
    imageUrl: "/events/elijah-and-the-prophets-of-baal.webp",
    summary:
      "One prophet of the LORD against four hundred fifty prophets of Baal, on a mountain, with two altars and no matches — whichever god answers by fire is God. Baal never answers. The LORD does.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're standing on Mount Carmel, watching four hundred fifty prophets shout and cut themselves for hours, begging their god to light a soaked altar on fire. Nothing happens. Then one man — outnumbered, alone — steps up and simply prays. What are you thinking as he starts?",
        placeholder: "Write what you'd be thinking…",
        context:
          "1 Kings 18:27 — Elijah taunts Baal's prophets: \"Shout louder! Surely he is a god! Perhaps he is deep in thought, or busy, or traveling. Maybe he is sleeping and must be awakened.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did Elijah do to the altar before praying, to make the miracle unmistakable?",
        options: [
          "Nothing unusual — he just prayed",
          "He soaked the wood and the offering in water, three times",
          "He built the altar out of gold",
          "He asked the king to light it first",
        ],
        correctIndex: 1,
        context:
          "1 Kings 18:33-35 — Elijah has them pour four large jars of water over the offering and wood three separate times, until it filled the trench around the altar, removing any doubt that the fire could start naturally.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Elijah doesn't just want to win — he specifically removes every possible natural explanation before he prays. Why might that kind of care matter, for the people watching and not just for Elijah himself?",
        context:
          "1 Kings 18:37 — Elijah's prayer explains the point: \"so these people will know that you, LORD, are God, and that you are turning their hearts back again.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "1 Kings 18:21", template: "How long will you waver between two opinions? If the LORD is God, follow him; but if Baal is God, follow _____.", answers: ["him"] },
            { reference: "1 Kings 18:24", template: "The god who answers by _____ — he is God.", answers: ["fire"] },
            { reference: "1 Kings 18:37", template: "Answer me, LORD, answer me, so these people will know that you, LORD, are _____.", answers: ["God"] },
            { reference: "1 Kings 18:38", template: "the fire of the LORD fell and burned up the sacrifice… and also licked up the water in the _____.", answers: ["trench"] },
            { reference: "1 Kings 18:39", template: "they fell _____ and cried, 'The LORD — he is God!'", answers: ["prostrate"] },
          ],
          wordBank: ["him", "fire", "God", "trench", "prostrate", "altar", "water", "Baal", "prophets", "mountain"],
        },
      },
    ],
    resolution:
      "Four hundred fifty prophets of Baal shout and cut themselves for hours, and nothing answers. Elijah prays once, over a soaked altar, and fire falls from heaven — so unmistakable that the watching crowd falls to the ground crying, 'The LORD — he is God!'",
    nextHook:
      "Centuries later, a different kind of showdown plays out far from any mountain — this time inside the private, complicated household of a foreign king, where staying faithful is a quieter kind of fire. Next: Daniel.",
    estimatedMinutes: 8,
  },
  {
    id: "day-04-the-word-made-flesh",
    title: "Daniel in the Lions' Den",
    track: "scripture",
    chronologicalOrder: 500,
    scriptureReference: "Daniel 6:1-23",
    lessonBook: "Daniel",
    imageUrl: "/events/daniel-lions-den.webp",
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
    imageUrl: "/events/birth-of-jesus.webp",
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
      "That baby grows up. Decades later, a wild-living prophet appears in the wilderness, calling all of Israel to get ready — because someone greater is about to arrive. Next: John the Baptist Prepares the Way.",
    estimatedMinutes: 6,
  },
  {
    id: "john-the-baptist",
    title: "John the Baptist Prepares the Way",
    track: "scripture",
    chronologicalOrder: 610,
    scriptureReference: "Matthew 3:1-12",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Decades after Jesus' birth, a wild-living prophet appears in the wilderness, calling all of Israel to repent and be baptized — and pointing, again and again, to someone greater who is about to arrive.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "A man in camel's hair, eating locusts and wild honey, is telling crowds to change their whole way of living because someone greater is coming. Do you go out to hear him — and if you do, what are you hoping he'll say?",
        placeholder: "Write what you'd hope to hear…",
        context:
          "Matthew 3:5-6 says \"People went out to him from Jerusalem and all Judea and the whole region of the Jordan\" — this wasn't a fringe event, it drew huge crowds.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does John say about the one coming after him?",
        options: ["He is not worthy to carry his sandals", "He will be his equal", "He will need John's approval", "He is still unknown even to John"],
        correctIndex: 0,
        context:
          "Matthew 3:11 — \"I baptize you with water for repentance. But after me comes one who is more powerful than I… I am not worthy to carry his sandals.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "John's whole ministry is designed to point away from himself and toward someone else. Where in your own life do you find it hardest to point away from yourself?",
        context:
          "John later says it most directly (John 3:30): \"He must become greater; I must become less.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 3:2", template: "and saying, 'Repent, for the kingdom of heaven has come _____.'", answers: ["near"] },
            { reference: "Matthew 3:3", template: "'A voice of one calling in the wilderness, \"Prepare the way for the _____.\"'", answers: ["Lord"] },
            { reference: "Matthew 3:6", template: "Confessing their sins, they were baptized by him in the River _____.", answers: ["Jordan"] },
            { reference: "Matthew 3:8", template: "Produce fruit in keeping with _____.", answers: ["repentance"] },
            { reference: "Matthew 3:11", template: "he will baptize you with the Holy Spirit and _____.", answers: ["fire"] },
          ],
          wordBank: ["near", "Lord", "Jordan", "repentance", "fire", "wilderness", "locusts", "sandals", "baptize", "crowds"],
        },
      },
    ],
    resolution:
      "John baptizes crowds in the Jordan and refuses every bit of attention for himself, pointing again and again to the one coming after him — someone he says he isn't even worthy to serve in the smallest way.",
    nextHook:
      "That someone finally arrives at the river Himself — not to be preached about, but to step into the water and be baptized like everyone else. Next: Jesus' Baptism.",
    estimatedMinutes: 7,
  },
  {
    id: "jesus-baptism",
    title: "Jesus' Baptism",
    track: "scripture",
    chronologicalOrder: 620,
    scriptureReference: "Matthew 3:13-17",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Jesus comes to John to be baptized — and John tries to stop Him, since it should be the other way around. Jesus insists, and as He comes up out of the water, heaven opens and a voice declares who He is.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're John, and the very person you've spent your whole ministry pointing to just asked you to baptize him. Everything in you says this is backwards. What do you say?",
        placeholder: "Write what you'd say…",
        context:
          "Matthew 3:14 records John's actual objection: \"I need to be baptized by you, and do you come to me?\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What happens immediately after Jesus is baptized?",
        options: ["The crowd erupts in celebration", "Heaven opens, the Spirit descends like a dove, and a voice speaks", "John immediately leaves the wilderness", "Nothing visible happens"],
        correctIndex: 1,
        context:
          "Matthew 3:16-17 — \"heaven was opened, and he saw the Spirit of God descending like a dove… a voice from heaven said, 'This is my Son, whom I love; with him I am well pleased.'\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "God's approval of Jesus comes before Jesus has done any public miracle, teaching, or ministry at all — just from stepping into the water. What does it mean that the Father's love here isn't a reward for accomplishment?",
        context:
          "This moment sets the pattern for the rest of Jesus' ministry: identity and belovedness come first, before any 'proof' is offered.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 3:14", template: "But John tried to deter him, saying, 'I need to be baptized by _____.'", answers: ["you"] },
            { reference: "Matthew 3:15", template: "Let it be so now; it is proper for us to do this to fulfill all _____.", answers: ["righteousness"] },
            { reference: "Matthew 3:16", template: "he saw the Spirit of God descending like a _____ and alighting on him.", answers: ["dove"] },
            { reference: "Matthew 3:17", template: "And a voice from heaven said, 'This is my Son, whom I _____.'", answers: ["love"] },
            { reference: "Matthew 3:17", template: "with him I am well _____.", answers: ["pleased"] },
          ],
          wordBank: ["you", "righteousness", "dove", "love", "pleased", "heaven", "water", "Spirit", "voice", "Son"],
        },
      },
    ],
    resolution:
      "John relents, baptizes Jesus, and as Jesus comes up out of the water, the sky opens: the Spirit descends like a dove, and the Father's voice names Him — beloved, and already pleasing to God — before any miracle has happened.",
    nextHook:
      "That same Spirit doesn't lead Jesus straight into ministry — it leads Him into the wilderness first, to be tested. Next: Jesus Tempted in the Wilderness.",
    estimatedMinutes: 6,
  },
  {
    id: "jesus-tempted",
    title: "Jesus Tempted in the Wilderness",
    track: "scripture",
    chronologicalOrder: 630,
    scriptureReference: "Matthew 4:1-11",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Right after His baptism, the Spirit leads Jesus into the desert to fast for forty days — and the devil shows up right when He's weakest, with three offers that all sound reasonable on the surface.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You haven't eaten in forty days, and a voice offers you an easy way to satisfy real, physical hunger, using power you actually have. What makes that offer so hard to turn down?",
        placeholder: "Write what makes it hard…",
        context:
          "Matthew 4:2-3 sets the stakes plainly: \"After fasting forty days and forty nights, he was hungry. The tempter came to him.\" The temptation targets a real, legitimate need.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "How does Jesus respond to each of the three temptations?",
        options: ["By performing a counter-miracle", "By quoting Scripture", "By calling angels to intervene", "By arguing philosophically with the devil"],
        correctIndex: 1,
        context:
          "Each time (Matthew 4:4, 4:7, 4:10), Jesus answers with 'It is written' followed by a quote from Deuteronomy — meeting temptation with Scripture, not raw willpower.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "None of the three temptations are 'obviously evil' — turning stone to bread, testing God's protection, gaining the world's kingdoms. What made them temptations anyway?",
        context:
          "Each offer proposes a shortcut around trust — meeting a real need or goal by a route that bypasses depending on the Father, which is exactly the substance of the test.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 4:1", template: "Then Jesus was led by the Spirit into the wilderness to be tempted by the _____.", answers: ["devil"] },
            { reference: "Matthew 4:4", template: "Jesus answered, 'It is written: \"Man shall not live on bread alone, but on every word that comes from the mouth of _____.\"'", answers: ["God"] },
            { reference: "Matthew 4:7", template: "Jesus answered him, 'It is also written: \"Do not put the Lord your God to the _____.\"'", answers: ["test"] },
            { reference: "Matthew 4:10", template: "Jesus said to him, 'Away from me, Satan! For it is written: \"Worship the Lord your God, and serve him _____.\"'", answers: ["only"] },
            { reference: "Matthew 4:11", template: "Then the devil left him, and angels came and attended _____.", answers: ["him"] },
          ],
          wordBank: ["devil", "God", "test", "only", "him", "bread", "stones", "worship", "angels", "wilderness"],
        },
      },
    ],
    resolution:
      "Jesus answers all three temptations with Scripture, refuses every shortcut, and the devil finally leaves — at which point angels come and attend to Him. Where the first Adam failed in a garden with everything, Jesus succeeds in a desert with nothing.",
    nextHook:
      "From the wilderness, Jesus walks straight to a shoreline and calls out to a handful of fishermen — with two words that will end their old lives on the spot. Next: Jesus Calls His First Disciples.",
    estimatedMinutes: 7,
  },
  {
    id: "jesus-calls-disciples",
    title: "Jesus Calls His First Disciples",
    track: "scripture",
    chronologicalOrder: 640,
    scriptureReference: "Matthew 4:18-22",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Walking along the Sea of Galilee, Jesus finds two sets of fishing brothers at work and says just one thing: 'Follow me.' No résumé, no interview — they drop their nets right where they stand.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're in the middle of your normal work day when a stranger says two words — 'Follow me' — and something about it makes you want to drop everything. What would it take for you to actually do it, right then?",
        placeholder: "Write what it would take…",
        context:
          "Matthew 4:20 says of Peter and Andrew: \"At once they left their nets and followed him\" — no negotiation, no 'let me think about it' is recorded.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does Jesus say He'll make Simon Peter and Andrew into?",
        options: ["Teachers of the law", "Fishers of men", "Kings of Israel", "Priests in the temple"],
        correctIndex: 1,
        context:
          "Matthew 4:19 — \"'Come, follow me,' Jesus said, 'and I will send you out to fish for people.'\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Jesus doesn't call polished religious experts — He calls working fishermen. What does that say about who gets invited into this story?",
        context:
          "This pattern holds throughout the Gospels: tax collectors, fishermen, and other ordinary people are called before religious professionals are.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 4:18", template: "he saw two brothers, Simon called Peter and his brother Andrew. They were casting a net into the lake, for they were _____.", answers: ["fishermen"] },
            { reference: "Matthew 4:19", template: "'Come, follow me,' Jesus said, 'and I will send you out to fish for _____.'", answers: ["people"] },
            { reference: "Matthew 4:20", template: "At once they left their nets and _____ him.", answers: ["followed"] },
            { reference: "Matthew 4:21", template: "he saw two other brothers, James son of Zebedee and his brother John. They were in a boat with their father Zebedee, preparing their _____.", answers: ["nets"] },
            { reference: "Matthew 4:22", template: "immediately they left the boat and their father and followed _____.", answers: ["him"] },
          ],
          wordBank: ["fishermen", "people", "followed", "nets", "him", "boat", "Galilee", "brothers", "Peter", "Zebedee"],
        },
      },
    ],
    resolution:
      "Peter, Andrew, James, and John all leave their nets — and in James and John's case, their own father in the boat — the moment Jesus calls them. Four fishermen become the first of twelve disciples.",
    nextHook:
      "That small band of followers is about to hear the strangest, most upside-down set of teachings they've ever encountered — starting on a hillside. Next: The Sermon on the Mount.",
    estimatedMinutes: 6,
  },
  {
    id: "sermon-on-the-mount",
    title: "The Sermon on the Mount",
    track: "scripture",
    chronologicalOrder: 650,
    scriptureReference: "Matthew 5:1-12",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Jesus sits down on a hillside and opens His most famous teaching with a list of who's actually blessed — and it's not the powerful or the comfortable. It's the poor in spirit, the mourning, the meek, the persecuted.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "Jesus says the people who are blessed are the poor in spirit, those who mourn, and the persecuted — not the confident, comfortable, or successful. Which of those categories is hardest for you to believe is actually blessed?",
        placeholder: "Write which one, and why…",
        context:
          "Matthew 5:3-10 lists eight 'blessed are' statements — none of them describe strength, wealth, or comfort as the world usually defines blessing.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "According to the Beatitudes, who will 'inherit the earth'?",
        options: ["The powerful", "The meek", "The wealthy", "The wise"],
        correctIndex: 1,
        context:
          "Matthew 5:5 — \"Blessed are the meek, for they will inherit the earth.\" A direct echo of Psalm 37:11.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The Beatitudes describe a kind of blessing that has nothing to do with circumstances going well. What's one situation in your life where you're struggling to see any blessing at all right now?",
        context:
          "The Beatitudes don't promise the hard circumstances will disappear — they promise something is true and good even inside them, which is a different kind of hope.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 5:3", template: "Blessed are the poor in spirit, for theirs is the kingdom of _____.", answers: ["heaven"] },
            { reference: "Matthew 5:4", template: "Blessed are those who mourn, for they will be _____.", answers: ["comforted"] },
            { reference: "Matthew 5:5", template: "Blessed are the meek, for they will inherit the _____.", answers: ["earth"] },
            { reference: "Matthew 5:6", template: "Blessed are those who hunger and thirst for righteousness, for they will be _____.", answers: ["filled"] },
            { reference: "Matthew 5:9", template: "Blessed are the peacemakers, for they will be called children of _____.", answers: ["God"] },
          ],
          wordBank: ["heaven", "comforted", "earth", "filled", "God", "meek", "mourn", "peacemakers", "blessed", "kingdom"],
        },
      },
    ],
    resolution:
      "Jesus opens His most famous sermon by turning the world's idea of blessing upside down — pronouncing the poor in spirit, the mourning, the meek, and the persecuted blessed, not despite their condition but somehow within it.",
    nextHook:
      "Later in that same sermon, Jesus teaches His followers exactly how to pray — a prayer so simple it's still prayed by name today. Next: Jesus Teaches the Lord's Prayer.",
    estimatedMinutes: 7,
  },
  {
    id: "lords-prayer-teaching",
    title: "Jesus Teaches the Lord's Prayer",
    track: "scripture",
    chronologicalOrder: 660,
    scriptureReference: "Matthew 6:9-13",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "When His disciples want to know how to pray, Jesus doesn't give them a formula to perform — He gives them a short, plain pattern that starts with 'Our Father' and asks for daily bread, forgiveness, and protection.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "Jesus tells you not to pray with lots of words to be seen by others, but simply, like a child talking to a father. If you stripped your own prayers down to that kind of simplicity, what would you actually say?",
        placeholder: "Write what you'd actually say…",
        context:
          "Matthew 6:7-8 — \"do not keep on babbling like pagans, for they think they will be heard because of their many words… your Father knows what you need before you ask him.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does the Lord's Prayer ask God to do about debts/sins?",
        options: ["Forgive us as we forgive our debtors", "Erase all record of them permanently", "Punish those who wronged us", "Explain why they happened"],
        correctIndex: 0,
        context:
          "Matthew 6:12 — \"And forgive us our debts, as we also have forgiven our debtors.\" Receiving forgiveness and extending it are tied together in the very structure of the prayer.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The prayer asks for 'daily' bread, not a lifetime supply all at once. What might it mean to trust God one day at a time instead of trying to secure your whole future in advance?",
        context:
          "This echoes the manna in the wilderness (Exodus 16), which couldn't be hoarded — it had to be gathered fresh, daily, trusting it would be there again tomorrow.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 6:9", template: "This, then, is how you should pray: 'Our Father in heaven, hallowed be your _____.'", answers: ["name"] },
            { reference: "Matthew 6:10", template: "your kingdom come, your will be done, on earth as it is in _____.", answers: ["heaven"] },
            { reference: "Matthew 6:11", template: "Give us today our daily _____.", answers: ["bread"] },
            { reference: "Matthew 6:12", template: "And forgive us our debts, as we also have forgiven our _____.", answers: ["debtors"] },
            { reference: "Matthew 6:13", template: "And lead us not into temptation, but deliver us from the evil _____.", answers: ["one"] },
          ],
          wordBank: ["name", "heaven", "bread", "debtors", "one", "kingdom", "forgive", "daily", "pray", "Father"],
        },
      },
    ],
    resolution:
      "Jesus hands His disciples a short, plain prayer — praise, provision, forgiveness, protection — meant to be prayed honestly, not performed. It's still the most repeated prayer in the world today.",
    nextHook:
      "Not long after teaching them how to talk to God, Jesus shows them what He can actually do — starting with a man who can't even get through a crowded doorway on his own. Next: Jesus Heals a Paralyzed Man.",
    estimatedMinutes: 6,
  },
  {
    id: "heals-paralyzed-man",
    title: "Jesus Heals a Paralyzed Man",
    track: "scripture",
    chronologicalOrder: 670,
    scriptureReference: "Mark 2:1-12",
    lessonBook: "Mark",
    imageUrl: null,
    summary:
      "Four friends carry a paralyzed man to Jesus, but the house is too crowded to get through the door — so they cut a hole in the roof and lower him down. Jesus forgives his sins before He heals his legs, and the religious leaders bristle.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "Your friend can't walk, and the only way to get him to Jesus is to tear a hole in someone's roof and lower him down through it, in front of everyone. Would you go that far for someone you love — and why?",
        placeholder: "Write what you'd do…",
        context:
          "Mark 2:4 — \"Since they could not get him to Jesus because of the crowd, they made an opening in the roof above Jesus by digging through it.\" Extreme effort, for someone else's healing.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does Jesus say to the man before healing his legs?",
        options: ["\"Stand up and walk\"", "\"Son, your sins are forgiven\"", "\"Do you believe I can heal you?\"", "\"Your friends have great faith\""],
        correctIndex: 1,
        context:
          "Mark 2:5 — \"When Jesus saw their faith, he said to the paralyzed man, 'Son, your sins are forgiven.'\" The healing of the body comes second, after the deeper word.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Jesus deals with the man's sin before his paralysis — even though the paralysis is what everyone can see and what the man presumably came for. Why might the deeper problem matter more, even when it's invisible?",
        context:
          "The religious leaders in the room think only God can forgive sins (Mark 2:7) — Jesus then heals the visible paralysis specifically to prove He has authority over the invisible problem too (Mark 2:10-11).",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Mark 2:4", template: "they made an opening in the roof above Jesus by digging through it and then lowered the mat the man was lying _____.", answers: ["on"] },
            { reference: "Mark 2:5", template: "When Jesus saw their faith, he said to the man, 'Son, your sins are _____.'", answers: ["forgiven"] },
            { reference: "Mark 2:9", template: "Which is easier: to say to this paralyzed man, 'Your sins are forgiven,' or to say, 'Get up, take your mat and _____'?", answers: ["walk"] },
            { reference: "Mark 2:11", template: "'I tell you, get up, take your mat and go _____.'", answers: ["home"] },
            { reference: "Mark 2:12", template: "he got up, took his mat and walked out in full view of them all. This amazed everyone and they praised _____.", answers: ["God"] },
          ],
          wordBank: ["on", "forgiven", "walk", "home", "God", "mat", "roof", "crowd", "faith", "amazed"],
        },
      },
    ],
    resolution:
      "Jesus forgives the man's sins, then heals his legs to prove He had the authority to do both — and the man walks out in front of everyone, carrying the mat he was carried in on.",
    nextHook:
      "That same authority is about to show up somewhere much more frightening: a boat, at night, in the middle of a storm His own disciples are sure will kill them. Next: Jesus Calms the Storm.",
    estimatedMinutes: 7,
  },
  {
    id: "day-09-fillblank-philippians-4-13",
    title: "Jesus Calms the Storm",
    track: "scripture",
    chronologicalOrder: 700,
    scriptureReference: "Mark 4:35-41",
    lessonBook: "Mark",
    imageUrl: "/events/calms-the-storm.webp",
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
      "Not long after, that same power to provide out of nothing shows up on land — when a crowd of thousands turns out to be more than a few loaves and fish should ever be able to feed. Next: Feeding the Five Thousand.",
    estimatedMinutes: 6,
  },
  {
    id: "feeding-five-thousand",
    title: "Feeding the Five Thousand",
    track: "scripture",
    chronologicalOrder: 710,
    scriptureReference: "John 6:1-14",
    lessonBook: "John",
    imageUrl: null,
    summary:
      "A crowd of thousands follows Jesus into a remote place with no food and no plan for dinner. A boy offers five loaves and two small fish — barely a snack for one — and Jesus turns it into more than enough for everyone.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're a kid with a small lunch, surrounded by thousands of hungry people, and someone asks if you'll give it up to help feed the crowd — even though it obviously won't be enough. Do you hand it over anyway?",
        placeholder: "Write what you'd do…",
        context:
          "John 6:9 gives the detail: \"Here is a boy with five small barley loaves and two small fish, but how far will they go among so many?\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "How much food is left over after everyone eats their fill?",
        options: ["Nothing — it was exactly enough", "Twelve basketfuls", "A few crumbs", "Enough for one more meal only"],
        correctIndex: 1,
        context:
          "John 6:12-13 — \"When they had all had enough to eat, he said to his disciples, 'Gather the pieces that are left over.'… they filled twelve baskets.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Jesus doesn't multiply an empty basket — He multiplies what a kid was actually willing to hand over. What's something small you have that you're hesitant to offer because it doesn't seem like enough?",
        context:
          "The miracle starts with a real, freely given offering, small as it is — not with Jesus creating food from nothing on His own, unprompted.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "John 6:5", template: "he asked Philip, 'Where shall we buy bread for these people to _____?'", answers: ["eat"] },
            { reference: "John 6:9", template: "Here is a boy with five small barley loaves and two small _____.", answers: ["fish"] },
            { reference: "John 6:11", template: "Jesus then took the loaves, gave thanks, and distributed to those who were _____.", answers: ["seated"] },
            { reference: "John 6:12", template: "When they had all had enough to eat, he said to his disciples, 'Gather the pieces that are left over. Let nothing be _____.'", answers: ["wasted"] },
            { reference: "John 6:13", template: "they filled twelve baskets with the pieces… that were left over by those who had _____.", answers: ["eaten"] },
          ],
          wordBank: ["eat", "fish", "seated", "wasted", "eaten", "loaves", "baskets", "crowd", "thanks", "bread"],
        },
      },
    ],
    resolution:
      "Jesus takes a boy's small lunch, gives thanks, and it feeds a crowd of five thousand with twelve baskets left over — more than enough, starting from what looked like nowhere near enough.",
    nextHook:
      "That same night, Jesus sends the crowds home and His disciples out on the water alone — and joins them later in a way none of them expect. Next: Jesus Walks on Water.",
    estimatedMinutes: 6,
  },
  {
    id: "jesus-walks-on-water",
    title: "Jesus Walks on Water",
    track: "scripture",
    chronologicalOrder: 720,
    scriptureReference: "Matthew 14:22-33",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Late at night, far from shore, the disciples' boat is battered by waves — and then they see a figure walking toward them across the water and think it's a ghost. Jesus tells them exactly who He is, and Peter asks to walk out to meet Him.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're in a small boat, in the dark, being tossed by waves, and something is walking toward you across the water. Your first instinct is terror. What would it take for that terror to turn into trust?",
        placeholder: "Write what it would take…",
        context:
          "Matthew 14:26 — \"When the disciples saw him walking on the lake, they were terrified. 'It's a ghost,' they said, and cried out in fear.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What happens when Peter starts walking on the water toward Jesus?",
        options: ["He walks the whole way without trouble", "He sees the wind and begins to sink, and Jesus catches him", "He immediately turns back", "The other disciples pull him back into the boat"],
        correctIndex: 1,
        context:
          "Matthew 14:30 — \"when he saw the wind, he was afraid and, beginning to sink, cried out, 'Lord, save me!' Immediately Jesus reached out his hand and caught him.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Peter is the only disciple who gets out of the boat at all — and he's also the one who starts to sink. Which feels riskier to you: staying in the boat, or stepping out and risking failure?",
        context:
          "Jesus doesn't scold Peter for stepping out, only for doubting once he was already walking (Matthew 14:31): \"'You of little faith,' he said, 'why did you doubt?'\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 14:25", template: "shortly before dawn Jesus went out to them, walking on the _____.", answers: ["lake"] },
            { reference: "Matthew 14:27", template: "But Jesus immediately said to them: 'Take courage! It is I. Don't be _____.'", answers: ["afraid"] },
            { reference: "Matthew 14:28", template: "'Lord, if it's you,' Peter replied, 'tell me to come to you on the _____.'", answers: ["water"] },
            { reference: "Matthew 14:30", template: "when he saw the wind, he was afraid and, beginning to sink, cried out, 'Lord, save _____!'", answers: ["me"] },
            { reference: "Matthew 14:33", template: "the men in the boat worshiped him, saying, 'Truly you are the Son of _____.'", answers: ["God"] },
          ],
          wordBank: ["lake", "afraid", "water", "me", "God", "wind", "boat", "sink", "courage", "hand"],
        },
      },
    ],
    resolution:
      "Peter walks on water as long as his eyes are on Jesus, starts sinking the moment he notices the wind, and is caught the instant he cries out. The wind dies down when Jesus climbs into the boat, and the disciples worship Him as the Son of God.",
    nextHook:
      "Not long after, Jesus takes three of these same disciples up a mountain, where they'll briefly see exactly who He's always been. Next: The Transfiguration.",
    estimatedMinutes: 7,
  },
  {
    id: "transfiguration",
    title: "The Transfiguration",
    track: "scripture",
    chronologicalOrder: 730,
    scriptureReference: "Matthew 17:1-8",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Jesus takes Peter, James, and John up a mountain, and His appearance suddenly changes — His face shining like the sun, His clothes dazzling white. Moses and Elijah appear beside Him, and a voice from the cloud says exactly who He is.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You climb a mountain with your teacher, and He's suddenly transformed in front of you — shining, glowing, talking with two long-dead prophets. Peter's instinct is to build shelters and stay there. What would you want to do in that moment?",
        placeholder: "Write what you'd want to do…",
        context:
          "Matthew 17:4 — Peter says, \"Lord, it is good for us to be here. If you wish, I will put up three shelters — one for you, one for Moses and one for Elijah.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does the voice from the cloud say?",
        options: ["\"Worship him\"", "\"This is my Son, whom I love; with him I am well pleased. Listen to him!\"", "\"He is greater than Moses and Elijah\"", "\"Do not be afraid\""],
        correctIndex: 1,
        context:
          "Matthew 17:5 — the same declaration as at Jesus' baptism, with one addition: \"Listen to him!\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "This moment happens right after Jesus has started telling His disciples He must suffer and die — a hard, confusing thing to hear. Why might God give them this glimpse of glory right at that exact point?",
        context:
          "The vision comes as a kind of anchor before the hardest part of the story — proof of who Jesus really is, given just before the disciples watch Him suffer.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 17:2", template: "There he was transfigured before them. His face shone like the sun, and his clothes became as white as the _____.", answers: ["light"] },
            { reference: "Matthew 17:3", template: "Just then there appeared before them Moses and Elijah, talking with _____.", answers: ["Jesus"] },
            { reference: "Matthew 17:5", template: "a voice from the cloud said, 'This is my Son, whom I love; with him I am well pleased. Listen to _____!'", answers: ["him"] },
            { reference: "Matthew 17:6", template: "When the disciples heard this, they fell facedown to the ground, _____ afraid.", answers: ["terrified"] },
            { reference: "Matthew 17:7", template: "Jesus came and touched them. 'Get up,' he said. 'Don't be _____.'", answers: ["afraid"] },
          ],
          wordBank: ["light", "Jesus", "him", "terrified", "afraid", "mountain", "cloud", "shone", "voice", "shelters"],
        },
      },
    ],
    resolution:
      "For a moment, Peter, James, and John see Jesus as He truly is — radiant, standing with Moses and Elijah, named directly by the Father's voice: 'This is my Son… Listen to him!' Then it's over, and it's Jesus alone, telling them, 'Don't be afraid.'",
    nextHook:
      "From the mountain, Jesus turns His face toward Jerusalem — where some of His hardest, most searching stories are still ahead, including one about a father waiting for a son who ran. Next: The Prodigal Son.",
    estimatedMinutes: 7,
  },
  {
    id: "day-06-do-not-be-anxious",
    title: "The Prodigal Son",
    track: "scripture",
    chronologicalOrder: 800,
    scriptureReference: "Luke 15:11-32",
    lessonBook: "Luke",
    imageUrl: "/events/prodigal-son.webp",
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
    imageUrl: "/events/woman-caught-in-sin.webp",
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
      "Grace this real costs something — and not long after, Jesus shares one last meal with His friends before the night that leads to a cross. Next: The Last Supper.",
    estimatedMinutes: 7,
  },
  {
    id: "the-last-supper",
    title: "The Last Supper",
    track: "scripture",
    chronologicalOrder: 910,
    scriptureReference: "Matthew 26:17-30",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "At a Passover meal with the twelve, Jesus takes bread and wine and gives them new meaning — his body, his blood, given for them — hours before he's betrayed by one of the men at that same table.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're at the table with Jesus and the other eleven, and He's just said one of you will betray Him. Everyone starts asking, 'Surely not I?' What's the first thing you'd want to know?",
        placeholder: "Write what you'd want to know…",
        context:
          "Matthew 26:22 — \"They were very sad and began to say to him one after the other, 'Surely you don't mean me, Lord?'\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did Jesus say the bread and the cup represented?",
        options: [
          "A reminder of the Passover in Egypt only",
          "His body and his blood, given for them",
          "A symbol with no real meaning",
          "A test to see who truly believed",
        ],
        correctIndex: 1,
        context:
          "Matthew 26:26,28 — \"Take and eat; this is my body… this is my blood of the covenant, which is poured out for many for the forgiveness of sins.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Jesus shares this meal — calls Judas 'friend' even knowing what he's about to do — fully aware of what's coming. What does that tell you about how far His love was willing to go, even for someone actively betraying Him?",
        context:
          "A few hours later, in Gethsemane, Jesus still calls Judas \"friend\" even as he's being betrayed with a kiss (Matthew 26:50).",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 26:26", template: "Take and eat; this is my _____.", answers: ["body"] },
            { reference: "Matthew 26:28", template: "this is my blood of the _____, which is poured out for many.", answers: ["covenant"] },
            { reference: "Matthew 26:28", template: "poured out for many for the forgiveness of _____.", answers: ["sins"] },
            { reference: "Matthew 26:21", template: "Truly I tell you, one of you will _____ me.", answers: ["betray"] },
            { reference: "Matthew 26:29", template: "I will drink it new with you in my Father's _____.", answers: ["kingdom"] },
          ],
          wordBank: ["body", "covenant", "sins", "betray", "kingdom", "bread", "cup", "blood", "Passover", "disciples"],
        },
      },
    ],
    resolution:
      "Jesus shares one last Passover with the twelve, giving the bread and cup new meaning — His body, His blood, poured out for them — even as He tells them plainly that one of them will betray Him before the night is over.",
    nextHook:
      "From the table, Jesus leads them out to a garden to pray — and asks His closest friends to simply stay awake with Him for one hour. It doesn't go the way He hoped. Next: Jesus in Gethsemane.",
    estimatedMinutes: 7,
  },
  {
    id: "jesus-in-gethsemane",
    title: "Jesus in Gethsemane",
    track: "scripture",
    chronologicalOrder: 920,
    scriptureReference: "Matthew 26:36-46",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Hours before His arrest, Jesus goes to a garden to pray, His soul 'overwhelmed with sorrow to the point of death.' He asks His three closest friends to stay awake with Him. Three times, they fall asleep instead.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're one of the three disciples Jesus asked to stay awake and pray with Him, and you keep drifting off despite trying. He wakes you a second time, clearly in agony, and asks again. What do you say to Him?",
        placeholder: "Write what you'd say…",
        context:
          "Matthew 26:40-41 — Jesus finds them asleep and says, \"Couldn't you men keep watch with me for one hour?… The spirit is willing, but the flesh is weak.\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does Jesus pray, three times, in the garden?",
        options: [
          "\"Let this cup be taken from me\" — yet not as I will, but as you will",
          "\"Send twelve legions of angels to protect me\"",
          "\"Let my disciples be spared instead of me\"",
          "He prays in silence and asks nothing specific",
        ],
        correctIndex: 0,
        context:
          "Matthew 26:39 — \"My Father, if it is possible, may this cup be taken from me. Yet not as I will, but as you will.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Jesus asks for the suffering to be taken away, and then submits to it anyway. What do you think it means that even Jesus wrestled honestly with what was coming, instead of accepting it easily?",
        context:
          "Luke's account (22:44) adds that His sweat \"was like drops of blood falling to the ground\" — real, physical agony, not calm resignation.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 26:38", template: "My soul is overwhelmed with sorrow to the point of _____.", answers: ["death"] },
            { reference: "Matthew 26:39", template: "yet not as I will, but as you _____.", answers: ["will"] },
            { reference: "Matthew 26:40", template: "Couldn't you men keep watch with me for one _____?", answers: ["hour"] },
            { reference: "Matthew 26:41", template: "the spirit is willing, but the flesh is _____.", answers: ["weak"] },
            { reference: "Matthew 26:45", template: "the hour has come, and the Son of Man is delivered into the hands of _____.", answers: ["sinners"] },
          ],
          wordBank: ["death", "will", "hour", "weak", "sinners", "pray", "garden", "asleep", "cup", "Father"],
        },
      },
    ],
    resolution:
      "Three times, Jesus prays the same honest, agonized prayer — 'not as I will, but as you will' — and three times His closest friends fall asleep instead of staying with Him. He rises from the garden ready for what's next, alone in it.",
    nextHook:
      "Judas arrives with a kiss and a crowd, and the night that started at a table ends with Jesus arrested, tried, and handed over. Next: The Crucifixion.",
    estimatedMinutes: 7,
  },
  {
    id: "the-crucifixion",
    title: "The Crucifixion",
    track: "scripture",
    chronologicalOrder: 930,
    scriptureReference: "Matthew 27:32-54",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "Jesus is nailed to a cross between two criminals while a crowd mocks Him for not saving Himself. Darkness covers the land for three hours. Then, with a final cry, He gives up His spirit — and a Roman centurion, of all people, says who He really was.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're standing at the foot of the cross, watching the crowd mock a man who healed the sick and fed thousands, daring Him to save Himself. He doesn't answer them. What would you be feeling, watching in silence?",
        placeholder: "Write what you'd feel…",
        context:
          "Matthew 27:40,42 — the crowd jeers, \"If you are the Son of God, come down from the cross!… He saved others… but he can't save himself!\"",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did the Roman centurion say after Jesus died?",
        options: [
          "\"This man deserved to die\"",
          "\"Surely he was the Son of God\"",
          "He said nothing at all",
          "\"This proves he was only a man\"",
        ],
        correctIndex: 1,
        context:
          "Matthew 27:54 — after the earthquake, the centurion and those guarding Jesus \"were terrified, and exclaimed, 'Surely he was the Son of God!'\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The curtain in the temple — the barrier separating the Most Holy Place from everyone else — tears in two the moment Jesus dies. What do you think that tearing means about what just changed?",
        context:
          "Hebrews 10:19-20 later explains it directly: believers now have confidence to enter God's presence \"by a new and living way opened for us through the curtain, that is, his body.\"",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 27:46", template: "My God, my God, why have you forsaken _____?", answers: ["me"] },
            { reference: "Matthew 27:50", template: "Jesus cried out again in a loud voice and gave up his _____.", answers: ["spirit"] },
            { reference: "Matthew 27:51", template: "the curtain of the temple was torn in two, from top to _____.", answers: ["bottom"] },
            { reference: "Matthew 27:54", template: "Surely he was the Son of _____!", answers: ["God"] },
            { reference: "Matthew 27:45", template: "From noon until three in the afternoon darkness came over all the _____.", answers: ["land"] },
          ],
          wordBank: ["me", "spirit", "bottom", "God", "land", "cross", "curtain", "forsaken", "centurion", "darkness"],
        },
      },
    ],
    resolution:
      "Jesus dies between two criminals as the sky goes dark and the temple curtain tears from top to bottom. A Roman centurion — an outsider, not a believer — is the one who says out loud what the moment means: 'Surely he was the Son of God!'",
    nextHook:
      "Friday ends in a borrowed tomb, sealed with a stone and a guard. Sunday doesn't. Next: The Resurrection.",
    estimatedMinutes: 8,
  },
  {
    id: "day-10-fillblank-psalm-23-1",
    title: "The Resurrection",
    track: "scripture",
    chronologicalOrder: 1000,
    scriptureReference: "John 20:1-18",
    lessonBook: "John",
    imageUrl: "/events/resurrection.webp",
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
      "Mary runs to tell the others 'I have seen the Lord' — and over the next forty days, the risen Jesus appears again and again, right up until He gives His followers one last, sweeping command. Next: The Great Commission.",
    estimatedMinutes: 6,
  },
  {
    id: "the-great-commission",
    title: "The Great Commission",
    track: "scripture",
    chronologicalOrder: 1010,
    scriptureReference: "Matthew 28:16-20",
    lessonBook: "Matthew",
    imageUrl: null,
    summary:
      "On a mountain in Galilee, the risen Jesus gives His eleven remaining disciples one final, sweeping instruction — not to stay and guard what they'd been given, but to go, make disciples of every nation, and trust He'd be with them the whole way.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're one of the eleven disciples on that mountain — some of you are worshiping, the text says, and some are still doubting. Jesus gives this massive commission to that exact mixed group, doubts and all. What does that tell you about who He commissions?",
        placeholder: "Write what you'd take from that…",
        context:
          "Matthew 28:17 — \"When they saw him, they worshiped him; but some doubted.\" The command that follows doesn't wait for the doubt to fully resolve first.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What does Jesus promise at the very end of the Great Commission?",
        options: [
          "\"You will never face hardship again\"",
          "\"I am with you always, to the very end of the age\"",
          "\"An angel will go before you\"",
          "\"You will not need to teach, only baptize\"",
        ],
        correctIndex: 1,
        context: "Matthew 28:20 — \"And surely I am with you always, to the very end of the age.\"",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "The command is to 'go' and 'make disciples' — not just believe privately, but actively teach and baptize others. Why do you think faith, in Jesus' own words here, was never meant to stay contained to one person?",
        context:
          "This same sending pattern runs through Scripture — Israel was blessed \"to be a blessing\" (Genesis 12:2-3) long before this moment; the commission continues that same outward shape.",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Matthew 28:18", template: "All authority in heaven and on earth has been given to _____.", answers: ["me"] },
            { reference: "Matthew 28:19", template: "Therefore go and make disciples of all _____.", answers: ["nations"] },
            { reference: "Matthew 28:19", template: "baptizing them in the name of the Father and of the Son and of the Holy _____.", answers: ["Spirit"] },
            { reference: "Matthew 28:20", template: "teaching them to obey everything I have commanded _____.", answers: ["you"] },
            { reference: "Matthew 28:20", template: "surely I am with you always, to the very end of the _____.", answers: ["age"] },
          ],
          wordBank: ["me", "nations", "Spirit", "you", "age", "disciples", "authority", "baptize", "always", "mountain"],
        },
      },
    ],
    resolution:
      "On a mountain, with some still doubting, Jesus sends His disciples out with the widest command He's given yet — make disciples of every nation — and the widest promise: 'I am with you always, to the very end of the age.'",
    nextHook:
      "Jesus ascends, and the disciples are left waiting on His promise of a Helper — until one morning in Jerusalem, that promise arrives all at once, with wind, fire, and a sound the whole city can hear. Next: The Day of Pentecost.",
    estimatedMinutes: 7,
  },
  {
    id: "the-day-of-pentecost",
    title: "The Day of Pentecost",
    track: "scripture",
    chronologicalOrder: 1020,
    scriptureReference: "Acts 2:1-21",
    lessonBook: "Acts",
    imageUrl: null,
    summary:
      "Fifty days after the resurrection, the promised Holy Spirit arrives with a sound like a rushing wind and tongues of fire — and a small room of frightened disciples suddenly speaks in languages they never learned, to a crowd gathered from all over the world.",
    screens: [
      {
        id: "q1",
        type: "scenario",
        prompt:
          "You're in that room when the sound of a rushing wind fills the house and something like fire rests on each person there — and you find yourself speaking a language you never learned. What's the first thing you'd want to say, once you found the words?",
        placeholder: "Write what you'd want to say…",
        context:
          "Acts 2:11 — the crowd hears them \"declaring the wonders of God\" in their own native languages, without any of the disciples having studied those languages.",
      },
      {
        id: "q2",
        type: "multipleChoice",
        prompt: "What did Peter say was happening, when the crowd accused the disciples of being drunk?",
        options: [
          "\"This is what was spoken by the prophet Joel\"",
          "\"You misunderstand what you're hearing\"",
          "\"We had a small amount of wine, nothing more\"",
          "He said nothing and let the accusation stand",
        ],
        correctIndex: 0,
        context:
          "Acts 2:15-16 — \"These people are not drunk, as you suppose… this is what was spoken by the prophet Joel,\" quoting Joel's promise that God would pour out His Spirit on all people.",
      },
      {
        id: "q3",
        type: "shortAnswer",
        prompt:
          "Peter — who denied Jesus three times just weeks earlier — is the one who stands up and preaches boldly to a crowd of thousands that same day. What do you think changed between his denial and this moment?",
        context:
          "This is the same Peter behind Peter's Watch — denied Jesus (Luke 22:54-62), then restored (John 21:15-19) — now filled with the Spirit he'd just received, preaching the sermon that leads three thousand people to be baptized that day (Acts 2:41).",
      },
      {
        id: "verse",
        type: "verseBlank",
        prompt: "Fill in the verse",
        activity: {
          verses: [
            { reference: "Acts 2:2", template: "a sound like the blowing of a violent _____ came from heaven.", answers: ["wind"] },
            { reference: "Acts 2:3", template: "They saw what seemed to be tongues of _____ that separated and came to rest on each of them.", answers: ["fire"] },
            { reference: "Acts 2:4", template: "All of them were filled with the Holy Spirit and began to speak in other _____.", answers: ["tongues"] },
            { reference: "Acts 2:21", template: "everyone who calls on the name of the Lord will be _____.", answers: ["saved"] },
            { reference: "Acts 2:41", template: "Those who accepted his message were baptized, and about three thousand were added to their number that _____.", answers: ["day"] },
          ],
          wordBank: ["wind", "fire", "tongues", "saved", "day", "Spirit", "Peter", "Jerusalem", "crowd", "prophet"],
        },
      },
    ],
    resolution:
      "The promised Holy Spirit arrives with wind, fire, and languages nobody in that room had learned — and Peter, once too afraid to admit he knew Jesus, stands up and preaches to thousands. About three thousand people are baptized that single day.",
    nextHook:
      "This is where the seeded library stands today — more stories, spanning both testaments, are on their way. Come back for what's next.",
    estimatedMinutes: 8,
  },
];
