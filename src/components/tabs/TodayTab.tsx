import { ApostleMessageCard } from "@/components/ApostleMessageCard";
import { DailyContentBackdrop } from "@/components/DailyContentBackdrop";
import { MascotHero } from "@/components/MascotHero";
import { NextStoryTeaser } from "@/components/NextStoryTeaser";
import { StreakVisual } from "@/components/StreakVisual";
import type { ApostleMoment } from "@/lib/apostle-moment";
import type { PathEvent } from "@/lib/roadmap";
import type { DailyDevotionalDoc, DailyPrayerDoc, DailyVerseDoc } from "@/types/firestore";

type TodayTabProps = {
  currentCount: number;
  longestCount: number;
  checkedInToday: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
  apostleMoment: ApostleMoment | null;
  mascotMessage: string;
  nextStory: PathEvent | null;
  onContinueStory: (story: PathEvent) => void;
  dailyVerse: DailyVerseDoc | null;
  dailyDevotional: DailyDevotionalDoc | null;
  dailyPrayer: DailyPrayerDoc | null;
};

/** Today — John's always-on greeting up top (MascotHero), a teaser
 * pointing at whatever story is next in The Path's roadmap
 * (NextStoryTeaser — not a separate pool, just a pointer into the user's
 * own progress there), the app's daily content (verse, devotional, guided
 * prayer, rotating one pick per calendar date — see
 * src/lib/dailyContent.ts), Peter/Matthew/Thomas' situational nudges when
 * one applies (see pickApostleMoment), and the streak. The Path (a
 * separate tab) holds the structured, book-organized lesson library
 * instead — nothing here repeats there, and vice versa. */
export function TodayTab({
  currentCount,
  longestCount,
  checkedInToday,
  checkingIn,
  onCheckIn,
  apostleMoment,
  mascotMessage,
  nextStory,
  onContinueStory,
  dailyVerse,
  dailyDevotional,
  dailyPrayer,
}: TodayTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <MascotHero streak={currentCount} message={mascotMessage} />

      {nextStory && (
        <NextStoryTeaser story={nextStory} onContinue={() => onContinueStory(nextStory)} />
      )}

      {apostleMoment && (
        <ApostleMessageCard apostle={apostleMoment.apostle} message={apostleMoment.message} />
      )}

      {(dailyVerse || dailyDevotional) && (
        <div className="relative w-full max-w-sm rounded-3xl overflow-hidden">
          <DailyContentBackdrop />
          <div className="relative flex flex-col gap-4 p-4">
            {dailyVerse && (
              <section className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
                  Today&apos;s Verse
                </span>
                <p className="text-sm text-ink/80 leading-relaxed">
                  &ldquo;{dailyVerse.text}&rdquo;
                </p>
                <span className="text-xs text-stone">{dailyVerse.reference}</span>
              </section>
            )}

            {dailyDevotional && (
              <section className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
                  Today&apos;s Devotional
                </span>
                <h3 className="text-base font-semibold text-ink">{dailyDevotional.title}</h3>
                <p className="text-sm text-ink/80 leading-relaxed">{dailyDevotional.text}</p>
              </section>
            )}
          </div>
        </div>
      )}

      {dailyPrayer && (
        <section className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
            Today&apos;s Prayer
          </span>
          <h3 className="text-base font-semibold text-ink">{dailyPrayer.title}</h3>
          <p className="text-sm text-ink/80 leading-relaxed">{dailyPrayer.text}</p>
        </section>
      )}

      <StreakVisual
        currentCount={currentCount}
        longestCount={longestCount}
        checkedInToday={checkedInToday}
        checkingIn={checkingIn}
        onCheckIn={onCheckIn}
      />
    </div>
  );
}
