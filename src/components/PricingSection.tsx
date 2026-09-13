"use client";

import { useState } from "react";

const MONTHLY_PRICE = 12.99;
const YEARLY_PRICE = 129.99;
const YEARLY_SAVINGS_LABEL = "Save 17%";

const FEATURES = [
  "Full gamified lesson library",
  "Accountability partner check-ins",
  "Advanced habit & streak analytics — grace-based, never shaming",
  "The Armory — verse collections grouped by the struggle they target",
  "Community & prayer wall",
];

export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const isYearly = billing === "yearly";

  return (
    <section className="flex flex-col items-center gap-8 px-6 py-24 border-t border-mist">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold text-ink">Davar Premium</h2>
        <p className="text-sm text-stone max-w-sm">
          Everything you need to go deeper, at your own pace.
        </p>
      </div>

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
            {YEARLY_SAVINGS_LABEL}
          </span>
        </button>
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-paper border border-mist p-8 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-semibold tabular-nums text-ink">
              ${isYearly ? YEARLY_PRICE.toFixed(2) : MONTHLY_PRICE.toFixed(2)}
            </span>
            <span className="pb-1 text-sm text-stone">
              /{isYearly ? "year" : "month"}
            </span>
          </div>
          {isYearly && (
            <span className="text-xs font-medium text-sage-700">
              2 months free compared to paying monthly
            </span>
          )}
        </div>

        <ul className="w-full flex flex-col gap-3">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-ink/80">
              <svg viewBox="0 0 20 20" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-sage-600">
                <path
                  d="M4 10.5 8 14l8-8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <a
          href="#join"
          className="w-full rounded-full bg-clay-600 text-paper py-2.5 text-center text-sm font-medium hover:bg-clay-700 transition-colors"
        >
          Get Started
        </a>
      </div>
    </section>
  );
}
