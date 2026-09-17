/** A simple illustrated "landscape" — soft hills and a sun glow, built from
 * the app's existing palette tokens rather than a photo — sitting behind
 * Today's Verse/Devotional cards to warm up the page without competing
 * with the text. Purely decorative: absolutely positioned, non-interactive,
 * clipped by the parent's overflow-hidden. */
export function DailyContentBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
    >
      <rect width="400" height="260" fill="var(--color-clay-50)" />
      <circle cx="320" cy="40" r="70" fill="var(--color-clay-200)" opacity="0.45" />
      <circle cx="320" cy="40" r="34" fill="var(--color-clay-400)" opacity="0.5" />
      <path d="M0 190 Q 100 140 200 175 T 400 160 V260 H0 Z" fill="var(--color-sage-200)" opacity="0.55" />
      <path d="M0 220 Q 120 185 240 212 T 400 205 V260 H0 Z" fill="var(--color-sage-400)" opacity="0.45" />
    </svg>
  );
}
