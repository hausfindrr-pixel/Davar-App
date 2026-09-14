"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AuthForm } from "@/components/AuthForm";
import { BenefitCarousel } from "@/components/BenefitCarousel";
import { LessonsSection } from "@/components/LessonsSection";
import { PricingSection } from "@/components/PricingSection";
import { StreakVisual } from "@/components/StreakVisual";
import { useAuth } from "@/lib/auth-context";
import { completeLesson, fetchLessons, subscribeToLessonProgress } from "@/lib/db/lessons";
import { checkIn, subscribeToStreak } from "@/lib/db/streaks";
import { subscribeToUser } from "@/lib/db/users";
import { dateKeyInTimeZone, daysBetweenKeys } from "@/lib/date";
import { visibleLessonsForFreeTier } from "@/lib/lessons";
import { startCheckout } from "@/lib/plisio/checkout";
import type { PlanId } from "@/lib/plisio/plans";
import type {
  DailyLessonProgressDoc,
  LessonDoc,
  StreakDoc,
  UserDoc,
} from "@/types/firestore";

/** The single strongest pain point, condensed to one short line each — this
 * app's core value prop (grace-centered accountability). The other two
 * pain points from earlier drafts (spiritual direction, judgment-free
 * community) are already carried by the "Scripture, made daily" and "A
 * community that gets it" benefit cards below. */
const PAIN_POINT = {
  struggle: "Stuck in a cycle you can't seem to break?",
  response: "Grace, not shame — accountability that moves you forward.",
};

const BENEFITS = [
  {
    title: "Freedom through grace",
    description: "Daily, grace-centered accountability — never shame, always forward.",
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
    description: "Streaks, XP, and levels make consistency feel good.",
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
    description: "Encouragement that keeps you coming back — no guilt trips.",
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
    description: "A judgment-free accountability partner, always in your corner.",
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
];

const SCREEN_COUNT = 4;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LandingPage() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLDivElement>(null);
  const [activeScreen, setActiveScreen] = useState(0);

  function goToScreen(index: number) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: index * scroller.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    setActiveScreen(Math.round(scroller.scrollLeft / scroller.clientWidth));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") goToScreen(Math.min(SCREEN_COUNT - 1, activeScreen + 1));
    if (event.key === "ArrowLeft") goToScreen(Math.max(0, activeScreen - 1));
  }

  function goToSignUp() {
    goToScreen(SCREEN_COUNT - 1);
    // Runs on the pricing screen's own vertical scroller, independent of
    // the horizontal one above — both can animate at once.
    joinRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="h-dvh flex flex-col bg-ivory overflow-hidden">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Introduction"
        className="flex-1 min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory snap-always scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus:outline-none"
      >
        {/* Screen 1 — hero */}
        <section className="w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col items-center justify-center text-center gap-5 px-6 py-12">
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
          <button
            type="button"
            onClick={goToSignUp}
            className="mt-2 rounded-full bg-clay-600 text-paper px-8 py-3 text-sm font-medium hover:bg-clay-700 transition-colors"
          >
            Get Started
          </button>
        </section>

        {/* Screen 2 — the one pain point that matters most */}
        <section className="w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col items-center justify-center text-center gap-4 px-6 py-12">
          <p className="text-xl sm:text-2xl text-stone italic max-w-sm">
            {PAIN_POINT.struggle}
          </p>
          <p className="text-xl sm:text-2xl text-ink font-semibold max-w-sm">
            {PAIN_POINT.response}
          </p>
        </section>

        {/* Screen 3 — benefits, swipeable */}
        <section className="w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col items-center justify-center gap-6 py-12">
          <h2 className="text-xl font-semibold text-ink px-6 text-center">
            Built for the walk, not just the win
          </h2>
          <BenefitCarousel benefits={BENEFITS} />
        </section>

        {/* Screen 4 — pricing + sign up */}
        <section className="w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col">
          <PricingSection onGetStarted={goToSignUp} />
          <div
            id="join"
            ref={joinRef}
            className="flex flex-col items-center gap-6 px-6 pb-16 pt-4 border-t border-mist"
          >
            <div className="flex flex-col items-center gap-2 text-center pt-10">
              <h2 className="text-2xl font-semibold text-ink">Your first day starts now</h2>
              <p className="text-sm text-stone max-w-sm">
                No pressure, no performance — just a quiet place to begin.
              </p>
            </div>
            <AuthForm />
          </div>
        </section>
      </div>

      <div className="flex items-center justify-center gap-4 py-4 shrink-0">
        <button
          type="button"
          aria-label="Previous screen"
          disabled={activeScreen === 0}
          onClick={() => goToScreen(activeScreen - 1)}
          className="text-stone disabled:opacity-0 transition-opacity"
        >
          <ChevronIcon direction="left" />
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: SCREEN_COUNT }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to screen ${i + 1}`}
              onClick={() => goToScreen(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeScreen ? "w-6 bg-clay-600" : "w-2 bg-mist"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next screen"
          disabled={activeScreen === SCREEN_COUNT - 1}
          onClick={() => goToScreen(activeScreen + 1)}
          className="text-stone disabled:opacity-0 transition-opacity"
        >
          <ChevronIcon direction="right" />
        </button>
      </div>
    </main>
  );
}

function Dashboard({ uid }: { uid: string }) {
  const [streak, setStreak] = useState<StreakDoc | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [lessons, setLessons] = useState<LessonDoc[]>([]);
  const [lessonProgress, setLessonProgress] = useState<DailyLessonProgressDoc | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const { user, signOut } = useAuth();
  const searchParams = useSearchParams();
  const justUpgraded = searchParams.get("upgraded") === "1";

  const timeZone = profile?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = dateKeyInTimeZone(new Date(), timeZone);
  const isPremium = profile?.tier === "premium";
  const dayIndex = profile?.createdAt
    ? daysBetweenKeys(dateKeyInTimeZone(profile.createdAt.toDate(), timeZone), today)
    : 0;
  const visibleLessons = isPremium ? lessons : visibleLessonsForFreeTier(lessons, dayIndex);

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

  async function handleUpgrade(plan: PlanId) {
    if (!user) return;
    const idToken = await user.getIdToken();
    await startCheckout(plan, idToken);
  }

  return (
    <main className="flex-1 flex flex-col items-center gap-6 p-8 bg-ivory">
      <div className="flex flex-col items-center gap-1 text-center pt-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-ink">Davar</h1>
          {isPremium && (
            <span className="rounded-full bg-clay-600 text-paper px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
              Premium
            </span>
          )}
        </div>
        <p className="text-sm text-stone">Your daily walk, one day at a time.</p>
      </div>

      {justUpgraded && (
        <div
          className={`w-full max-w-sm rounded-2xl border p-4 text-center text-sm ${
            isPremium
              ? "bg-sage-50 border-sage-200 text-sage-700"
              : "bg-paper border-mist text-stone"
          }`}
        >
          {isPremium
            ? "You're Premium — unlimited daily lessons and the full library are unlocked."
            : "Payment received — your upgrade is confirming on the network. This can take a few minutes; this page will update on its own, no need to refresh."}
        </div>
      )}

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
        lessons={visibleLessons}
        completedLessonIds={lessonProgress?.completedLessonIds ?? []}
        isPremium={isPremium}
        suppressUpgradeNag={justUpgraded && !isPremium}
        onComplete={handleCompleteLesson}
        onUpgrade={handleUpgrade}
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

  return (
    <Suspense
      fallback={
        <main className="flex-1 flex items-center justify-center bg-ivory">
          <p className="text-sm text-stone">Loading…</p>
        </main>
      }
    >
      <Dashboard uid={user.uid} />
    </Suspense>
  );
}
