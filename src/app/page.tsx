"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StreakCard } from "@/components/StreakCard";
import { useAuth } from "@/lib/auth-context";
import { checkIn, subscribeToStreak } from "@/lib/db/streaks";
import { subscribeToUser } from "@/lib/db/users";
import { dateKeyInTimeZone } from "@/lib/date";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { StreakDoc, UserDoc } from "@/types/firestore";

export default function Home() {
  const { user, loading, signOut } = useAuth();
  const [streak, setStreak] = useState<StreakDoc | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubStreak = subscribeToStreak(user.uid, setStreak);
    const unsubUser = subscribeToUser(user.uid, setProfile);
    return () => {
      unsubStreak();
      unsubUser();
    };
  }, [user]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-sm opacity-60">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Davar</h1>
        <p className="text-sm opacity-60">
          Your daily walk, one day at a time.
        </p>
        {isFirebaseConfigured ? (
          <Link
            href="/login"
            className="rounded-full bg-indigo-600 text-white px-6 py-2 text-sm font-medium"
          >
            Sign in
          </Link>
        ) : (
          <p className="max-w-sm text-xs opacity-60">
            Firebase isn&apos;t configured yet. Copy{" "}
            <code>.env.local.example</code> to <code>.env.local</code> and add
            your project&apos;s keys — see README.md for the walkthrough.
          </p>
        )}
      </main>
    );
  }

  const timeZone = profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = dateKeyInTimeZone(new Date(), timeZone);
  const checkedInToday = streak?.lastCheckInDate === today;

  async function handleCheckIn() {
    setCheckingIn(true);
    try {
      await checkIn(user!.uid, timeZone, { type: "custom" });
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-semibold">Davar</h1>
        <p className="text-sm opacity-60">Your daily walk, one day at a time.</p>
      </div>
      <StreakCard
        currentCount={streak?.currentCount ?? 0}
        longestCount={streak?.longestCount ?? 0}
        checkedInToday={checkedInToday}
        checkingIn={checkingIn}
        onCheckIn={handleCheckIn}
      />
      {profile && (
        <p className="text-xs opacity-50">
          Level {profile.level} · {profile.xp} XP
        </p>
      )}
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-xs opacity-50 underline"
      >
        Sign out
      </button>
    </main>
  );
}
