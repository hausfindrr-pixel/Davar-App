import { StreakCard } from "@/components/StreakCard";

// Placeholder data — will be replaced by a live Firestore read (streaks/{uid})
// once auth and data fetching are wired up.
const placeholderStreak = {
  currentCount: 0,
  longestCount: 0,
  checkedInToday: false,
};

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Davar</h1>
        <p className="text-sm opacity-60">Your daily walk, one day at a time.</p>
      </div>
      <StreakCard {...placeholderStreak} />
    </main>
  );
}
