import { UserIcon } from "@/components/icons";
import { avatarPresetById, initialsFrom } from "@/lib/avatars";

type AvatarProps = {
  avatarId: string | null | undefined;
  displayName: string | null | undefined;
  /** Sizing classes for the circle itself, e.g. "h-8 w-8". */
  sizeClass: string;
  /** Font size for the initials fallback, e.g. "text-xs". */
  textSizeClass?: string;
  /** Size of the glyph/icon, relative to the circle — defaults to half. */
  iconClass?: string;
};

/** The user's profile avatar, wherever it appears — a chosen preset
 * (symbol on a colored background), or their initials, or a generic
 * person glyph if neither is available yet. No photo upload: see
 * src/lib/avatars.ts. */
export function Avatar({ avatarId, displayName, sizeClass, textSizeClass = "text-sm", iconClass = "h-1/2 w-1/2" }: AvatarProps) {
  const preset = avatarPresetById(avatarId);

  if (preset) {
    const Icon = preset.Icon;
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden border flex items-center justify-center ${preset.bgClass} ${preset.iconClass} ${preset.borderClass}`}
      >
        <Icon className={iconClass} />
      </div>
    );
  }

  const initials = initialsFrom(displayName);
  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden border border-clay-200 bg-clay-50 text-clay-600 flex items-center justify-center font-semibold ${textSizeClass}`}
    >
      {initials ?? <UserIcon className={iconClass} />}
    </div>
  );
}
