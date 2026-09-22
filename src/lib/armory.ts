/**
 * The Armory — "the sword of the Spirit, which is the word of God"
 * (Ephesians 6:17). Scripture grouped by the specific struggle it speaks
 * to, so a verse is a reach away in the moment that needs it, not buried
 * in a chapter you'd have to go find. Covers both classic named sins
 * (Pride, Greed, Lust, Envy, Anger) and common life struggles that aren't
 * "sins" in the traditional sense but are just as real (Doubt, Anxiety,
 * Shame, Loneliness) — the app's own framing is "struggle", deliberately
 * broader than sin alone.
 *
 * Reference content: wording below is given in common, widely-recognized
 * phrasing close to public-domain translations (KJV/WEB) — worth checking
 * against your preferred translation before treating it as an exact quote.
 */

export type ArmoryCategoryId =
  | "lust"
  | "anger"
  | "envy"
  | "fear"
  | "pride"
  | "greed"
  | "doubt"
  | "anxiety"
  | "shame"
  | "bitterness"
  | "discouragement"
  | "loneliness";

export interface ArmoryVerse {
  reference: string;
  text: string;
}

export interface ArmoryCategory {
  id: ArmoryCategoryId;
  name: string;
  description: string;
  verses: ArmoryVerse[];
}

export const ARMORY_CATEGORIES: ArmoryCategory[] = [
  {
    id: "lust",
    name: "Lust",
    description: "For the pull toward what isn't yours to take.",
    verses: [
      {
        reference: "1 Corinthians 6:18-19",
        text: "Flee sexual immorality. Every other sin a person commits is outside the body, but the sexually immoral person sins against his own body. Do you not know that your body is a temple of the Holy Spirit within you?",
      },
      {
        reference: "1 Corinthians 10:13",
        text: "No temptation has overtaken you except what is common to mankind. God is faithful; he will not let you be tempted beyond what you can bear, but will provide a way out so that you can endure it.",
      },
      {
        reference: "Galatians 5:16",
        text: "Walk by the Spirit, and you will not gratify the desires of the flesh.",
      },
      {
        reference: "Psalm 51:10",
        text: "Create in me a clean heart, O God, and renew a right spirit within me.",
      },
      {
        reference: "Job 31:1",
        text: "I made a covenant with my eyes not to look with lust upon a young woman.",
      },
      {
        reference: "Matthew 5:28",
        text: "But I say to you that everyone who looks at a woman with lustful intent has already committed adultery with her in his heart.",
      },
    ],
  },
  {
    id: "anger",
    name: "Anger",
    description: "For when it's rising faster than you can name it.",
    verses: [
      {
        reference: "Ephesians 4:26-27",
        text: "Be angry, and do not sin. Do not let the sun go down on your anger, and give no opportunity to the devil.",
      },
      {
        reference: "James 1:19-20",
        text: "Let every person be quick to hear, slow to speak, slow to anger; for the anger of man does not produce the righteousness of God.",
      },
      {
        reference: "Proverbs 15:1",
        text: "A soft answer turns away wrath, but a harsh word stirs up anger.",
      },
      {
        reference: "Proverbs 29:11",
        text: "A fool gives full vent to his spirit, but a wise man quietly holds it back.",
      },
      {
        reference: "Colossians 3:8",
        text: "Now you must put them all away: anger, wrath, malice, slander, and obscene talk from your mouth.",
      },
      {
        reference: "Proverbs 16:32",
        text: "Whoever is slow to anger is better than the mighty, and he who rules his spirit than he who takes a city.",
      },
    ],
  },
  {
    id: "envy",
    name: "Envy",
    description: "For measuring your life against everyone else's.",
    verses: [
      {
        reference: "James 3:16",
        text: "Where jealousy and selfish ambition exist, there will be disorder and every vile practice.",
      },
      {
        reference: "1 Corinthians 13:4",
        text: "Love is patient and kind; love does not envy or boast; it is not arrogant.",
      },
      {
        reference: "Proverbs 14:30",
        text: "A heart at peace gives life to the body, but envy rots the bones.",
      },
      {
        reference: "Galatians 5:26",
        text: "Let us not become conceited, provoking one another, envying one another.",
      },
      {
        reference: "Psalm 37:1",
        text: "Fret not yourself because of evildoers; be not envious of wrongdoers.",
      },
      {
        reference: "Proverbs 27:4",
        text: "Wrath is cruel, anger is overwhelming, but who can stand before jealousy?",
      },
    ],
  },
  {
    id: "fear",
    name: "Fear",
    description: "For the nights it feels like too much to carry alone.",
    verses: [
      {
        reference: "2 Timothy 1:7",
        text: "God gave us a spirit not of fear but of power and love and self-control.",
      },
      {
        reference: "Isaiah 41:10",
        text: "Fear not, for I am with you; be not dismayed, for I am your God. I will strengthen you, I will help you, I will uphold you with my righteous right hand.",
      },
      {
        reference: "Joshua 1:9",
        text: "Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.",
      },
      {
        reference: "Psalm 34:4",
        text: "I sought the Lord, and he answered me and delivered me from all my fears.",
      },
      {
        reference: "1 John 4:18",
        text: "There is no fear in love, but perfect love casts out fear.",
      },
      {
        reference: "Psalm 27:1",
        text: "The LORD is my light and my salvation; whom shall I fear? The LORD is the stronghold of my life; of whom shall I be afraid?",
      },
    ],
  },
  {
    id: "pride",
    name: "Pride",
    description: "For when you're sure you don't need anyone, least of all God.",
    verses: [
      {
        reference: "Proverbs 16:18",
        text: "Pride goes before destruction, and a haughty spirit before a fall.",
      },
      {
        reference: "James 4:6",
        text: "God opposes the proud but gives grace to the humble.",
      },
      {
        reference: "Proverbs 11:2",
        text: "When pride comes, then comes disgrace, but with the humble is wisdom.",
      },
      {
        reference: "Philippians 2:3",
        text: "Do nothing from selfish ambition or conceit, but in humility count others more significant than yourselves.",
      },
      {
        reference: "1 Peter 5:5",
        text: "Clothe yourselves, all of you, with humility toward one another, for God opposes the proud but gives grace to the humble.",
      },
      {
        reference: "Micah 6:8",
        text: "He has told you, O man, what is good; and what does the LORD require of you but to do justice, and to love kindness, and to walk humbly with your God?",
      },
    ],
  },
  {
    id: "greed",
    name: "Greed",
    description: "For wanting more, always more, than what's already been given.",
    verses: [
      {
        reference: "1 Timothy 6:10",
        text: "For the love of money is a root of all kinds of evils. It is through this craving that some have wandered away from the faith and pierced themselves with many pangs.",
      },
      {
        reference: "Luke 12:15",
        text: "Take care, and be on your guard against all covetousness, for one's life does not consist in the abundance of his possessions.",
      },
      {
        reference: "Hebrews 13:5",
        text: "Keep your life free from love of money, and be content with what you have, for he has said, 'I will never leave you nor forsake you.'",
      },
      {
        reference: "Matthew 6:24",
        text: "No one can serve two masters... You cannot serve God and money.",
      },
      {
        reference: "Ecclesiastes 5:10",
        text: "He who loves money will not be satisfied with money, nor he who loves wealth with his income; this also is vanity.",
      },
      {
        reference: "Proverbs 11:24",
        text: "One gives freely, yet grows all the richer; another withholds what he should give, and only suffers want.",
      },
    ],
  },
  {
    id: "doubt",
    name: "Doubt",
    description: "For when faith feels thinner than you'd like to admit.",
    verses: [
      {
        reference: "Mark 9:24",
        text: "I believe; help my unbelief!",
      },
      {
        reference: "James 1:6",
        text: "But let him ask in faith, with no doubting, for the one who doubts is like a wave of the sea that is driven and tossed by the wind.",
      },
      {
        reference: "Matthew 14:31",
        text: "Jesus immediately reached out his hand and took hold of him, saying to him, 'O you of little faith, why did you doubt?'",
      },
      {
        reference: "Hebrews 11:1",
        text: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
      },
      {
        reference: "John 20:29",
        text: "Jesus said to him, 'Have you believed because you have seen me? Blessed are those who have not seen and yet have believed.'",
      },
      {
        reference: "Proverbs 3:5-6",
        text: "Trust in the LORD with all your heart, and do not lean on your own understanding. In all your ways acknowledge him, and he will make straight your paths.",
      },
    ],
  },
  {
    id: "anxiety",
    name: "Anxiety",
    description: "For the mind that won't stop running the worst-case.",
    verses: [
      {
        reference: "Philippians 4:6-7",
        text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your minds in Christ Jesus.",
      },
      {
        reference: "Matthew 6:34",
        text: "Therefore do not be anxious about tomorrow, for tomorrow will be anxious for itself. Sufficient for the day is its own trouble.",
      },
      {
        reference: "1 Peter 5:7",
        text: "Casting all your anxieties on him, because he cares for you.",
      },
      {
        reference: "Psalm 55:22",
        text: "Cast your burden on the LORD, and he will sustain you; he will never permit the righteous to be moved.",
      },
      {
        reference: "Matthew 6:26",
        text: "Look at the birds of the air: they neither sow nor reap nor gather into barns, and yet your heavenly Father feeds them. Are you not of more value than they?",
      },
      {
        reference: "John 14:27",
        text: "Peace I leave with you; my peace I give to you... Let not your hearts be troubled, neither let them be afraid.",
      },
    ],
  },
  {
    id: "shame",
    name: "Shame & Guilt",
    description: "For the voice that says you're only as good as your worst moment.",
    verses: [
      {
        reference: "Romans 8:1",
        text: "There is therefore now no condemnation for those who are in Christ Jesus.",
      },
      {
        reference: "Psalm 34:5",
        text: "Those who look to him are radiant, and their faces shall never be ashamed.",
      },
      {
        reference: "Isaiah 1:18",
        text: "Come now, let us reason together, says the LORD: though your sins are like scarlet, they shall be as white as snow.",
      },
      {
        reference: "1 John 1:9",
        text: "If we confess our sins, he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.",
      },
      {
        reference: "Psalm 103:12",
        text: "As far as the east is from the west, so far does he remove our transgressions from us.",
      },
      {
        reference: "Romans 10:11",
        text: "The Scripture says, 'Everyone who believes in him will not be put to shame.'",
      },
    ],
  },
  {
    id: "bitterness",
    name: "Bitterness & Unforgiveness",
    description: "For the wound you keep picking at.",
    verses: [
      {
        reference: "Ephesians 4:31-32",
        text: "Let all bitterness and wrath and anger and clamor and slander be put away from you, along with all malice. Be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you.",
      },
      {
        reference: "Colossians 3:13",
        text: "Bearing with one another and, if one has a complaint against another, forgiving each other; as the Lord has forgiven you, so you also must forgive.",
      },
      {
        reference: "Matthew 6:14-15",
        text: "For if you forgive others their trespasses, your heavenly Father will also forgive you, but if you do not forgive others their trespasses, neither will your Father forgive your trespasses.",
      },
      {
        reference: "Hebrews 12:15",
        text: "See to it that no one fails to obtain the grace of God; that no root of bitterness springs up and causes trouble, and by it many become defiled.",
      },
      {
        reference: "Matthew 18:21-22",
        text: "Then Peter came up and said to him, 'Lord, how often will my brother sin against me, and I forgive him? As many as seven times?' Jesus said to him, 'I do not say to you seven times, but seventy-seven times.'",
      },
      {
        reference: "Romans 12:19",
        text: "Beloved, never avenge yourselves, but leave it to the wrath of God, for it is written, 'Vengeance is mine, I will repay, says the Lord.'",
      },
    ],
  },
  {
    id: "discouragement",
    name: "Discouragement",
    description: "For when you can't find the will to keep going.",
    verses: [
      {
        reference: "Galatians 6:9",
        text: "And let us not grow weary of doing good, for in due season we will reap, if we do not give up.",
      },
      {
        reference: "Isaiah 40:31",
        text: "But they who wait for the LORD shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.",
      },
      {
        reference: "Psalm 42:11",
        text: "Why are you cast down, O my soul, and why are you in turmoil within me? Hope in God; for I shall again praise him, my salvation and my God.",
      },
      {
        reference: "2 Corinthians 4:16",
        text: "So we do not lose heart. Though our outer self is wasting away, our inner self is being renewed day by day.",
      },
      {
        reference: "Lamentations 3:22-23",
        text: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.",
      },
      {
        reference: "Philippians 1:6",
        text: "And I am sure of this, that he who began a good work in you will bring it to completion at the day of Jesus Christ.",
      },
    ],
  },
  {
    id: "loneliness",
    name: "Loneliness",
    description: "For the ache of feeling unseen.",
    verses: [
      {
        reference: "Deuteronomy 31:6",
        text: "Be strong and courageous... for it is the LORD your God who goes with you. He will not leave you or forsake you.",
      },
      {
        reference: "Psalm 68:6",
        text: "God settles the solitary in a home.",
      },
      {
        reference: "Psalm 25:16",
        text: "Turn to me and be gracious to me, for I am lonely and afflicted.",
      },
      {
        reference: "Matthew 28:20",
        text: "And behold, I am with you always, to the end of the age.",
      },
      {
        reference: "Psalm 147:3",
        text: "He heals the brokenhearted and binds up their wounds.",
      },
      {
        reference: "John 14:18",
        text: "I will not leave you as orphans; I will come to you.",
      },
    ],
  },
];
