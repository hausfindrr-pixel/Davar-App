"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ApostleAvatar } from "@/components/ApostleAvatar";
import { AuthForm } from "@/components/AuthForm";
import { BottomTabBar, type TabId } from "@/components/BottomTabBar";
import { CompassIcon, FlameIcon, UsersIcon } from "@/components/icons";
import { PricingSection } from "@/components/PricingSection";
import { ProfileButton } from "@/components/ProfileButton";
import { ProfilePage } from "@/components/ProfilePage";
import { ArmoryTab } from "@/components/tabs/ArmoryTab";
import { DisciplesTab } from "@/components/tabs/DisciplesTab";
import { PathTab } from "@/components/tabs/PathTab";
import { TodayTab } from "@/components/tabs/TodayTab";
import { WatchTab } from "@/components/tabs/WatchTab";
import { WordTab } from "@/components/tabs/WordTab";
import { pickApostleMoment } from "@/lib/apostle-moment";
import { APOSTLES, type ApostleId } from "@/lib/apostles";
import { useAuth } from "@/lib/auth-context";
import { completeLesson, fetchLessons, subscribeToLessonProgress } from "@/lib/db/lessons";
import { checkIn, subscribeToStreak } from "@/lib/db/streaks";
import { subscribeToUser } from "@/lib/db/users";
import { dateKeyInTimeZone, daysBetweenKeys } from "@/lib/date";
import { visibleLessonsForFreeTier } from "@/lib/lessons";
import { daysUntilExpiry, shouldShowRenewalReminder } from "@/lib/premium";
import { startCheckout } from "@/lib/plisio/checkout";
import type { PlanId } from "@/lib/plisio/plans";
import type {
  DailyLessonProgressDoc,
  LessonDoc,
  StreakDoc,
  UserDoc,
} from "@/types/firestore";

/** Three pain points, each paired with the specific next step Davar offers
 * — not just naming the struggle, but answering it. The first leads with
 * temptation (worded generally, no explicit language) since it's this
 * app's core value prop; the other two carry what earlier drafts split
 * out into separate "benefit" cards (growth, judgment-free support). */
const PAIN_POINTS = [
  {
    icon: FlameIcon,
    struggle: "Stuck in a cycle",
    body: "Lust and temptation can make tomorrow feel like a promise you've already broken. You are not disqualified by the pattern.",
    nextStep: "Davar gives you a next faithful step.",
  },
  {
    icon: CompassIcon,
    struggle: "Wanting to grow, unsure where to start",
    body: "When spiritual growth feels like a shelf of unread books, even opening one can feel overwhelming.",
    nextStep: "Davar makes the first lesson small and clear.",
  },
  {
    icon: UsersIcon,
    struggle: "Accountability that feels like judgment",
    body: "You need honesty without shame — someone who can sit with the truth and still help you keep walking.",
    nextStep: "Davar pairs support with grace.",
  },
];

const COMPANION_ORDER: ApostleId[] = ["peter", "matthew", "john", "thomas"];

const SCREEN_COUNT = 5;

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-600">
      {children}
    </p>
  );
}

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

/** A companion's portrait image, once provided (public/apostles/{id}.png) —
 * falls back to their existing icon avatar if the image isn't there yet or
 * fails to load, so this screen never looks broken in the meantime. */
function CompanionPortrait({ apostleId }: { apostleId: ApostleId }) {
  const [imgError, setImgError] = useState(false);
  const apostle = APOSTLES[apostleId];

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-mist">
      {!imgError ? (
        <Image
          src={`/apostles/${apostleId}.png`}
          alt={`${apostle.name}, a Davar companion`}
          fill
          sizes="(min-width: 640px) 200px, 45vw"
          className="object-cover object-top"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ApostleAvatar apostleId={apostleId} size="lg" />
        </div>
      )}
    </div>
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
      <header className="flex items-center justify-between px-6 pt-5 shrink-0">
        <Image src="/icons/icon-192.png" alt="Davar" width={192} height={192} className="h-8 w-8 rounded-full" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sage-600">
          {activeScreen + 1} / {SCREEN_COUNT}
        </span>
      </header>

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
        <section className="animate-fade-in w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col items-center justify-center text-center gap-5 px-6 py-12">
          <div className="mb-2 flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-[2.25rem] border border-clay-200 bg-clay-50 shadow-[0_18px_45px_rgba(92,107,62,0.08)]">
            <Image
              src="/logo.svg"
              alt="Davar"
              width={380}
              height={430}
              priority
              className="w-24 sm:w-28 h-auto"
            />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl leading-tight tracking-tight text-ink max-w-md">
            A daily rhythm of Scripture, prayer, and grace.
          </h1>
          <p className="max-w-sm text-sm text-ink/65">
            Make space for the Word, one faithful moment at a time.
          </p>
          <button
            type="button"
            onClick={goToSignUp}
            className="mt-2 rounded-full bg-clay-600 text-paper px-8 py-3 text-sm font-medium hover:bg-clay-700 transition-colors"
          >
            Get Started
          </button>
        </section>

        {/* Screen 2 — the pain points, each answered by what Davar gives */}
        <section className="animate-fade-in w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col justify-center px-6 py-12">
          <div className="mx-auto w-full max-w-xl">
            <div className="mb-6 text-center">
              <Eyebrow>you are not alone here</Eyebrow>
              <h1 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight tracking-tight text-ink">
                A different way to meet the hard parts.
              </h1>
            </div>
            <div className="space-y-3">
              {PAIN_POINTS.map(({ icon: Icon, struggle, body, nextStep }) => (
                <article
                  key={struggle}
                  className="rounded-2xl border-l-4 border-clay-400 bg-paper/70 px-4 py-3"
                >
                  <div className="flex gap-3">
                    <Icon className="mt-1 h-4.5 w-4.5 shrink-0 text-clay-600" />
                    <div>
                      <h2 className="font-serif text-lg text-ink">{struggle}</h2>
                      <p className="mt-1 text-xs leading-5 text-ink/65">{body}</p>
                      <p className="mt-1 text-[11px] font-semibold text-sage-700">{nextStep}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Screen 3 — grace, before we get to companions or pricing */}
        <section className="animate-fade-in w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col items-center justify-center text-center gap-4 px-6 py-12">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-50 text-sage-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path
                d="M4 5.5c2.5-1 5-1 8 .3 3-1.3 5.5-1.3 8-.3v13c-2.5-1-5-1-8 .3-3-1.3-5.5-1.3-8-.3v-13Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path d="M12 5.8v13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <Eyebrow>you are not alone here</Eyebrow>
          <h1 className="max-w-2xl font-serif text-3xl sm:text-4xl leading-tight tracking-tight text-ink">
            Still finding yourself in the same struggle?
          </h1>
          <p className="max-w-lg text-[15px] leading-7 text-ink/70">
            Whether it&apos;s lust, isolation, or simply losing your rhythm, you
            don&apos;t have to carry the weight of it in silence. Falling short
            doesn&apos;t disqualify you from coming close.
          </p>
          <div className="mt-2 h-px w-14 bg-clay-400" />
          <p className="max-w-md font-serif text-xl leading-8 text-sage-700">
            Davar meets you with grace — and gives you a way to begin again,
            today.
          </p>
        </section>

        {/* Screen 4 — meet the four apostle companions */}
        <section className="animate-fade-in w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col items-center justify-center gap-6 px-6 py-12">
          <div className="text-center">
            <Eyebrow>walk with us</Eyebrow>
            <h1 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight tracking-tight text-ink">
              Meet your companions.
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-ink/65">
              Four steady voices for the road ahead.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:mx-auto sm:max-w-xl sm:gap-5">
            {COMPANION_ORDER.map((apostleId) => {
              const apostle = APOSTLES[apostleId];
              return (
                <article
                  key={apostleId}
                  className="rounded-[1.375rem] bg-paper/70 p-3 shadow-[0_10px_28px_rgba(92,107,62,0.09)] sm:p-4"
                >
                  <CompanionPortrait apostleId={apostleId} />
                  <h2 className="mt-3 font-serif text-xl text-ink">{apostle.name}</h2>
                  <p className="mt-1 text-[11px] leading-4 text-ink/60">{apostle.role}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Screen 5 — pricing + sign up */}
        <section className="animate-fade-in w-full h-full shrink-0 snap-start overflow-y-auto flex flex-col">
          <PricingSection onGetStarted={goToSignUp} />
          <div
            id="join"
            ref={joinRef}
            className="flex flex-col items-center gap-6 px-6 pb-16 pt-4 border-t border-mist"
          >
            <div className="flex flex-col items-center gap-2 text-center pt-10">
              <h2 className="font-serif text-3xl text-ink">Come as you are.</h2>
              <p className="text-sm text-stone max-w-sm">
                Pick up your daily rhythm of Scripture, prayer, and grace — no
                pressure, no performance, just a quiet place to begin.
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
  const [activeTab, setActiveTab] = useState<TabId>("today");
  const [showProfile, setShowProfile] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);
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
  const showRenewalReminder = shouldShowRenewalReminder(isPremium, profile?.premiumUntil ?? null);
  const daysUntilPremiumEnds = daysUntilExpiry(profile?.premiumUntil ?? null);

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
  const apostleMoment = profile
    ? pickApostleMoment({
        uid,
        today,
        checkedInToday,
        currentStreak: streak?.currentCount ?? 0,
        longestStreak: streak?.longestCount ?? 0,
        xp: profile.xp,
        level: profile.level,
      })
    : null;

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

  async function getIdToken(): Promise<string> {
    if (!user) throw new Error("Sign in required.");
    return user.getIdToken();
  }

  async function handleUpgrade(plan: PlanId) {
    if (!user) return;
    await startCheckout(plan, await getIdToken());
  }

  // Renews the same plan the user is already on (falling back to monthly
  // for a legacy grant with no planId recorded) — a fresh Plisio invoice,
  // same checkout flow as everywhere else, just pre-picked rather than
  // asking them to choose again.
  async function handleRenew() {
    setRenewing(true);
    setRenewError(null);
    try {
      await handleUpgrade(profile?.planId ?? "monthly");
    } catch (err) {
      setRenewError(err instanceof Error ? err.message : "Could not start checkout.");
      setRenewing(false);
    }
  }

  return (
    <main className="h-dvh flex flex-col bg-ivory overflow-hidden">
      <header className="shrink-0 flex flex-col items-center gap-1 text-center pt-4 px-6">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-ink">Davar</h1>
            {isPremium && (
              <span className="rounded-full bg-clay-600 text-paper px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
                Premium
              </span>
            )}
          </div>
          <ProfileButton photoURL={profile?.photoURL ?? null} onClick={() => setShowProfile(true)} />
        </div>
      </header>

      {justUpgraded && (
        <div
          className={`shrink-0 mx-6 mt-3 rounded-2xl border p-4 text-center text-sm ${
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

      {showRenewalReminder && (
        <div className="shrink-0 mx-6 mt-3 rounded-2xl border border-clay-200 bg-clay-50 p-4 text-center text-sm text-ink/80">
          <p>
            Your Premium access ends in {daysUntilPremiumEnds}{" "}
            {daysUntilPremiumEnds === 1 ? "day" : "days"} — renew to keep it.
          </p>
          <button
            type="button"
            disabled={renewing}
            onClick={() => void handleRenew()}
            className="mt-2 rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {renewing ? "Redirecting…" : "Renew now"}
          </button>
          {renewError && <p className="mt-2 text-xs text-clay-700">{renewError}</p>}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {showProfile ? (
          <ProfilePage
            uid={uid}
            profile={profile}
            getIdToken={getIdToken}
            onBack={() => setShowProfile(false)}
            onSignOut={() => void signOut()}
          />
        ) : (
          <>
            {activeTab === "today" && (
              <TodayTab
                currentCount={streak?.currentCount ?? 0}
                longestCount={streak?.longestCount ?? 0}
                level={profile?.level ?? 1}
                xp={profile?.xp ?? 0}
                checkedInToday={checkedInToday}
                checkingIn={checkingIn}
                onCheckIn={handleCheckIn}
                apostleMoment={apostleMoment}
              />
            )}
            {activeTab === "path" && (
              <PathTab
                uid={uid}
                timeZone={timeZone}
                lessons={visibleLessons}
                completedLessonIds={lessonProgress?.completedLessonIds ?? []}
                isPremium={isPremium}
                suppressUpgradeNag={justUpgraded && !isPremium}
                onComplete={handleCompleteLesson}
                onUpgrade={handleUpgrade}
              />
            )}
            {activeTab === "armory" && <ArmoryTab isPremium={isPremium} getIdToken={getIdToken} />}
            {activeTab === "watch" && (
              <WatchTab
                uid={uid}
                isPremium={isPremium}
                today={today}
                timeZone={timeZone}
                getIdToken={getIdToken}
              />
            )}
            {activeTab === "word" && <WordTab uid={uid} />}
            {activeTab === "disciples" && <DisciplesTab />}
          </>
        )}
      </div>

      {!showProfile && <BottomTabBar active={activeTab} onSelect={setActiveTab} />}
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
