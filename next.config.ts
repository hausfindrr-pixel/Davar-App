import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// cacheOnFrontEndNav/aggressiveFrontEndNavCaching used to be turned on here
// (both default to false) — they cache every stylesheet/script fetched
// during client-side (next/link) navigation into a runtime cache separate
// from Workbox's normal per-build precache manifest, and that runtime
// cache isn't guaranteed to be invalidated the same way the precache is
// on a new deploy. In an app under active development, where a fresh
// deploy needs to actually show up, that trade-off isn't worth the
// snappier-feeling in-app navigation it buys — so back to the library's
// own defaults. skipWaiting/clientsClaim are already true by default
// (unset here on purpose), so a new service worker still takes over
// immediately on the next load rather than waiting for every tab to close.
const withPWA = withPWAInit({
  dest: "public",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
