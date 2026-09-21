import {
  BookOpenIcon,
  CompassIcon,
  FlameIcon,
  HeartIcon,
  SproutIcon,
  SunIcon,
  UsersIcon,
} from "@/components/icons";

export interface AvatarPreset {
  id: string;
  label: string;
  Icon: typeof SproutIcon;
  bgClass: string;
  iconClass: string;
  borderClass: string;
}

/**
 * The profile avatar picker's full set — no photo upload (Firebase Storage
 * isn't available on the Spark plan), just a fixed set of symbol+color
 * combinations a user picks from. Colors reuse the app's existing palette
 * (clay/sage/dusk/gold — see globals.css) so an avatar never clashes with
 * the rest of the UI. Classes are written out in full, not built from a
 * template string, so Tailwind's build-time scanner can see and generate
 * them.
 */
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "sprout-sage",
    label: "Sprout",
    Icon: SproutIcon,
    bgClass: "bg-sage-50",
    iconClass: "text-sage-600",
    borderClass: "border-sage-200",
  },
  {
    id: "flame-clay",
    label: "Flame",
    Icon: FlameIcon,
    bgClass: "bg-clay-50",
    iconClass: "text-clay-600",
    borderClass: "border-clay-200",
  },
  {
    id: "compass-dusk",
    label: "Compass",
    Icon: CompassIcon,
    bgClass: "bg-dusk-50",
    iconClass: "text-dusk-600",
    borderClass: "border-dusk-200",
  },
  {
    id: "sun-gold",
    label: "Sun",
    Icon: SunIcon,
    bgClass: "bg-gold-50",
    iconClass: "text-gold-600",
    borderClass: "border-gold-200",
  },
  {
    id: "heart-sage",
    label: "Heart",
    Icon: HeartIcon,
    bgClass: "bg-sage-50",
    iconClass: "text-sage-700",
    borderClass: "border-sage-200",
  },
  {
    id: "book-clay",
    label: "Book",
    Icon: BookOpenIcon,
    bgClass: "bg-clay-50",
    iconClass: "text-clay-700",
    borderClass: "border-clay-200",
  },
  {
    id: "users-dusk",
    label: "Community",
    Icon: UsersIcon,
    bgClass: "bg-dusk-50",
    iconClass: "text-dusk-700",
    borderClass: "border-dusk-200",
  },
  {
    id: "flame-gold",
    label: "Zeal",
    Icon: FlameIcon,
    bgClass: "bg-gold-50",
    iconClass: "text-gold-600",
    borderClass: "border-gold-200",
  },
  {
    id: "compass-sage",
    label: "Path",
    Icon: CompassIcon,
    bgClass: "bg-sage-50",
    iconClass: "text-sage-600",
    borderClass: "border-sage-200",
  },
  {
    id: "sun-clay",
    label: "Light",
    Icon: SunIcon,
    bgClass: "bg-clay-50",
    iconClass: "text-clay-600",
    borderClass: "border-clay-200",
  },
];

export function avatarPresetById(avatarId: string | null | undefined): AvatarPreset | null {
  if (!avatarId) return null;
  return AVATAR_PRESETS.find((preset) => preset.id === avatarId) ?? null;
}

/** Up to two initials from a display name (e.g. "Jane Doe" -> "JD"), the
 * fallback shown when no preset avatar has been chosen. */
export function initialsFrom(displayName: string | null | undefined): string | null {
  const trimmed = displayName?.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return initials || null;
}
