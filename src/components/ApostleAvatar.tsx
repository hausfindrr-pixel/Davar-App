import type { JSX } from "react";
import type { ApostleId } from "@/lib/apostles";

type ApostleAvatarProps = {
  apostleId: ApostleId;
  size?: "sm" | "md";
};

const SIZE_CLASSES: Record<NonNullable<ApostleAvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

const ICON_SIZE_CLASSES: Record<NonNullable<ApostleAvatarProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
};

// Same restrained clay/sage/neutral palette as the rest of the app — no new
// hues — the apostles are told apart by icon glyph, not by color-coding.
const BADGE_CLASSES: Record<ApostleId, string> = {
  peter: "bg-clay-50 text-clay-600",
  matthew: "bg-sage-50 text-sage-600",
  john: "bg-clay-50 text-clay-400",
  thomas: "bg-mist text-stone",
};

/** A key — "keys of the kingdom" (Matthew 16:19), Peter given responsibility after restoration. */
function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M10.3 10.3 19 19M15.3 14.7l2.2-2.2M17.8 17.2l2-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A ledger — Matthew the tax collector, precise record-keeping. */
function LedgerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8 9h8M8 13h8M8 17h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A heart — John's warmth, "abide in love." */
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 20s-7-4.35-7-9.5C5 7.5 7 6 9 6c1.3 0 2.4.7 3 1.8.6-1.1 1.7-1.8 3-1.8 2 0 4 1.5 4 4.5 0 5.15-7 9.5-7 9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** An eye — Thomas needing to see before he believed (John 20:29). */
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

const ICONS: Record<ApostleId, (props: { className?: string }) => JSX.Element> = {
  peter: KeyIcon,
  matthew: LedgerIcon,
  john: HeartIcon,
  thomas: EyeIcon,
};

export function ApostleAvatar({ apostleId, size = "md" }: ApostleAvatarProps) {
  const Icon = ICONS[apostleId];
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center ${SIZE_CLASSES[size]} ${BADGE_CLASSES[apostleId]}`}
    >
      <Icon className={ICON_SIZE_CLASSES[size]} />
    </div>
  );
}
