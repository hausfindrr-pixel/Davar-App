"use client";

import { Avatar } from "@/components/Avatar";

type ProfileButtonProps = {
  avatarId: string | null;
  displayName: string | null;
  onClick: () => void;
};

/** The top-right avatar button that opens the Profile page — standard
 * placement, persistent across every tab (it's not one of the 5). */
export function ProfileButton({ avatarId, displayName, onClick }: ProfileButtonProps) {
  return (
    <button type="button" onClick={onClick} aria-label="Open profile" className="shrink-0">
      <Avatar avatarId={avatarId} displayName={displayName} sizeClass="h-8 w-8" textSizeClass="text-xs" />
    </button>
  );
}
