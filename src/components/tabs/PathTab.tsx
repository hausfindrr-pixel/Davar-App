import { LessonsSection } from "@/components/LessonsSection";
import type { PlanId } from "@/lib/plisio/plans";
import type { LessonDoc } from "@/types/firestore";

type PathTabProps = {
  lessons: LessonDoc[];
  completedLessonIds: string[];
  isPremium: boolean;
  suppressUpgradeNag: boolean;
  onComplete: (lesson: LessonDoc) => Promise<void>;
  onUpgrade: (plan: PlanId) => Promise<void>;
};

/** The Path — the daily lessons feed. Free tier: capped at
 * FREE_DAILY_LESSON_LIMIT per day (enforced in firestore.rules, not just
 * here — see completeLesson in src/lib/db/lessons.ts). Premium: unlimited. */
export function PathTab(props: PathTabProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <LessonsSection {...props} />
    </div>
  );
}
