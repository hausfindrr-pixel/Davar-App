import Image from "next/image";

type MascotHeroProps = {
  streak: number;
  message: string;
};

/** John's permanent, always-visible presence on Today — separate from the
 * rotating ApostleMessageCard (Peter/Matthew/Thomas, for specific moments;
 * see pickApostleMoment). John's line here changes once a day
 * (deterministically, see the caller) but he himself never rotates away. */
export function MascotHero({ streak, message }: MascotHeroProps) {
  return (
    <div className="w-full max-w-sm flex items-start gap-3">
      <div className="relative flex-1 rounded-2xl bg-paper border border-mist px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
          Day {streak}
        </span>
        <p className="mt-0.5 text-sm text-ink/85 leading-relaxed">{message}</p>
        <span
          aria-hidden
          className="absolute -right-2 bottom-4 h-4 w-4 rotate-45 bg-paper border-r border-b border-mist"
        />
      </div>
      <Image
        src="/apostles/john.png"
        alt="John"
        width={200}
        height={300}
        className="h-32 w-auto shrink-0"
        priority
      />
    </div>
  );
}
