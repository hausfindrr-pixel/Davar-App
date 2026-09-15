"use client";

import { useEffect, useState } from "react";
import { blurredPreviewClass, UnlockCard } from "@/components/PremiumGate";
import { subscribeToAccountabilityLink, subscribeToCheckInHistory } from "@/lib/db/accountability";
import type { AccountabilityLinkDoc, CheckInDoc } from "@/types/firestore";

type WatchTabProps = {
  uid: string;
  isPremium: boolean;
  getIdToken: () => Promise<string>;
};

const CHECK_IN_TYPE_LABEL: Record<CheckInDoc["type"], string> = {
  lesson: "Lesson completed",
  prayer: "Prayer",
  reading: "Reading",
  custom: "Check-in",
};

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Peter's Watch — accountability. Free tier: teaser. Premium: real
 * check-in history (from check_ins) and real accountability-link status
 * (from accountability_links). Partner *matching* — actually finding and
 * pairing you with someone — isn't built yet; this reads/shows a link once
 * one exists rather than pretending to run a matching system. */
export function WatchTab({ uid, isPremium, getIdToken }: WatchTabProps) {
  const [checkIns, setCheckIns] = useState<CheckInDoc[]>([]);
  const [link, setLink] = useState<AccountabilityLinkDoc | null>(null);

  useEffect(() => {
    const unsubHistory = subscribeToCheckInHistory(uid, 10, setCheckIns);
    const unsubLink = subscribeToAccountabilityLink(uid, setLink);
    return () => {
      unsubHistory();
      unsubLink();
    };
  }, [uid]);

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6">
      <div className="text-center max-w-sm">
        <h1 className="text-lg font-semibold text-ink">Peter&apos;s Watch</h1>
        <p className="mt-1 text-xs text-stone leading-relaxed">
          Accountability — a record of your faithfulness, and a partner to
          walk it with.
        </p>
      </div>

      {!isPremium && (
        <UnlockCard
          title="Unlock Peter's Watch"
          description="Get matched with an accountability partner, see your full check-in history, and share encouragement along the way."
          getIdToken={getIdToken}
        />
      )}

      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="rounded-2xl bg-paper border border-mist p-5">
          <h2 className="text-sm font-medium text-ink mb-3">Check-in history</h2>
          <div className={`flex flex-col gap-2.5 ${isPremium ? "" : blurredPreviewClass}`}>
            {checkIns.length === 0 ? (
              <p className="text-xs text-stone">
                No check-ins yet — they&apos;ll show up here as you go.
              </p>
            ) : (
              checkIns.map((checkIn) => (
                <div key={checkIn.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink/80">{CHECK_IN_TYPE_LABEL[checkIn.type]}</span>
                  <span className="text-xs text-stone">{formatDate(checkIn.date)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-paper border border-mist p-5">
          <h2 className="text-sm font-medium text-ink mb-3">Accountability partner</h2>
          {isPremium ? (
            link ? (
              <div className="text-sm text-ink/80">
                <p>
                  {link.status === "active"
                    ? "You're linked with a partner."
                    : link.status === "pending"
                      ? "Invite sent — waiting for a response."
                      : "This link has ended."}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone leading-relaxed">
                No partner yet. Matching is still being built — check back
                soon, and this space will help you find one.
              </p>
            )
          ) : (
            <div className={`flex flex-col gap-2 ${blurredPreviewClass}`}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/80">Matched with a partner</span>
                <span className="text-xs text-stone">Active</span>
              </div>
              <p className="text-xs text-stone">
                Daily check-ins and encouragement, shared between you both.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
