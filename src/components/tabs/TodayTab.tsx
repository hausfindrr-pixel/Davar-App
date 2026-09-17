import { ApostleMessageCard } from "@/components/ApostleMessageCard";
import { StreakVisual } from "@/components/StreakVisual";
import type { ApostleMoment } from "@/lib/apostle-moment";
import type { DailyDevotionalDoc, DailyPrayerDoc, DailyVerseDoc } from "@/types/firestore";

type TodayTabProps = {
  currentCount: number;
  longestCount: number;
  level: number;
  xp: number;
  checkedInToday: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
  apostleMoment: ApostleMoment | null;
  dailyVerse: DailyVerseDoc | null;
  dailyDevotional: DailyDevotionalDoc | null;
  dailyPrayer: DailyPrayerDoc | null;
};

/** Today — the app's daily content (verse, devotional, guided prayer,
 * rotating one pick per calendar date — see src/lib/dailyContent.ts),
 * plus streak, XP, level, and the apostle companion's message. The
 * original single-scroll dashboard content, now just one of six tabs. The
 * Path (a separate tab) holds the structured, book-organized lesson
 * library instead — nothing here repeats there, and vice versa. */
export function TodayTab({
  currentCount,
  longestCount,
  level,
  xp,
  checkedInToday,
  checkingIn,
  onCheckIn,
  apostleMoment,
  dailyVerse,
  dailyDevotional,
  dailyPrayer,
}: TodayTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      {apostleMoment && (
        <ApostleMessageCard apostle={apostleMoment.apostle} message={apostleMoment.message} />
      )}

      {dailyVerse && (
        <section className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
            Today&apos;s Verse
          </span>
          <p className="text-sm text-ink/80 leading-relaxed">&ldquo;{dailyVerse.text}&rdquo;</p>
          <span className="text-xs text-stone">{dailyVerse.reference}</span>
        </section>
      )}

      {dailyDevotional && (
        <section className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
            Today&apos;s Devotional
          </span>
          <h3 className="text-base font-semibold text-ink">{dailyDevotional.title}</h3>
          <p className="text-sm text-ink/80 leading-relaxed">{dailyDevotional.text}</p>
        </section>
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
        level={level}
        xp={xp}
        checkedInToday={checkedInToday}
        checkingIn={checkingIn}
        onCheckIn={onCheckIn}
      />
    </div>
  );
}
