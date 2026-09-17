import { UsersIcon } from "@/components/icons";

/** Disciples — a placeholder for now. No functionality yet, just the nav
 * entry and an honest "coming soon" rather than an empty screen or a
 * broken-looking gap in the tab bar. */
export function DisciplesTab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-clay-50 text-clay-600">
        <UsersIcon className="h-7 w-7" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-ink">Disciples</h1>
        <p className="mt-1 text-sm text-stone max-w-xs">
          Coming soon — a place to walk this out together, not alone.
        </p>
      </div>
    </div>
  );
}
