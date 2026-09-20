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
  /**
   * The verse activity's word-bank tiles, a filled-but-unchecked blank,
   * and its "Check answer" button (FillBlankCard) — deliberately the
   * ramp's darkest (-700) shade, not solidBgClass/buttonClass's -600: at
   * the small pill size these sit at, -600 against paper measures under
   * WCAG's 4.5:1 text-contrast floor for clay and gold (~3.4-3.5:1) and
   * reads as washed out, where -700 clears it comfortably (~4.9-6.6:1
   * across all three tracks). Scoped to this one activity rather than
   * changed on solidBgClass/buttonClass, which stay -600 for the "current"
   * card badges and Continue pill elsewhere (PathEventCard) — that UI
   * wasn't reported as low-contrast, so it's untouched.
   */
  activeBgClass: string;
  /** The verse activity's empty-blank placeholder (FillBlankCard) — a
   * light tinted fill plus the ramp's darkest border shade, so an
   * unfilled blank reads as a clear box at a glance rather than a
   * near-invisible dashed line (the previous -400 border with no fill at
   * all). */
  emptyBlankClass: string;
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
    activeBgClass: "bg-clay-700 text-paper hover:opacity-90",
    emptyBlankClass: "border-clay-700 bg-clay-50",
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
    activeBgClass: "bg-dusk-700 text-paper hover:opacity-90",
    emptyBlankClass: "border-dusk-700 bg-dusk-50",
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
    activeBgClass: "bg-gold-700 text-paper hover:opacity-90",
    emptyBlankClass: "border-gold-700 bg-gold-50",
  },
};

/** Canonical track order — Lessons first (the only track with real content
 * today), then Prayer, then Devotion. */
export const CONTENT_TYPE_ORDER: LessonTrack[] = ["scripture", "prayer", "devotional"];
