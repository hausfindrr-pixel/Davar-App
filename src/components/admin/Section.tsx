import type { ReactNode } from "react";
import { ChevronDownIcon } from "@/components/icons";

type SectionProps = {
  title: string;
  /** A short glance-value shown next to the title even while collapsed —
   * e.g. "8 signups" — so collapsing a section doesn't hide its one
   * headline number. */
  preview?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

/** A collapsible dashboard section — plain HTML `<details>`/`<summary>`,
 * no client-side state needed (the whole page stays a Server Component).
 * Each of /admin's major groupings (users, revenue, Peter's Watch, content
 * engagement) is one of these, so the page opens compact and an admin
 * expands only what they're checking, instead of scrolling past
 * everything every time. */
export function Section({ title, preview, defaultOpen = false, children }: SectionProps) {
  return (
    <details
      className="group rounded-2xl bg-paper border border-mist open:pb-4 [&_summary::-webkit-details-marker]:hidden"
      open={defaultOpen}
    >
      <summary className="flex items-center justify-between gap-3 cursor-pointer select-none list-none p-4">
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-stone transition-transform group-open:rotate-180" />
          <h2 className="text-sm font-bold text-ink truncate">{title}</h2>
        </div>
        {preview ? <span className="text-xs text-stone shrink-0">{preview}</span> : null}
      </summary>
      <div className="px-4 flex flex-col gap-3">{children}</div>
    </details>
  );
}
