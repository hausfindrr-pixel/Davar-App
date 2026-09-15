import { ApostleMessageCard } from "@/components/ApostleMessageCard";
import { StreakVisual } from "@/components/StreakVisual";
import type { ApostleMoment } from "@/lib/apostle-moment";

type TodayTabProps = {
  currentCount: number;
  longestCount: number;
  level: number;
  xp: number;
  checkedInToday: boolean;
  checkingIn: boolean;
  onCheckIn: () => void;
  apostleMoment: ApostleMoment | null;
};

/** Today — streak, XP, level, the apostle companion's message, check-in.
 * The original single-scroll dashboard content, now just one of five tabs. */
export function TodayTab({
  currentCount,
  longestCount,
  level,
  xp,
  checkedInToday,
  checkingIn,
  onCheckIn,
  apostleMoment,
}: TodayTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      {apostleMoment && (
        <ApostleMessageCard apostle={apostleMoment.apostle} message={apostleMoment.message} />
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
