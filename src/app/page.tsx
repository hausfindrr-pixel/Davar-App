"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { BenefitCard } from "@/components/BenefitCard";
import { LessonsSection } from "@/components/LessonsSection";
import { PricingSection } from "@/components/PricingSection";
import { StreakVisual } from "@/components/StreakVisual";
import { useAuth } from "@/lib/auth-context";
import { completeLesson, fetchLessons, subscribeToLessonProgress } from "@/lib/db/lessons";
import { checkIn, subscribeToStreak } from "@/lib/db/streaks";
import { subscribeToUser } from "@/lib/db/users";
import { dateKeyInTimeZone } from "@/lib/date";
import type {
  DailyLessonProgressDoc,
  LessonDoc,
  StreakDoc,
  UserDoc,
} from "@/types/firestore";

const PAIN_POINTS = [
  {
    struggle: "Stuck in a cycle you can't seem to break",
    response:
      "Davar meets you with grace, not shame — daily accountability built to move you forward, not keep score of your failures.",
  },
  {
    struggle: "Wanting to grow spiritually, but not knowing where to start",
    response:
      "A simple daily rhythm of Scripture and prayer gives you one clear next step, every single day.",
  },
  {
    struggle: "Accountability that feels like judgment, not support",
    response:
      "A partner and a community built for honesty and encouragement — never judgment.",
  },
];

const BENEFITS = [
  {
    title: "Freedom through grace",
    description:
      "Break free from lust and pornography through daily, grace-centered accountability — never shame, always forward.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 21c-4-2.5-7-5.8-7-9.8A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 3.2c0 4-3 7.3-7 9.8Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9 11.5h6M12 8.5v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Scripture, made daily",
    description:
      "Engage with God's Word every day, gamified like Duolingo — streaks, XP, and levels that make consistency feel good.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M4 5.5c2.5-1 5-1 8 .3 3-1.3 5.5-1.3 8-.3v13c-2.5-1-5-1-8 .3-3-1.3-5.5-1.3-8-.3v-13Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 5.8v13" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    title: "Gentle reminders",
    description:
      "Daily nudges and encouragement keep you coming back — without guilt trips or noise.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M7 17v-5.5a5 5 0 0 1 10 0V17l1.5 2h-13L7 17Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "A community that gets it",
    description:
      "Connect with an accountability partner in a judgment-free space built for honesty, not performance.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="16" cy="11" r="2.4" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5M13.5 19c0-2-1-3.7-2.5-4.7a4 4 0 0 1 6.5 3.1"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "The Armory",
    description:
      "“The sword of the Spirit, which is the word of God” (Ephesians 6:17) — Davar means “Word.” The Armory groups verses by the specific struggle they target: lust, envy, anger, fear, and more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M12 3v11M12 14l-3 3M12 14l3 3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 19.5h7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle cx="12" cy="3" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
];

function LandingPage() {
  return (
    <main className="flex-1 bg-ivory">
      <section className="flex flex-col items-center text-center gap-5 px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
        <Image
          src="/logo.svg"
          alt="Davar"
          width={380}
          height={430}
          priority
          className="w-40 sm:w-48 h-auto"
        />
        <h1 className="text-3xl sm:text-4xl font-semibold text-ink max-w-md">
          A daily rhythm of Scripture, prayer, and grace.
        </h1>
        <a
          href="#join"
          className="mt-2 rounded-full bg-clay-600 text-paper px-8 py-3 text-sm font-medium hover:bg-clay-700 transition-colors"
        >
          Get Started
        </a>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl flex flex-col gap-10">
          {PAIN_POINTS.map((point) => (
            <div key={point.struggle} className="flex flex-col gap-2 text-center">
              <p className="text-base text-stone italic">{point.struggle}</p>
              <p className="text-base text-ink font-medium">{point.response}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <BenefitCard key={benefit.title} {...benefit} />
          ))}
        </div>
      </section>

      <PricingSection />

      <section
        id="join"
        className="flex flex-col items-center gap-6 px-6 pb-24 pt-4 border-t border-mist"
      >
        <div className="flex flex-col items-center gap-2 text-center pt-16">
          <h2 className="text-2xl font-semibold text-ink">
            Your first day starts now
          </h2>
          <p className="text-sm text-stone max-w-sm">
            No pressure, no performance — just a quiet place to begin.
          </p>
        </div>
        <AuthForm />
      </section>
    </main>
  );
}

function Dashboard({ uid }: { uid: string }) {
  const [streak, setStreak] = useState<StreakDoc | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [lessons, setLessons] = useState<LessonDoc[]>([]);
  const [lessonProgress, setLessonProgress] = useState<DailyLessonProgressDoc | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const { signOut } = useAuth();

  const timeZone = profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = dateKeyInTimeZone(new Date(), timeZone);

  useEffect(() => {
    const unsubStreak = subscribeToStreak(uid, setStreak);
    const unsubUser = subscribeToUser(uid, setProfile);
    fetchLessons()
      .then(setLessons)
      .catch(() => setLessons([]));
    return () => {
      unsubStreak();
      unsubUser();
    };
  }, [uid]);

  useEffect(() => {
    return subscribeToLessonProgress(uid, today, setLessonProgress);
  }, [uid, today]);

  const checkedInToday = streak?.lastCheckInDate === today;

  async function handleCheckIn() {
    setCheckingIn(true);
    try {
      await checkIn(uid, timeZone, { type: "custom" });
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleCompleteLesson(lesson: LessonDoc) {
    await completeLesson(uid, timeZone, lesson);
  }

  return (
    <main className="flex-1 flex flex-col items-center gap-6 p-8 bg-ivory">
      <div className="flex flex-col items-center gap-1 text-center pt-4">
        <h1 className="text-2xl font-semibold text-ink">Davar</h1>
        <p className="text-sm text-stone">Your daily walk, one day at a time.</p>
      </div>
      <StreakVisual
        currentCount={streak?.currentCount ?? 0}
        longestCount={streak?.longestCount ?? 0}
        level={profile?.level ?? 1}
        xp={profile?.xp ?? 0}
        checkedInToday={checkedInToday}
        checkingIn={checkingIn}
        onCheckIn={handleCheckIn}
      />
      <LessonsSection
        lessons={lessons}
        completedLessonIds={lessonProgress?.completedLessonIds ?? []}
        isPremium={profile?.tier === "premium"}
        onComplete={handleCompleteLesson}
      />
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-xs text-stone underline"
      >
        Sign out
      </button>
    </main>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-ivory">
        <p className="text-sm text-stone">Loading…</p>
      </main>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <Dashboard uid={user.uid} />;
}
