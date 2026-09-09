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
   read/write for 30 days) — you'll want to lock this down with real
   [security rules](https://firebase.google.com/docs/firestore/security/get-started)
   before going to production. Pick a region close to your users.

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

- **`users/{uid}`** — profile, XP, level
- **`streaks/{uid}`** — current/longest streak count, last check-in date, streak freezes
- **`lessons/{lessonId}`** — scripture/prayer/devotional content items
- **`check_ins/{checkInId}`** — a completed lesson, prayer, reading, etc. for a given day
- **`accountability_links/{linkId}`** — a pending/active/ended pairing between two users

`COLLECTIONS` in that same file holds the collection name constants.

## Project structure

```
src/
  app/            App Router pages, layout, manifest.ts (PWA manifest route)
  components/     UI components (StreakCard, ...)
  lib/            firebase.ts (client SDK init)
  types/          firestore.ts (Firestore document types)
public/
  icons/          PWA icons (placeholder SVGs — swap for real PNG/SVG icons
                  before shipping; iOS's apple-touch-icon works best as PNG)
```

## Deploying

Push to a Git repo and import it in [Vercel](https://vercel.com/new), or run
`vercel` from the CLI. Add the Firebase environment variables from step 6
above before the first deploy.
