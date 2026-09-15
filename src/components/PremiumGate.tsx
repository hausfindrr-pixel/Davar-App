"use client";

import { useState } from "react";
import { LockIcon } from "@/components/icons";
import { startCheckout } from "@/lib/plisio/checkout";
import type { PlanId } from "@/lib/plisio/plans";

type UnlockCardProps = {
  title: string;
  description: string;
  getIdToken: () => Promise<string>;
};

/**
 * The consistent "Unlock with Premium" CTA card used by both premium-gated
 * tabs (The Armory, Peter's Watch). Pair it with `blurredPreviewClass`
 * around whatever content should look locked underneath — not a popup,
 * just a clear, honest ask sitting alongside a real (blurred) preview.
 */
export function UnlockCard({ title, description, getIdToken }: UnlockCardProps) {
  const [upgradingPlan, setUpgradingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: PlanId) {
    setError(null);
    setUpgradingPlan(plan);
    try {
      const idToken = await getIdToken();
      await startCheckout(plan, idToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setUpgradingPlan(null);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl bg-paper border border-clay-200 shadow-[0_8px_24px_rgba(58,51,44,0.08)] p-5 flex flex-col items-center gap-3 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-50 text-clay-600">
        <LockIcon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-xs text-stone leading-relaxed">{description}</p>
      </div>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          disabled={upgradingPlan !== null}
          onClick={() => void handleUpgrade("monthly")}
          className="rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {upgradingPlan === "monthly" ? "Redirecting…" : "Unlock — Monthly $6.99"}
        </button>
        <button
          type="button"
          disabled={upgradingPlan !== null}
          onClick={() => void handleUpgrade("yearly")}
          className="rounded-full border border-clay-400 text-clay-700 px-4 py-1.5 text-xs font-medium hover:bg-clay-100/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {upgradingPlan === "yearly" ? "Redirecting…" : "Yearly $59.99"}
        </button>
      </div>
      {error && <p className="text-xs text-clay-700">{error}</p>}
    </div>
  );
}

/** Applied around content that should read as "real, but locked" — dimmed
 * and softly blurred rather than hidden outright, and inert to interaction. */
export const blurredPreviewClass = "pointer-events-none select-none blur-[3px] opacity-50";
