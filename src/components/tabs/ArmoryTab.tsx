"use client";

import { useState } from "react";
import { blurredPreviewClass, UnlockCard } from "@/components/PremiumGate";
import { ARMORY_CATEGORIES, type ArmoryCategoryId } from "@/lib/armory";

type ArmoryTabProps = {
  isPremium: boolean;
  getIdToken: () => Promise<string>;
};

/** The Armory — "the sword of the Spirit" (Ephesians 6:17), scripture
 * grouped by struggle. Free tier sees every category name and description
 * crisp, but the verses themselves blurred, with an Unlock CTA; Premium
 * sees it all, no blur, no CTA. */
export function ArmoryTab({ isPremium, getIdToken }: ArmoryTabProps) {
  const [openCategory, setOpenCategory] = useState<ArmoryCategoryId | null>(
    ARMORY_CATEGORIES[0].id,
  );

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-lg font-semibold text-ink">The Armory</h1>
        <p className="mt-1 text-xs text-stone leading-relaxed">
          &ldquo;The sword of the Spirit, which is the word of God&rdquo;
          (Ephesians 6:17) — scripture grouped by the struggle it meets.
        </p>
      </div>

      {!isPremium && (
        <UnlockCard
          title="Unlock the full Armory"
          description="Every category, every verse — scripture for the exact struggle in front of you, whenever you need it."
          getIdToken={getIdToken}
        />
      )}

      <div className="w-full max-w-sm flex flex-col gap-3">
        {ARMORY_CATEGORIES.map((category) => {
          const isOpen = openCategory === category.id;
          return (
            <div
              key={category.id}
              className="rounded-2xl bg-paper border border-mist overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : category.id)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <h2 className="text-base font-semibold text-ink">{category.name}</h2>
                  <p className="text-xs text-stone mt-0.5">{category.description}</p>
                </div>
                <span className="text-stone text-xs shrink-0">{isOpen ? "–" : "+"}</span>
              </button>

              {isOpen && (
                <div
                  className={`flex flex-col gap-3 px-5 pb-5 ${isPremium ? "" : blurredPreviewClass}`}
                >
                  {category.verses.map((verse) => (
                    <div key={verse.reference} className="border-t border-mist pt-3 first:border-t-0 first:pt-0">
                      <span className="text-xs font-medium uppercase tracking-wide text-clay-600">
                        {verse.reference}
                      </span>
                      <p className="text-sm text-ink/80 leading-relaxed mt-1">{verse.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
