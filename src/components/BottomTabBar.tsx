"use client";

import type { JSX } from "react";
import { BookOpenIcon, KeyIcon, ScrollIcon, ShieldIcon, SproutIcon, UsersIcon } from "@/components/icons";

export type TabId = "today" | "path" | "armory" | "watch" | "word" | "disciples";

const TABS: { id: TabId; label: string; icon: (props: { className?: string }) => JSX.Element }[] = [
  { id: "today", label: "Today", icon: SproutIcon },
  { id: "path", label: "The Path", icon: ScrollIcon },
  { id: "armory", label: "The Armory", icon: ShieldIcon },
  { id: "watch", label: "Peter's Watch", icon: KeyIcon },
  { id: "word", label: "The Word", icon: BookOpenIcon },
  { id: "disciples", label: "Disciples", icon: UsersIcon },
];

type BottomTabBarProps = {
  active: TabId;
  onSelect: (tab: TabId) => void;
};

export function BottomTabBar({ active, onSelect }: BottomTabBarProps) {
  return (
    <nav
      aria-label="Main navigation"
      className="shrink-0 border-t border-mist bg-paper/95 backdrop-blur-sm pb-[max(env(safe-area-inset-bottom),0px)]"
    >
      <div className="grid grid-cols-6">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-1 py-2.5 px-1 transition-colors"
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-clay-600" : "text-stone"}`}
              />
              <span
                className={`text-[10px] leading-none font-medium ${
                  isActive ? "text-clay-600" : "text-stone"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
