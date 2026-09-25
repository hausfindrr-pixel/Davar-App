"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApostleAvatar } from "@/components/ApostleAvatar";
import { Avatar } from "@/components/Avatar";
import { ArrowLeftIcon, BarChartIcon, CameraIcon } from "@/components/icons";
import { MatthewsLedger } from "@/components/MatthewsLedger";
import { UnlockCard } from "@/components/PremiumGate";
import { updateUserProfile } from "@/lib/db/users";
import { AVATAR_PRESETS } from "@/lib/avatars";
import type { PlanId } from "@/lib/plisio/plans";
import {
  FREE_DAILY_EVENT_LIMIT,
  PREMIUM_DAILY_EVENT_LIMIT,
  type LessonDoc,
  type UserDoc,
} from "@/types/firestore";

type ProfilePageProps = {
  uid: string;
  profile: UserDoc | null;
  lessons: LessonDoc[];
  timeZone: string;
  isPremium: boolean;
  getIdToken: () => Promise<string>;
  onBack: () => void;
  onSignOut: () => void;
  /** Set (with a fresh nonce) to open Matthew's Ledger immediately, e.g.
   * from Today's LedgerShortcut — skips landing on the plain Profile
   * screen first. Same nonce-request pattern as PathFocusRequest. */
  openLedgerRequest?: number | null;
  /** Jumps to The Word tab, open to this book/chapter — bubbled up from
   * the Ledger's "Go to passage" action on a highlighted verse. */
  onNavigateToVerse: (book: string, chapter: number) => void;
};

const PLAN_LABELS: Record<PlanId, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
};

/** "Your Plan" — the free/premium status card. Plisio payments are
 * one-time, not an auto-renewing subscription (see the `premiumUntil`
 * comment in src/types/firestore.ts), so this deliberately says "access
 * through", never "renews on" — that would claim an auto-charge that
 * isn't happening. Falls back to a plain "Premium member" label, with no
 * date, for any grant made before `planId`/a reliable `premiumUntil`
 * existed, rather than guessing. */
function PlanCard({ profile, getIdToken }: { profile: UserDoc | null; getIdToken: () => Promise<string> }) {
  const isPremium = profile?.tier === "premium";

  if (!isPremium) {
    return (
      <div className="w-full max-w-sm flex flex-col gap-3">
        <h2 className="text-sm font-medium text-ink px-1">Your Plan</h2>
        <div className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-2">
          <span className="self-start rounded-full bg-mist text-stone px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
            Free
          </span>
          <p className="text-xs text-stone leading-relaxed">
            You&apos;re missing The Armory, Peter&apos;s Watch, and{" "}
            {PREMIUM_DAILY_EVENT_LIMIT} lessons a day (you get {FREE_DAILY_EVENT_LIMIT} on
            Free) — Premium unlocks the full walk.
          </p>
        </div>
        <UnlockCard
          title="Upgrade to Premium"
          description={`Unlock The Armory, Peter's Watch, and ${PREMIUM_DAILY_EVENT_LIMIT} lessons a day.`}
          getIdToken={getIdToken}
        />
      </div>
    );
  }

  const planLabel = profile?.planId ? PLAN_LABELS[profile.planId] : null;
  const accessThrough = profile?.premiumUntil
    ? `Access through ${profile.premiumUntil.toDate().toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`
    : null;

  return (
    <div className="w-full max-w-sm flex flex-col gap-3">
      <h2 className="text-sm font-medium text-ink px-1">Your Plan</h2>
      <div className="rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-1.5">
        <span className="self-start rounded-full bg-clay-600 text-paper px-2.5 py-0.5 text-[11px] font-medium tracking-wide mb-0.5">
          Premium
        </span>
        {planLabel && <p className="text-sm text-ink/80">{planLabel} plan</p>}
        {accessThrough && <p className="text-xs text-stone">{accessThrough}</p>}
        {!planLabel && !accessThrough && <p className="text-sm text-ink/80">Premium member</p>}
      </div>
    </div>
  );
}

export function ProfilePage({
  uid,
  profile,
  lessons,
  timeZone,
  isPremium,
  getIdToken,
  onBack,
  onSignOut,
  openLedgerRequest = null,
  onNavigateToVerse,
}: ProfilePageProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSavedFlash, setNameSavedFlash] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showLedger, setShowLedger] = useState(false);
  // Which openLedgerRequest (by nonce) has already been applied — same
  // "adjust state during render" pattern as PathEventList's focusRequest.
  const [handledLedgerRequestNonce, setHandledLedgerRequestNonce] = useState<number | null>(null);

  if (openLedgerRequest !== null && openLedgerRequest !== handledLedgerRequestNonce) {
    setHandledLedgerRequestNonce(openLedgerRequest);
    if (!showLedger) setShowLedger(true);
  }

  // Only adopt the server value once, when it first arrives — after that
  // the input is the user's to edit without the live subscription
  // overwriting what they're mid-typing.
  const adoptedRef = useRef(false);
  useEffect(() => {
    if (!adoptedRef.current && profile) {
      setDisplayName(profile.displayName ?? "");
      adoptedRef.current = true;
    }
  }, [profile]);

  async function handleSaveName() {
    setNameSaving(true);
    setNameError(null);
    try {
      await updateUserProfile(uid, { displayName: displayName.trim() });
      setNameSavedFlash(true);
      setTimeout(() => setNameSavedFlash(false), 1500);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : "Could not save your name.");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleSelectAvatar(avatarId: string) {
    setAvatarSaving(avatarId);
    setAvatarError(null);
    try {
      await updateUserProfile(uid, { avatarId });
      setAvatarPickerOpen(false);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Could not save that avatar.");
    } finally {
      setAvatarSaving(null);
    }
  }

  if (showLedger) {
    return (
      <MatthewsLedger
        uid={uid}
        timeZone={timeZone}
        isPremium={isPremium}
        lessons={lessons}
        getIdToken={getIdToken}
        onBack={() => setShowLedger(false)}
        onNavigateToVerse={onNavigateToVerse}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <div className="w-full max-w-sm flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-full text-stone hover:bg-mist/40 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-ink">Profile</h1>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <Avatar
            avatarId={profile?.avatarId}
            displayName={profile?.displayName}
            sizeClass="h-20 w-20"
            textSizeClass="text-xl"
            iconClass="h-9 w-9"
          />
          <button
            type="button"
            onClick={() => setAvatarPickerOpen((open) => !open)}
            aria-label="Choose avatar"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-clay-600 text-paper border-2 border-ivory"
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        {avatarError && <p className="text-xs text-clay-700">{avatarError}</p>}

        {avatarPickerOpen && (
          <div className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-4 grid grid-cols-5 gap-3">
            {AVATAR_PRESETS.map((preset) => {
              const Icon = preset.Icon;
              const selected = profile?.avatarId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-label={preset.label}
                  disabled={avatarSaving !== null}
                  onClick={() => void handleSelectAvatar(preset.id)}
                  className={`h-11 w-11 rounded-full overflow-hidden border-2 flex items-center justify-center ${preset.bgClass} ${preset.iconClass} disabled:opacity-60 ${
                    selected ? "border-clay-600" : preset.borderClass
                  }`}
                >
                  {avatarSaving === preset.id ? (
                    <span className="text-[10px]">…</span>
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink placeholder:text-stone/70"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={nameSaving || displayName.trim() === (profile?.displayName ?? "")}
            onClick={() => void handleSaveName()}
            className="rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nameSaving ? "Saving…" : "Save name"}
          </button>
          {nameSavedFlash && <span className="text-xs text-sage-700">Saved</span>}
          {nameError && <span className="text-xs text-clay-700">{nameError}</span>}
        </div>
      </div>

      <PlanCard profile={profile} getIdToken={getIdToken} />

      <button
        type="button"
        onClick={() => setShowLedger(true)}
        className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-4 flex items-center gap-3 text-left hover:bg-mist/20 transition-colors"
      >
        <ApostleAvatar apostleId="matthew" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">Matthew&apos;s Ledger</h2>
          <p className="text-xs text-stone">(Archives) — your lessons, prayers, and highlighted verses, kept</p>
        </div>
      </button>

      {/* Only ever rendered for the one account with isAdmin: true (see
          UserDoc, src/types/firestore.ts) — a UI convenience, not the
          security boundary: /admin itself re-verifies this server-side
          (verifyAdminSession, src/lib/admin/session.ts) regardless of
          whether this link is ever shown or hidden. isAdmin is locked from
          client writes in firestore.rules, so a non-admin can't make this
          appear by editing their own profile doc. */}
      {profile?.isAdmin ? (
        <Link
          href="/admin"
          className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-4 flex items-center gap-3 text-left hover:bg-mist/20 transition-colors"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dusk-50 text-dusk-600">
            <BarChartIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">Admin Dashboard</h2>
            <p className="text-xs text-stone">Signups, revenue, and usage — visible only to you</p>
          </div>
        </Link>
      ) : null}

      <button
        type="button"
        onClick={onSignOut}
        className="text-xs text-stone underline mt-2"
      >
        Sign out
      </button>
    </div>
  );
}
