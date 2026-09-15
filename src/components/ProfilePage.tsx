"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, CameraIcon, UserIcon } from "@/components/icons";
import { UnlockCard } from "@/components/PremiumGate";
import { updateHighlightNote, subscribeToHighlights } from "@/lib/db/highlights";
import { updateUserProfile } from "@/lib/db/users";
import type { PlanId } from "@/lib/plisio/plans";
import { uploadProfilePhoto } from "@/lib/storage";
import type { HighlightColor, UserDoc, UserHighlightDoc } from "@/types/firestore";

type ProfilePageProps = {
  uid: string;
  profile: UserDoc | null;
  getIdToken: () => Promise<string>;
  onBack: () => void;
  onSignOut: () => void;
};

const HIGHLIGHT_ACCENT: Record<HighlightColor, string> = {
  clay: "border-clay-400",
  sage: "border-sage-400",
  stone: "border-stone",
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
            You&apos;re missing The Armory, Peter&apos;s Watch, and unlimited daily
            lessons — Premium unlocks the full walk.
          </p>
        </div>
        <UnlockCard
          title="Upgrade to Premium"
          description="Unlock The Armory, Peter's Watch, and unlimited daily lessons."
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

function HighlightNoteCard({ uid, highlight }: { uid: string; highlight: UserHighlightDoc }) {
  const [draft, setDraft] = useState(highlight.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const hasEdited = useRef(false);

  const dirty = draft !== (highlight.notes ?? "");

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateHighlightNote(uid, highlight.book, highlight.chapter, highlight.verse, draft);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`rounded-2xl bg-paper border-l-4 ${HIGHLIGHT_ACCENT[highlight.color]} border-y border-r border-mist p-4 flex flex-col gap-2`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
        {highlight.reference}
      </span>
      <p className="font-serif text-base leading-relaxed text-ink/90">{highlight.text}</p>
      <textarea
        value={draft}
        onChange={(e) => {
          hasEdited.current = true;
          setDraft(e.target.value);
        }}
        placeholder="Add a personal note…"
        rows={2}
        className="w-full rounded-xl border border-mist bg-ivory px-3 py-2 text-sm text-ink placeholder:text-stone/70 resize-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={() => void handleSave()}
          className="rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save note"}
        </button>
        {savedFlash && <span className="text-xs text-sage-700">Saved</span>}
        {error && <span className="text-xs text-clay-700">{error}</span>}
      </div>
    </div>
  );
}

export function ProfilePage({ uid, profile, getIdToken, onBack, onSignOut }: ProfilePageProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSavedFlash, setNameSavedFlash] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<UserHighlightDoc[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return subscribeToHighlights(uid, setHighlights);
  }, [uid]);

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

  const sortedHighlights = useMemo(
    () =>
      [...highlights].sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)),
    [highlights],
  );

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

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const url = await uploadProfilePhoto(uid, file);
      await updateUserProfile(uid, { photoURL: url });
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Could not upload that photo.");
    } finally {
      setPhotoUploading(false);
    }
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
          <div className="h-20 w-20 rounded-full overflow-hidden bg-clay-50 text-clay-600 flex items-center justify-center border border-clay-200">
            {profile?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element -- external Firebase Storage URL
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-9 w-9" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photoUploading}
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-clay-600 text-paper border-2 border-ivory disabled:opacity-60"
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handlePhotoChange(e.target.files?.[0])}
          />
        </div>
        {photoUploading && <p className="text-xs text-stone">Uploading…</p>}
        {photoError && <p className="text-xs text-clay-700">{photoError}</p>}
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

      <div className="w-full max-w-sm flex flex-col gap-3">
        <h2 className="text-sm font-medium text-ink px-1">Highlighted Verses</h2>
        {sortedHighlights.length === 0 ? (
          <div className="rounded-2xl bg-paper border border-mist p-5">
            <p className="text-sm text-stone">
              Verses you highlight in The Word will show up here.
            </p>
          </div>
        ) : (
          sortedHighlights.map((h) => <HighlightNoteCard key={h.id} uid={uid} highlight={h} />)
        )}
      </div>

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
