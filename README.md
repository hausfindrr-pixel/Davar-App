# Davar

A daily discipleship app: Duolingo-style gamified scripture engagement
(streaks, XP, levels) combined with lightweight accountability tracking.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Firebase
(Firestore + Auth) · PWA (`@ducanh2912/next-pwa`) · Vercel

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Firebase config, see below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Service worker generation
is disabled in `next dev` (see `next.config.ts`) so edits hot-reload normally;
it's active in `npm run build && npm run start`.

> `dev`/`build` run with `--webpack`. Next.js 16 defaults to Turbopack, but
> `@ducanh2912/next-pwa` generates the service worker via a Workbox webpack
> plugin, which Turbopack doesn't run.

### Logo & app icons

`public/logo.svg` is the full lockup (plant mark + "Davar" wordmark +
tagline) used in the landing page hero. The PWA/favicon icons in
`public/icons/` are cropped to just the mark — a full lockup's text is
illegible at 192px, let alone favicon sizes — with a bit more padding on
the maskable variant so Android's icon mask doesn't cut into it. Both the
mark and the full lockup carry their own opaque background, so they render
correctly regardless of what's behind them (a dark surface included). If
the logo changes, regenerate the PNGs by re-cropping `logo.svg` to the mark
only and rendering it at 192×192, 512×512 (plus a more-padded 512×512 for
`purpose: "maskable"`), and 180×180 for `apple-touch-icon.png`.

## Firebase setup

The app ships with **placeholder** Firebase config — it won't connect to
anything until you create your own Firebase project and add your keys to
`.env.local`.

1. **Create a project.** Go to the [Firebase console](https://console.firebase.google.com/),
   click **Add project**, name it (e.g. `davar-app`), and follow the prompts
   (Google Analytics is optional — you can skip it).

2. **Register a web app.** In the project overview, click the **web** icon
   (`</>`) to add a web app. Give it a nickname (e.g. `davar-web`). You don't
   need Firebase Hosting since this deploys to Vercel. Firebase will show you
   a `firebaseConfig` object — you'll need those values in step 5.

3. **Enable Authentication.** In the console sidebar, go to **Build → Authentication →
   Get started**, and enable at least one sign-in method (Email/Password
   and/or Google are good starting points).

4. **Create a Firestore database.** Go to **Build → Firestore Database →
   Create database**. Start in **test mode** for local development (open
   read/write for 30 days), then deploy the starter rules in
   `firestore.rules` (see below) before going to production. Pick a region
   close to your users.

5. **Copy the config into `.env.local`.** From **Project settings** (gear
   icon) **→ General → Your apps**, copy each value from the `firebaseConfig`
   object into the matching variable:

   | Firebase config key  | Env var                                   |
   | --------------------- | ------------------------------------------ |
   | `apiKey`               | `NEXT_PUBLIC_FIREBASE_API_KEY`              |
   | `authDomain`           | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`          |
   | `projectId`            | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`           |
   | `storageBucket`        | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`       |
   | `messagingSenderId`    | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`  |
   | `appId`                | `NEXT_PUBLIC_FIREBASE_APP_ID`               |

   These are prefixed `NEXT_PUBLIC_` because the Firebase web SDK runs in the
   browser — they're not secret the way a server API key would be, since
   Firestore/Auth access is enforced by security rules, not by hiding this
   config. Still, don't commit `.env.local` (it's gitignored).

6. **When deploying to Vercel**, add the same six variables under
   **Project Settings → Environment Variables**.

The client SDK is initialized in `src/lib/firebase.ts`, exporting `auth` and
`db` for use throughout the app.

## Firestore schema

Types for every collection live in `src/types/firestore.ts`:

- **`users/{uid}`** — profile, XP, level, `tier` (`"free"` | `"premium"`)
- **`streaks/{uid}`** — current/longest streak count, last check-in date, streak freezes
- **`lessons/{lessonId}`** — scripture/prayer/devotional content items
- **`check_ins/{checkInId}`** — a completed lesson, prayer, reading, etc. for a given day
- **`daily_lesson_progress/{uid}_{date}`** — which lessons a user completed on a given day; the server-side source of truth for the free-tier daily lesson cap
- **`accountability_links/{linkId}`** — a pending/active/ended pairing between two users

`COLLECTIONS` in that same file holds the collection name constants.

### Security rules

`firestore.rules` has starter rules matching the schema above: every user can
only read/write their own `users`/`streaks` docs and their own `check_ins`,
`lessons` is read-only (seed it via the console or Admin SDK), and
`accountability_links` is readable/updatable by either party in the pairing.
Deploy it once you have the [Firebase CLI](https://firebase.google.com/docs/cli)
installed and linked to your project:

```bash
firebase deploy --only firestore:rules
```

### Free tier & the daily lesson cap

Free-tier users are capped at `FREE_DAILY_LESSON_LIMIT` (3, in
`src/types/firestore.ts`) lesson completions per day. This is enforced in
`firestore.rules`, not just in the UI: `completeLesson()`
(`src/lib/db/lessons.ts`) checks the limit client-side for a clean result,
but the actual gate is the `daily_lesson_progress` update rule — growing
`completedLessonIds` past the limit for a non-`"premium"` user rejects the
whole transaction (the XP award and check-in write included), so it can't
be bypassed by refreshing the page or calling Firestore directly. `tier`
itself is locked: the `users` rule only lets it be created as `"free"` and
never lets a client change it afterward — the only way to grant `"premium"`
is the Admin SDK write in the Plisio webhook (see "Payments" below).

Completing a lesson also counts as that day's streak check-in (same
`computeStreakUpdate` the manual "Check in today" button uses) — lessons
are the app's actual daily practice, so the streak/plant visual tracks them
directly instead of requiring a separate, unrelated tap.

Free-tier accounts also only ever *see* `FREE_DAILY_LESSON_LIMIT` lessons
per day of their journey (`visibleLessonsForFreeTier` in `src/lib/lessons.ts`,
keyed off the user's account-creation date) — rather than the whole
library with most of it shown as permanently "Locked". Premium accounts see
the full library immediately, matching the "Full gamified lesson library"
pricing copy.

Run `npm run test:rules` to check `firestore.rules` against a local
Firestore emulator (`scripts/rules-test.mjs`, using
`@firebase/rules-unit-testing`) — no network access to the real project or
a service account needed. It covers the tier lock, the lesson cap itself
(3rd allowed, 4th denied for free, allowed for premium), and cross-user
isolation. Re-run it after touching `firestore.rules`.

### Seeding lessons

`lessons` is intentionally locked to read-only for clients (see the rule
above), so seeding it needs an admin credential, not the app's normal
client config:

1. Firebase console → **Project settings → Service accounts → Generate new
   private key**. Save the downloaded file as `serviceAccountKey.json` at
   the repo root (gitignored — never commit it).
2. `npm run seed:lessons`

This writes the week of lessons in `scripts/lessons-data.mjs` (scripture,
prayer, and devotional tracks) via `scripts/seed-lessons.mjs`. Edit that data
file and re-run the script to add more — each lesson's `id` is also its
Firestore document ID, so re-running is idempotent (it overwrites by ID
rather than duplicating).

## Payments (Plisio)

Premium ($6.99/mo or $59.99/yr) is sold via [Plisio](https://plisio.net), a
crypto payment gateway — no card processor involved.

### Routes

- `POST /api/plisio/create-invoice` (`src/app/api/plisio/create-invoice/route.ts`)
  — called by the signed-in client (`src/lib/plisio/checkout.ts`) with a
  Firebase ID token and `{ plan: "monthly" | "yearly" }`. Verifies the token
  server-side, asks Plisio for a hosted invoice, and returns its URL for the
  browser to redirect to.
- `POST /api/plisio/webhook` (`src/app/api/plisio/webhook/route.ts`) — Plisio's
  server calls this once a payment completes. It verifies Plisio's HMAC
  signature (`src/lib/plisio/verify.ts`) and, if valid and `status ===
  "completed"`, writes `tier: "premium"` and a `premiumUntil` expiry on the
  user's Firestore doc via the Admin SDK (bypassing `firestore.rules`, which
  is exactly why only this server-side path can grant premium — see the
  `users` rule above).
- `/premium/success` and `/premium/failed` — plain pages Plisio redirects the
  browser to after checkout, independent of the webhook (the webhook is what
  actually grants premium; these pages are just user-facing confirmation).

### Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `PLISIO_SECRET_KEY` | create-invoice, webhook | Plisio dashboard → API keys. Server-only — never prefixed `NEXT_PUBLIC_`, never sent to the browser. |
| `FIREBASE_PROJECT_ID` | webhook (Admin SDK) | From a Firebase service account — see below. |
| `FIREBASE_CLIENT_EMAIL` | webhook (Admin SDK) | Same service account. |
| `FIREBASE_PRIVATE_KEY` | webhook (Admin SDK) | Same service account; keep the `\n`s in the value as-is, `src/lib/firebase-admin.ts` un-escapes them. |

Generate the Admin SDK credential at Firebase console → **Project settings →
Service accounts → Generate new private key**, and copy `project_id`,
`client_email`, and `private_key` from the downloaded JSON into the three
`FIREBASE_*` variables above — this is separate from `serviceAccountKey.json`
(used only locally by `npm run seed:lessons`); the webhook reads these three
env vars at runtime instead of a file. Add all four variables (this repo's
`PLISIO_SECRET_KEY` plus the three `FIREBASE_*` ones) to Vercel under
**Project Settings → Environment Variables** before payments will work in
production.

### Paste these into Plisio's dashboard

Once deployed, give Plisio your production domain with these paths
(`https://<your-domain>` + the path), matching what `create-invoice`
already sends as `callback_url`/`success_invoice_url`/`fail_invoice_url`:

- Webhook / callback URL: `/api/plisio/webhook`
- Success URL: `/premium/success`
- Failed URL: `/premium/failed`

### Known limitations

- **Webhook signature verification is untested against a live Plisio
  callback.** `src/lib/plisio/verify.ts` reimplements Plisio's PHP-serialize
  + HMAC-SHA1 scheme from Plisio's own PHP SDK and several independent
  third-party implementations, with a dedicated regression test
  (`npm run test:plisio`, `scripts/plisio-verify.test.mjs`) against
  hand-computed HMAC vectors — but Plisio only sends real callbacks from an
  IP-allowlisted production server, so this has not been exercised against
  an actual Plisio payment yet. Watch the webhook's logs closely on your
  first real transaction.
- **No expiry enforcement.** `premiumUntil` is stored on the user doc when a
  payment completes, but nothing currently checks it or downgrades a user
  back to `"free"` once it passes — the data model is ready for that, but
  the enforcement (e.g. a scheduled Cloud Function) doesn't exist yet.
- **No subscription/recurring billing.** Each payment is a one-time crypto
  invoice; there's no automatic renewal — a user re-runs checkout manually
  when their `premiumUntil` is approaching.

## Auth & streak logic

- `src/lib/auth-context.tsx` — `AuthProvider`/`useAuth()`: email+password and
  Google sign-in, wired up in `src/app/layout.tsx`. On first sign-in it calls
  `ensureUserDoc` (`src/lib/db/users.ts`) to create the `users/{uid}` doc.
- `src/components/AuthForm.tsx` — sign-in/sign-up form, embedded directly in
  the landing page's "join" section (`src/app/page.tsx`) rather than a
  separate route, so signing up is one continuous scroll, not a redirect.
- `src/lib/streak.ts` — `computeStreakUpdate`, the pure function deciding
  the next streak state for a check-in: increments on a same-day no-op or a
  consecutive day, bridges a single missed day with a streak freeze if one's
  available, otherwise resets to 1.
- `src/lib/db/streaks.ts` — `checkIn(uid, timeZone)` runs a Firestore
  transaction that applies `computeStreakUpdate`, writes a `check_ins` doc,
  and awards XP (`src/lib/xp.ts`) on the `users` doc, so a double-tap or two
  devices checking in at once can't double-count.
- "Today" is computed per-user via `dateKeyInTimeZone` (`src/lib/date.ts`)
  using the `timezone` stored on their `users` doc (captured from the
  browser at sign-in).
- `isFirebaseConfigured` (`src/lib/firebase.ts`) is `false` until all six env
  vars are set. The SDK throws synchronously on a missing/placeholder API
  key, so `auth`/`db` are only initialized once it's `true` — `AuthForm`
  checks it and shows a setup notice instead of crashing.

## Project structure

```
src/
  app/            App Router pages, layout, manifest.ts (PWA manifest route)
                  premium/success, premium/failed (post-checkout pages)
                  api/plisio/create-invoice, api/plisio/webhook (route handlers)
  components/     UI components (StreakVisual, PlantIcon, LessonsSection,
                  BenefitCard, PricingSection, AuthForm)
  lib/            firebase.ts (client SDK init), firebase-admin.ts (server-only
                  Admin SDK init), auth-context.tsx, streak.ts, xp.ts, date.ts
                  (pure logic), db/ (Firestore reads/writes),
                  plisio/ (plans.ts, checkout.ts, verify.ts — see "Payments" below)
  types/          firestore.ts (Firestore document types)
public/
  logo.svg        Full logo lockup (mark + wordmark + tagline), used in the
                  landing page hero
  icons/          PNG app icons (192/512/maskable-512/apple-touch), cropped
                  to just the mark from logo.svg — see below
firestore.rules   Security rules matching the schema above
scripts/          seed-lessons.mjs + lessons-data.mjs (Admin SDK lesson seeding),
                  rules-test.mjs (firestore.rules tests, npm run test:rules),
                  plisio-verify.test.mjs (webhook signature tests, npm run test:plisio)
```

## Deploying

Push to a Git repo and import it in [Vercel](https://vercel.com/new), or run
`vercel` from the CLI. Add the Firebase environment variables from step 6
above before the first deploy.
