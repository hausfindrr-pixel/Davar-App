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
never lets a client change it afterward — there's no billing integration
yet, so nothing can currently grant `"premium"` except a direct Admin SDK
write.

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

## Auth & streak logic

- `src/lib/auth-context.tsx` — `AuthProvider`/`useAuth()`: email+password and
  Google sign-in, wired up in `src/app/layout.tsx`. On first sign-in it calls
  `ensureUserDoc` (`src/lib/db/users.ts`) to create the `users/{uid}` doc.
- `src/app/login/page.tsx` — sign-in/sign-up form; the home page
  (`src/app/page.tsx`) shows a "Sign in" prompt when logged out.
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
  key, so `auth`/`db` are only initialized once it's `true` — the home and
  login pages check it and show a setup notice instead of crashing.

## Project structure

```
src/
  app/            App Router pages, layout, manifest.ts (PWA manifest route)
                  login/ (sign-in/sign-up page)
  components/     UI components (StreakVisual, PlantIcon, LessonsSection,
                  BenefitCard, PricingSection, AuthForm)
  lib/            firebase.ts (client SDK init), auth-context.tsx,
                  streak.ts, xp.ts, date.ts (pure logic), db/ (Firestore reads/writes)
  types/          firestore.ts (Firestore document types)
public/
  logo.svg        Full logo lockup (mark + wordmark + tagline), used in the
                  landing page hero
  icons/          PNG app icons (192/512/maskable-512/apple-touch), cropped
                  to just the mark from logo.svg — see below
firestore.rules   Security rules matching the schema above
scripts/          seed-lessons.mjs + lessons-data.mjs (Admin SDK lesson seeding),
                  rules-test.mjs (firestore.rules tests, npm run test:rules)
```

## Deploying

Push to a Git repo and import it in [Vercel](https://vercel.com/new), or run
`vercel` from the CLI. Add the Firebase environment variables from step 6
above before the first deploy.
