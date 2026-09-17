"use client";

import { useState } from "react";
import { BarChartIcon, BookOpenIcon, CheckIcon, CompassIcon, UsersIcon } from "@/components/icons";
import { SecureCheckoutNote } from "@/components/PremiumGate";
import { FREE_DAILY_LESSON_LIMIT } from "@/types/firestore";

const MONTHLY_PRICE = 6.99;
const YEARLY_PRICE = 59.99;
const YEARLY_SAVINGS_AMOUNT = MONTHLY_PRICE * 12 - YEARLY_PRICE;
const YEARLY_SAVINGS_PERCENT = Math.round(
  (YEARLY_SAVINGS_AMOUNT / (MONTHLY_PRICE * 12)) * 100,
);

const FREE_FEATURES = [
  `${FREE_DAILY_LESSON_LIMIT} gamified scripture lessons per day`,
  "Daily Bible verse, always available",
  "Basic streak tracking",
];

const PREMIUM_FEATURE_ROWS = [
  {
    icon: BookOpenIcon,
    title: "The Armory",
    copy: "Scripture for lust, anger, envy, or fear — the sword of the Spirit for the struggle in front of you. (Ephesians 6:17)",
  },
  {
    icon: CompassIcon,
    title: "Unlimited daily lessons",
    copy: "Go beyond the free tier's 3-per-day cap and follow your curiosity.",
  },
  {
    icon: UsersIcon,
    title: "Accountability matching",
    copy: "Find a steady partner who brings support, not judgment.",
  },
  {
    icon: BarChartIcon,
    title: "Progress analytics",
    copy: "See your growth and keep a meaningful history of your streaks — grace-based, never shaming.",
  },
];

type PricingSectionProps = {
  onGetStarted: () => void;
};

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const isYearly = billing === "yearly";

  return (
    <section className="flex flex-col items-center gap-8 px-6 py-24 border-t border-mist">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sage-600">
          choose your rhythm
        </p>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink">
          Start free, go deeper when you&apos;re ready
        </h2>
        <p className="text-sm text-stone max-w-sm">
          Join others building a daily habit rooted in grace.
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-full bg-mist p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setBilling("monthly")}
          className={`rounded-full px-5 py-2.5 transition-colors ${
            !isYearly ? "bg-paper text-ink shadow-sm" : "text-stone"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBilling("yearly")}
          className={`rounded-full px-5 py-2.5 transition-colors ${
            isYearly ? "bg-paper text-ink shadow-sm" : "text-stone"
          }`}
        >
          Yearly <span className="text-sage-600">save {YEARLY_SAVINGS_PERCENT}%</span>
        </button>
      </div>

      <div className="w-full max-w-3xl grid gap-5 sm:grid-cols-2 items-start">
        <div className="rounded-3xl bg-paper border border-mist p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-sm font-medium text-stone">Free</span>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-semibold tabular-nums text-ink">$0</span>
            </div>
            <span className="text-xs text-stone">No card required</span>
          </div>

          <ul className="w-full flex flex-col gap-3">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink/80">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-stone text-center">
            No accountability partner, Armory access, or advanced analytics —
            those stay in Premium.
          </p>

          <button
            type="button"
            onClick={onGetStarted}
            className="w-full rounded-full border border-mist py-2.5 text-center text-sm font-medium text-ink hover:bg-mist/40 transition-colors"
          >
            Get Started
          </button>
        </div>

        <div className="rounded-3xl bg-sage-700 p-8 flex flex-col gap-6 shadow-[0_15px_35px_rgba(92,107,62,0.18)]">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/65">
              Premium
            </span>
            <span className="rounded-full bg-clay-600 px-2.5 py-1 text-[10px] font-bold text-paper">
              {isYearly ? `$${YEARLY_PRICE.toFixed(2)} / yr` : `$${MONTHLY_PRICE.toFixed(2)} / mo`}
            </span>
          </div>

          <div>
            <h3 className="font-serif text-3xl text-paper">The full walk</h3>
            {isYearly && (
              <p className="mt-1 text-xs font-medium text-paper/70">
                Save ${YEARLY_SAVINGS_AMOUNT.toFixed(2)} a year compared to paying monthly
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {PREMIUM_FEATURE_ROWS.map(({ icon: Icon, title, copy }) => (
              <div key={title} className="flex gap-2.5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper/15 text-clay-200">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-[13px] leading-5 text-paper/85">
                  <strong className="font-semibold text-paper">{title}.</strong> {copy}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full rounded-full bg-clay-600 text-paper py-2.5 text-center text-sm font-medium hover:bg-clay-700 transition-colors"
            >
              Start your walk
            </button>
            <SecureCheckoutNote />
          </div>
        </div>
      </div>
    </section>
  );
}
