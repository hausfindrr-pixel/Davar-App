import type { JSX } from "react";
import { HeartIcon, ScrollIcon, SunIcon } from "@/components/icons";
import type { LessonTrack } from "@/types/firestore";

/**
 * Content-type identity for The Path's event cards — Lessons/Prayer/
 * Devotion, one accent color family each (all in the same muted "Dawn
 * Light" style as the rest of the palette — see globals.css). Reuses the
 * existing `track` field on LessonDoc (scripture/prayer/devotional),
 * which existed before this but was only ever shown as a small badge —
 * this is a new UI treatment over the same data, not a schema change.
 *
 * Tailwind's build-time scanner needs literal class strings, not ones
 * assembled at runtime (e.g. `bg-${accent}-600` never works) — so every
 * class string a component needs is spelled out here once, and consumers
 * just index into this object rather than building class names
 * themselves.
 */
export interface ContentTypeMeta {
  label: string;
  icon: (props: { className?: string }) => JSX.Element;
  /** Card image-placeholder area background, unlocked state. */
  imageBgClass: string;
  /** Icon color inside the image-placeholder area, unlocked state. */
  imageIconClass: string;
  /** Color for the track name inside a card's "BOOK · TYPE" subheading. */
  labelClass: string;
  /** Border + ring on the "current" (up-next) card. */
  currentBorderClass: string;
  currentRingClass: string;
  /** Solid background for small badges/tags (the "UP NEXT" tag, the
   * completed checkmark badge) — just the bg-x-600, no text color. */
  solidBgClass: string;
  /** The card's "Continue" pill/button — solidBgClass plus text + hover. */
  buttonClass: string;
  /** A deeper solid shade of the same family, used for the verse-activity
   * word bank's "incorrect" state (FillBlankCard) — bold enough to read
   * clearly against paper, but still the track's own color rather than an
   * alarming red, matching this app's never-shaming tone. */
  incorrectBgClass: string;
}

export const CONTENT_TYPE_META: Record<LessonTrack, ContentTypeMeta> = {
  scripture: {
    label: "Lessons",
    icon: ScrollIcon,
    imageBgClass: "bg-gradient-to-br from-clay-50 to-clay-200",
    imageIconClass: "text-clay-600",
    labelClass: "text-clay-600",
    currentBorderClass: "border-clay-400",
    currentRingClass: "ring-clay-100",
    solidBgClass: "bg-clay-600",
    buttonClass: "bg-clay-600 text-paper hover:bg-clay-700",
    incorrectBgClass: "bg-clay-700",
  },
  prayer: {
    label: "Prayer",
    icon: HeartIcon,
    imageBgClass: "bg-gradient-to-br from-dusk-50 to-dusk-200",
    imageIconClass: "text-dusk-600",
    labelClass: "text-dusk-600",
    currentBorderClass: "border-dusk-400",
    currentRingClass: "ring-dusk-100",
    solidBgClass: "bg-dusk-600",
    buttonClass: "bg-dusk-600 text-paper hover:bg-dusk-700",
    incorrectBgClass: "bg-dusk-700",
  },
  devotional: {
    label: "Devotion",
    icon: SunIcon,
    imageBgClass: "bg-gradient-to-br from-gold-50 to-gold-200",
    imageIconClass: "text-gold-600",
    labelClass: "text-gold-600",
    currentBorderClass: "border-gold-400",
    currentRingClass: "ring-gold-100",
    solidBgClass: "bg-gold-600",
    buttonClass: "bg-gold-600 text-paper hover:bg-gold-700",
    incorrectBgClass: "bg-gold-700",
  },
};

/** Canonical track order — Lessons first (the only track with real content
 * today), then Prayer, then Devotion. */
export const CONTENT_TYPE_ORDER: LessonTrack[] = ["scripture", "prayer", "devotional"];
