"use client";

import { useState } from "react";
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

const PREMIUM_FEATURES = [
  "Full gamified lesson library",
  "Accountability partner check-ins",
  "Advanced habit & streak analytics — grace-based, never shaming",
  "The Armory — verse collections grouped by the struggle they target",
  "Community & prayer wall",
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-sage-600">
      <path
        d="M4 10.5 8 14l8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PricingSectionProps = {
  onGetStarted: () => void;
};

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const isYearly = billing === "yearly";

  return (
    <section className="flex flex-col items-center gap-8 px-6 py-24 border-t border-mist">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold text-ink">
          Start free, go deeper when you&apos;re ready
        </h2>
        <p className="text-sm text-stone max-w-sm">
          Join others building a daily habit rooted in grace.
        </p>
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
                <CheckIcon />
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

        <div className="rounded-3xl bg-paper border-2 border-clay-400 p-8 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-sm font-medium text-clay-600">Premium</span>

            <div className="flex items-center gap-1 rounded-full border border-mist p-1">
              <button
                type="button"
                onClick={() => setBilling("monthly")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  !isYearly ? "bg-clay-600 text-paper" : "text-stone"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("yearly")}
                className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isYearly ? "bg-clay-600 text-paper" : "text-stone"
                }`}
              >
                Yearly
                <span className="absolute -top-2.5 -right-2.5 rounded-full bg-sage-600 px-2 py-0.5 text-[10px] font-semibold text-paper">
                  Save {YEARLY_SAVINGS_PERCENT}%
                </span>
              </button>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-4xl font-semibold tabular-nums text-ink">
                ${isYearly ? YEARLY_PRICE.toFixed(2) : MONTHLY_PRICE.toFixed(2)}
              </span>
              <span className="pb-1 text-sm text-stone">
                /{isYearly ? "year" : "month"}
              </span>
            </div>
            {isYearly && (
              <span className="text-xs font-medium text-sage-700 -mt-2">
                Save ${YEARLY_SAVINGS_AMOUNT.toFixed(2)} a year compared to paying monthly
              </span>
            )}
          </div>

          <ul className="w-full flex flex-col gap-3">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-ink/80">
                <CheckIcon />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="w-full flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onGetStarted}
              className="w-full rounded-full bg-clay-600 text-paper py-2.5 text-center text-sm font-medium hover:bg-clay-700 transition-colors"
            >
              Start free for 7 days
            </button>
            <span className="text-xs text-stone">
              No charge until your trial ends — cancel anytime.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
