/// <reference lib="webworker" />

// The custom service worker next-pwa merges into its generated
// public/sw.js (via customWorkerSrc — see next.config.ts's own comment
// and README.md's "Daily push notifications" section). Handles Firebase
// Cloud Messaging push delivery while the app isn't in the foreground —
// the daily "today's verse + streak" notification sent by
// src/app/api/cron/daily-notification/route.ts. next-pwa's own Workbox
// setup (precaching, offline fallback) lives entirely in its generated
// wrapper around this file; this file only adds the messaging/push
// pieces Workbox doesn't do.
//
// Firebase config comes from a generated, gitignored sibling module
// (worker/firebase-config.generated.ts) rather than process.env — see
// next.config.ts for why — and is imported and used synchronously at
// the top level, not fetched: a service worker must register its `push`
// listener before the browser finishes evaluating the script, so an
// `await` before that registration risks missing a push that arrives
// while still loading.
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage, type MessagePayload } from "firebase/messaging/sw";
import { firebaseConfigForWorker } from "./firebase-config.generated";

declare const self: ServiceWorkerGlobalScope;

const ICON = "/icons/icon-192.png";

// Only set up messaging when real config is present — a contributor
// running `next build` without Firebase env vars filled in yet
// shouldn't get a service worker that throws on activation.
if (firebaseConfigForWorker.apiKey) {
  const app = initializeApp(firebaseConfigForWorker);
  const messaging = getMessaging(app);

  // The cron route sends data-only messages (no top-level `notification`
  // field) specifically so this is the only thing that ever displays
  // one — a `notification` field would additionally trigger the
  // browser's own default display, risking a duplicate.
  onBackgroundMessage(messaging, (payload: MessagePayload) => {
    const title = payload.data?.title ?? "Davar";
    const body = payload.data?.body ?? "";
    const url = payload.data?.url ?? "/";
    void self.registration.showNotification(title, {
      body,
      icon: ICON,
      badge: ICON,
      tag: "davar-daily",
      data: { url },
    });
  });
}

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";
  event.waitUntil(
    (async () => {
      const clientsArr = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = clientsArr.find((c) => "focus" in c) as WindowClient | undefined;
      if (existing) {
        await existing.focus();
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
