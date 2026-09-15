"use client";

import { UserIcon } from "@/components/icons";

type ProfileButtonProps = {
  photoURL: string | null;
  onClick: () => void;
};

/** The top-right avatar button that opens the Profile page — standard
 * placement, persistent across every tab (it's not one of the 5). */
export function ProfileButton({ photoURL, onClick }: ProfileButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open profile"
      className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-clay-50 text-clay-600 flex items-center justify-center border border-clay-200"
    >
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element -- external Firebase Storage URL, not worth a next/image remotePatterns entry for a 32px avatar
        <img src={photoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserIcon className="h-4 w-4" />
      )}
    </button>
  );
}
