import type { JSX } from "react";
import { HeartIcon, ScrollIcon, SunIcon } from "@/components/icons";
import type { LessonTrack } from "@/types/firestore";

/**
 * Content-type identity for The Path's per-book tabs — Lessons/Prayer/
 * Devotion, one accent color family each (all in the same muted "Dawn
 * Light" style as the rest of the palette — see globals.css). Reuses the
 * existing `track` field on LessonDoc (scripture/prayer/devotional),
 * which existed before this but was only ever shown as a small badge —
 * this is a new UI grouping over the same data, not a schema change.
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
  /** Small circular icon badge, e.g. the tab header. */
  badgeClass: string;
  /** Roadmap node fill/border when completed or current. */
  nodeBgClass: string;
  /** Roadmap current-node ring. */
  nodeRingClass: string;
  /** CSS custom property name (no `var()`) for the walked connector
   * stroke — SVG `stroke` is resolved at runtime, so this one is safe to
   * use directly rather than needing a pre-built literal per track. */
  connectorVar: string;
}

export const CONTENT_TYPE_META: Record<LessonTrack, ContentTypeMeta> = {
  scripture: {
    label: "Lessons",
    icon: ScrollIcon,
    badgeClass: "bg-clay-50 text-clay-600",
    nodeBgClass: "bg-clay-600 border-clay-600",
    nodeRingClass: "ring-clay-200",
    connectorVar: "--color-clay-400",
  },
  prayer: {
    label: "Prayer",
    icon: HeartIcon,
    badgeClass: "bg-dusk-50 text-dusk-600",
    nodeBgClass: "bg-dusk-600 border-dusk-600",
    nodeRingClass: "ring-dusk-200",
    connectorVar: "--color-dusk-400",
  },
  devotional: {
    label: "Devotion",
    icon: SunIcon,
    badgeClass: "bg-gold-50 text-gold-600",
    nodeBgClass: "bg-gold-600 border-gold-600",
    nodeRingClass: "ring-gold-200",
    connectorVar: "--color-gold-400",
  },
};

/** Canonical tab order within a book — Lessons first (the only track with
 * real content today), then Prayer, then Devotion. */
export const CONTENT_TYPE_ORDER: LessonTrack[] = ["scripture", "prayer", "devotional"];
