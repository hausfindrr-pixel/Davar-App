"use client";

import { useEffect } from "react";

/**
 * Root error boundary — catches any otherwise-uncaught render/runtime
 * error anywhere in the app (e.g. a malformed doc slipping past a
 * fetch-time guard) and shows this instead of Next's default blank
 * "Application error" page, with a way back in rather than a dead end.
 * Client component: Next.js requires error boundaries to be client-side.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <main className="min-h-dvh flex items-center justify-center bg-ivory px-6">
      <div className="w-full max-w-sm rounded-2xl bg-paper border border-mist p-6 flex flex-col items-center gap-3 text-center">
        <h1 className="text-base font-semibold text-ink">Something didn&apos;t load right</h1>
        <p className="text-sm text-stone">
          This one&apos;s on us, not you — try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-1 rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
