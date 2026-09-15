/**
 * The Armory — "the sword of the Spirit, which is the word of God"
 * (Ephesians 6:17). Scripture grouped by the specific struggle it speaks
 * to, so a verse is a reach away in the moment that needs it, not buried
 * in a chapter you'd have to go find.
 *
 * Reference content: wording below is given in common, widely-recognized
 * phrasing close to public-domain translations (KJV/WEB) — worth checking
 * against your preferred translation before treating it as an exact quote.
 */

export type ArmoryCategoryId = "lust" | "anger" | "envy" | "fear";

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
    ],
  },
];
