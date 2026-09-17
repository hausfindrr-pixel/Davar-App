/**
 * Seed content for the Today tab's three daily-content pools —
 * daily_verses, daily_devotionals, daily_prayers. Kept deliberately
 * separate from scripts/lessons-data.mjs (The Path's library): these are
 * a different, independently-rotating pool, matching a different
 * Firestore collection, per src/types/firestore.ts. `order` drives the
 * day-of-year rotation (src/lib/dailyContent.ts) and must be unique and
 * stable within each pool — don't renumber existing entries when adding
 * more, just continue the sequence.
 */

export const dailyVerses = [
  { id: "verse-01", order: 1, reference: "Isaiah 41:10", text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
  { id: "verse-02", order: 2, reference: "Joshua 1:9", text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go." },
  { id: "verse-03", order: 3, reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  { id: "verse-04", order: 4, reference: "Psalm 46:1", text: "God is our refuge and strength, an ever-present help in trouble." },
  { id: "verse-05", order: 5, reference: "2 Corinthians 5:17", text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!" },
  { id: "verse-06", order: 6, reference: "Jeremiah 29:11", text: "\"For I know the plans I have for you,\" declares the Lord, \"plans to prosper you and not to harm you, plans to give you hope and a future.\"" },
  { id: "verse-07", order: 7, reference: "Matthew 11:28-30", text: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls." },
];

export const dailyDevotionals = [
  {
    id: "devotional-01",
    order: 1,
    title: "Small Beginnings",
    text: "Nothing about today has to be dramatic to matter. Faithfulness is usually quiet — a decision made again, not a mountain moved once. Ask God for the grace to be faithful in whatever's ordinary in front of you today.",
  },
  {
    id: "devotional-02",
    order: 2,
    title: "Enough for Today",
    text: "God gave Israel manna one day at a time, on purpose — enough for today, not a warehouse for the year. Whatever's worrying you about tomorrow, hand it over and ask for today's portion instead.",
  },
  {
    id: "devotional-03",
    order: 3,
    title: "A Quiet Place",
    text: "Even Jesus withdrew to pray alone before the crowds came back. Rest isn't the reward for finishing — it's part of how the work gets done. Where's your quiet place today, even for five minutes?",
  },
  {
    id: "devotional-04",
    order: 4,
    title: "Carrying Each Other",
    text: "Faith was never meant to be carried alone — someone is meant to help you up, and you're meant to help someone else. Who's in your corner today, and who's waiting on you to show up in theirs?",
  },
  {
    id: "devotional-05",
    order: 5,
    title: "Not by Sight",
    text: "Faith rarely comes with the whole picture in view — it's trusting the character of the One who does have it. What's one place today you're being asked to take the next step without seeing the whole road?",
  },
  {
    id: "devotional-06",
    order: 6,
    title: "The Work of Waiting",
    text: "Waiting isn't wasted time in Scripture — it's where strength gets renewed. If you're in a season of waiting right now, let it be active rest, not just delay.",
  },
  {
    id: "devotional-07",
    order: 7,
    title: "Gratitude First",
    text: "Naming what you're thankful for before naming what's wrong changes the shape of a day. Try starting there today, even with something small.",
  },
];

export const dailyPrayers = [
  {
    id: "prayer-01",
    order: 1,
    title: "For Today",
    text: "Lord, thank you for this day before anything in it has happened yet. Give me eyes to see where you're already at work, and a willing heart to join you there. Amen.",
  },
  {
    id: "prayer-02",
    order: 2,
    title: "For Peace",
    text: "God, quiet the noise in my mind right now. Where I'm anxious, meet me with your peace that doesn't depend on my circumstances changing first. Amen.",
  },
  {
    id: "prayer-03",
    order: 3,
    title: "For Strength",
    text: "Father, I don't have to carry today in my own strength. Where I'm tired, renew me; where I'm afraid, remind me you go before me. Amen.",
  },
  {
    id: "prayer-04",
    order: 4,
    title: "For Gratitude",
    text: "Thank you, God, for what's good in my life right now — even the small things I usually pass by without noticing. Open my eyes to more of it today. Amen.",
  },
  {
    id: "prayer-05",
    order: 5,
    title: "For Others",
    text: "Lord, bring to mind someone who needs prayer right now. Watch over them today, meet their need, and let me be someone who shows up for them if I can. Amen.",
  },
  {
    id: "prayer-06",
    order: 6,
    title: "For Direction",
    text: "God, I don't always know the next right step. Make your way clear, and give me the courage to take it even when it's not fully clear yet. Amen.",
  },
  {
    id: "prayer-07",
    order: 7,
    title: "For Rest",
    text: "Father, thank you that my worth isn't measured by how much I get done today. Help me rest in who I am to you, not just in what I finish. Amen.",
  },
];
