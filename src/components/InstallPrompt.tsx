"use client";

import { useEffect, useState } from "react";
import { MoreVerticalIcon, ShareIcon, XIcon } from "@/components/icons";

const DISMISSED_KEY = "davar:install-prompt-dismissed";

type Platform = "ios" | "android" | null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** iOS Safari (including iPadOS 13+, which reports a desktop Mac user
 * agent but is still touch-only) has no feature we can test for — the
 * user agent is the only signal. */
function detectPlatform(): Platform {
  const ua = window.navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return null;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own long-standing (non-standard) flag — still the only
    // way to detect an installed PWA there.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** A dismissible "Add to Home Screen" banner, shown once per browser (not
 * per account — install state lives with the browser, so a returning user
 * who already dismissed or installed it shouldn't see it again on a new
 * account). iOS Safari has no install API, so it gets manual Share-sheet
 * instructions; Android gets a real one-tap install via the captured
 * `beforeinstallprompt` event when Chrome offers it, falling back to
 * manual browser-menu instructions when it doesn't (e.g. Firefox for
 * Android, or Chrome before its own install criteria are met). Renders
 * nothing on desktop, once already installed, or once dismissed. */
export function InstallPrompt() {
  // Lazy initializers, not an effect: Dashboard (this component's only
  // parent) never renders during loading/SSR — see Home() — so by the
  // time this ever mounts, it's already client-side and `window` is safe
  // to read directly during render. `platform` never changes post-mount,
  // so it isn't worth its own effect-driven subscription.
  const [platform] = useState<Platform>(() => detectPlatform());
  const [standalone, setStandalone] = useState<boolean>(() => isStandalone());
  const [dismissed, setDismissed] = useState<boolean>(
    () => window.localStorage.getItem(DISMISSED_KEY) === "1",
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onAppInstalled() {
      window.localStorage.setItem(DISMISSED_KEY, "1");
      setStandalone(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  async function handleAndroidInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (standalone || dismissed || platform === null) return null;

  return (
    <div className="shrink-0 mx-6 mt-3 relative rounded-2xl border border-mist bg-paper p-4 text-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-3 right-3 text-stone hover:text-ink"
      >
        <XIcon className="h-4 w-4" />
      </button>

      <div className="pr-6 flex items-start gap-3">
        <span className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-clay-50 text-clay-600">
          {platform === "ios" ? <ShareIcon className="h-4.5 w-4.5" /> : <MoreVerticalIcon className="h-4.5 w-4.5" />}
        </span>
        <div className="flex-1 flex flex-col gap-1.5">
          <p className="font-medium text-ink">Install Davar on your home screen</p>
          {platform === "ios" ? (
            <p className="text-ink/70 leading-relaxed">
              Tap <ShareIcon className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> Share, then
              &ldquo;Add to Home Screen&rdquo; — Davar opens full-screen, just like an app.
            </p>
          ) : deferredPrompt ? (
            <>
              <p className="text-ink/70 leading-relaxed">Get one-tap access and a full-screen app feel.</p>
              <button
                type="button"
                onClick={() => void handleAndroidInstall()}
                className="self-start rounded-full bg-clay-600 text-paper px-4 py-1.5 text-xs font-medium hover:bg-clay-700 transition-colors mt-0.5"
              >
                Install app
              </button>
            </>
          ) : (
            <p className="text-ink/70 leading-relaxed">
              Open your browser menu <MoreVerticalIcon className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden /> and
              tap &ldquo;Add to Home screen&rdquo; — Davar opens full-screen, just like an app.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
