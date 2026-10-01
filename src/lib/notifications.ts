import { getToken, getMessaging, deleteToken } from "firebase/messaging";
import app, { isFirebaseConfigured } from "@/lib/firebase";
import { disableNotifications as disableNotificationsDoc, saveFcmToken } from "@/lib/db/users";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** Push needs three things this browser might not have: the Notification
 * API itself, a service worker (next-pwa registers one in production
 * only — see next.config.ts's `disable: NODE_ENV === "development"`),
 * and the VAPID key this project's Cloud Messaging setup depends on. All
 * three are checked up front so the Profile toggle can hide itself
 * entirely rather than offering a switch that can only ever fail. */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    isFirebaseConfigured &&
    !!VAPID_KEY &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

/**
 * Requests notification permission (if not already granted), gets this
 * device's FCM token via the service worker next-pwa already registers
 * (its generated public/sw.js has the Cloud Messaging background handler
 * merged in — see worker/index.ts, imported in via next-pwa's
 * `customWorkerSrc`), and saves that token to users/{uid}.fcmTokens.
 *
 * Returns the outcome rather than throwing for the expected "the user
 * said no" case (`"denied"`) — only a genuine failure (misconfigured
 * VAPID key, no service worker, network error) throws.
 */
export async function enableNotifications(uid: string): Promise<"granted" | "denied"> {
  if (!isPushSupported()) {
    throw new Error("Push notifications aren't supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app!);
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) {
    throw new Error("Could not register this device for notifications.");
  }

  await saveFcmToken(uid, token);
  return "granted";
}

/** Turns notifications off and best-effort deletes this device's FCM
 * token (both from Firebase's own registry and from the user's saved
 * list) — a token delete failing (e.g. permission already revoked by the
 * browser) shouldn't block turning the in-app setting off, so errors
 * here are swallowed rather than surfaced to the caller. */
export async function disableNotifications(uid: string): Promise<void> {
  let token: string | null = null;
  try {
    if (isPushSupported() && Notification.permission === "granted") {
      const registration = await navigator.serviceWorker.ready;
      const messaging = getMessaging(app!);
      token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      if (token) await deleteToken(messaging);
    }
  } catch {
    // Best-effort — still turn the setting off below either way.
  }
  await disableNotificationsDoc(uid, token);
}
