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
tagline) used in the landing page hero. It has no background rect — it's
transparent and blends into whatever's behind it (ivory, or any other
surface) rather than sitting on top like a sticker. The PWA/favicon icons
in `public/icons/` are separately-generated PNGs cropped to just the mark
— a full lockup's text is illegible at 192px, let alone favicon sizes —
with a bit more padding on the maskable variant so Android's icon mask
doesn't cut into it; those PNGs carry their own opaque background on
purpose (icons need one, unlike the in-page hero logo), so they render
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

4b. **Enable Storage** (needed for profile photos — see "Profile" below).
   **Build → Storage → Get started**, same region as Firestore. Deploy
   `storage.rules` the same way as the Firestore rules — see below.

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
- **`lessons/{lessonId}`** — a guided, one-screen-at-a-time sequence, not a
  single scrolling card: intro (`summary`) → question `screens` → a
  `resolution` + `nextHook` cliffhanger (see "The Path: guided lesson
  screens" below). `chronologicalOrder` places it in the single sequence
  the whole library now runs on.
- **`users/{uid}/prayers/{prayerId}`** — a user's own free-text prayers (see
  "The Path: prayer journal" below)
- **`users/{uid}/lessonAnswers/{lessonId}_{screenId}`** — a user's own
  free-text answer to a lesson's scenario screen, no right/wrong, same
  spirit as the prayer journal (see "The Path: guided lesson screens" below)
- **`check_ins/{checkInId}`** — a completed lesson, prayer, reading, etc. for a given day
- **`daily_lesson_progress/{uid}_{date}`** — which lessons a user completed on a given day; the server-side source of truth for the free-tier daily lesson cap
- **`accountability_links/{linkId}`** — a pending/active/ended pairing between two users
- **`user_highlights/{uid}_{book}_{chapter}_{verse}`** — a verse a user
  highlighted in The Word: its color, the verse `text` itself (stored
  alongside it so Profile's highlight list doesn't need to re-fetch it),
  and an optional personal `notes` string, editable from Profile
- **`conversations/{uid}/messages/{messageId}`** — Peter's Watch AI chat
  history: `role` (`"user"` | `"assistant"`), `apostleId` (`null` for the
  user's own messages), `text`, `createdAt`. Read-only from the client —
  see "Peter's Watch: AI chat" below.
- **`daily_verses/{id}`, `daily_devotionals/{id}`, `daily_prayers/{id}`** —
  the Today tab's app-provided daily content, three separate pools (see
  "Today: daily content" below).

`COLLECTIONS` in that same file holds the collection name constants.

### Security rules

`firestore.rules` has starter rules matching the schema above: every user can
only read/write their own `users`/`streaks` docs and their own `check_ins`,
`lessons` is read-only (seed it via the console or Admin SDK),
`accountability_links` is readable/updatable by either party in the pairing,
and `user_highlights` docs (docId derived from `{uid}_{book}_{chapter}_{verse}`)
are only readable/writable by the user they belong to — editing just the
`notes` field on an existing highlight is an "update" under this same rule,
no separate carve-out needed. `users/{uid}/lessonAnswers/{answerId}`
(docId `{lessonId}_{screenId}`) is owner-only create/read/update, no
delete — unlike the prayer journal, update is allowed, since a lesson's
back-navigation (see "guided lesson screens" below) lets a user revise a
scenario answer before finishing. `conversations/{uid}/messages/{messageId}` is
readable only by `{uid}` and **not writable by any client at all** — only
the Admin SDK (via `/api/watch-chat`) writes to it, so the crisis-detection
and apostle-routing logic in that route can't be bypassed by writing
straight to Firestore. `daily_verses`, `daily_devotionals`, and
`daily_prayers` are read-only for any signed-in user, the same rule shape
as `lessons`. `storage.rules` covers profile photos the same way (see
"Profile" below).

**Whenever you change either rules file, you have to deploy it yourself** —
editing it here only changes what's in the repo, not what's enforced on
your live project. This has bitten this app before: `user_highlights` had
rules written and tested (`npm run test:rules`) but never actually deployed,
so every highlight attempt was silently rejected — confirmed directly
against production by writing to it with a real ID token and getting
`PERMISSION_DENIED`, while the same token could write to `streaks` (rules
deployed long ago) with no issue. Deploy both rules files together once you
have the [Firebase CLI](https://firebase.google.com/docs/cli) installed and
linked:

```bash
firebase deploy --only firestore:rules,storage
```

### Daily caps: events and prayers, tracked separately

Lesson completions (The Path's event cards) and prayer-journal submissions
each have their own daily cap — they used to share one combined number, but
an event lesson and a prayer are different kinds of daily practice, so
they're budgeted separately now:

- **Events:** `FREE_DAILY_EVENT_LIMIT` (1) / `PREMIUM_DAILY_EVENT_LIMIT`
  (3), via `dailyEventLimit(tier)`.
- **Prayers:** `FREE_DAILY_PRAYER_LIMIT` (3) / `PREMIUM_DAILY_PRAYER_LIMIT`
  (15), via `dailyPrayerLimit(tier)`.

Both live in `src/types/firestore.ts`.

This is enforced in `firestore.rules`, not just in the UI:
`completeLesson()` (`src/lib/db/lessons.ts`) and `submitPrayer()`
(`src/lib/db/prayers.ts`) both check their own limit client-side for a
clean result, but the actual gate is the `daily_lesson_progress` doc's
rules — one doc per user per day, holding both `completedLessonIds` (a
lesson completion grows this by exactly 1) and `prayerCount` (a prayer
submission grows this by exactly 1, `completedLessonIds` untouched) — a
lesson-completion write is allowed only if `completedLessonIds.size()` was
under the tier's *event* limit before that write, and a prayer-submission
write only if `prayerCount` was under the tier's *prayer* limit — so
bypassing the client checks and writing directly to Firestore hits the
same wall (the XP award and check-in write riding along in the same
transaction get rejected with it). The `users/{uid}/prayers/{prayerId}`
create rule enforces the prayer check independently (reading that same
progress doc's `prayerCount`, or treating it as zero via `!exists()` for
the very first action of a fresh day) — so a prayer can't be created
without going through its own cap just because the paired progress-doc
write happens to live on a different document. `tier` itself is locked:
the `users` rule only lets it be created as `"free"` and never lets a
client change it afterward — the only way to grant `"premium"` is the
Admin SDK write in the Plisio webhook (see "Payments" below).

Completing a lesson or submitting a prayer also counts as that day's
streak check-in (same `computeStreakUpdate` the manual "Check in today"
button uses) — both are the app's actual daily practice, so the
streak/plant visual tracks them directly instead of requiring a separate,
unrelated tap.

Today's Verse/Devotional/Prayer (see "Today: daily content" below) have no
completion action and aren't part of either cap — they only cover The
Path's event lessons and the prayer journal, respectively.

Run `npm run test:rules` to check `firestore.rules` against a local
Firestore emulator (`scripts/rules-test.mjs`, using
`@firebase/rules-unit-testing`) — no network access to the real project or
a service account needed. It covers the tier lock, both caps independently
(event cap and prayer cap each checked at the free/premium boundary), and
cross-user isolation. Re-run it after touching `firestore.rules`.

### All-time completion tracking (`fetchAllCompletedLessonIds`)

`daily_lesson_progress/{uid}_{date}` is per-*day* by design — its
`completedLessonIds` only ever holds what was completed on that specific
date, so the day's docId can reset the count cleanly at midnight. The Path's
gating logic, though, needs to know whether a lesson has *ever* been
completed, not just today — a lesson finished yesterday should still read
as done today, not reappear as if new.

That all-time set comes from `fetchAllCompletedLessonIds(uid)`
(`src/lib/db/lessons.ts`): it queries `daily_lesson_progress` where
`userId == uid` across every one of that user's day-docs, and unions their
`completedLessonIds` arrays. It needs no new Firestore rule — the existing
`daily_lesson_progress` read rule (`resource.data.userId ==
request.auth.uid`) already covers this as a `list` query the same way it
covers a single `get`. This also means there's no new writable "all-time
completed" field for a malicious client to self-populate and fake
progress — the set is always derived from the same per-day docs the caps
above already validate. `src/app/page.tsx` fetches this once on mount and
again after every `completeLesson()` call, storing it as
`allTimeCompletedLessonIds` and passing it to `PathTab`/`PathEventList`
and to `flattenPathEvents`/`nextLesson` — everywhere gating
used to read `lessonProgress.completedLessonIds` (today-only) now reads
this instead.

### Seeding lessons and daily content

**If The Path is showing "No lessons yet" (or Today's Verse/Devotional/
Prayer cards aren't appearing) with nothing showing, this is almost
certainly why:** `lessons`, `daily_verses`, `daily_devotionals`, and
`daily_prayers` are all intentionally locked to read-only for clients (see
the rules above), so nobody — including this app's own deploy — can seed
them automatically. Each has to be run once, by hand, with an admin
credential:

1. Firebase console → **Project settings → Service accounts → Generate new
   private key**. Save the downloaded file as `serviceAccountKey.json` at
   the repo root (gitignored — never commit it).
2. `npm run seed:lessons` and `npm run seed:daily-content`

Until those have been run against your actual project, both collections
have zero documents in them — confirmed directly against production more
than once in this app's history for `lessons` — so `fetchLessons()`
(`src/lib/db/lessons.ts`), the free-tier gating that consumes it
(`nextLesson`, `src/lib/roadmap.ts`), and
`fetchDailyVerses`/`fetchDailyDevotionals`/`fetchDailyPrayers`
(`src/lib/db/dailyContent.ts`) all work correctly, there's simply nothing
for them to return yet. **`lessonBook` specifically**: if `lessons` was
seeded before the book-restructure work below, those existing docs won't
have a `lessonBook` field until `npm run seed:lessons` is re-run — until
then they won't appear in any book section.

`scripts/seed-lessons.mjs` writes `scripts/lessons-data.mjs` — 10
narrative Bible events/stories (Creation, the Red Sea, David and Goliath,
...), each tagged with `lessonBook` and a chapter-range `scriptureReference`
rather than an isolated verse (see "The Path: event-based stories" below);
`scripts/seed-daily-content.mjs` writes `scripts/daily-content-data.mjs`
(the Today tab's three pools — see "Today: daily content" below). Edit
either data file and re-run its script to add more — each entry's `id` is
also its Firestore document ID, so re-running is idempotent. Both scripts
write with `{ merge: true }` and only stamp `createdAt` on first creation
(checked via a `get()` before the write) — re-running either to backfill a
new field onto existing docs updates just that field rather than silently
resetting `createdAt` on every run.

## Navigation (bottom tab bar)

The signed-in app (`src/app/page.tsx`, `Dashboard`) is six tabs
(`BottomTabBar`, `src/components/BottomTabBar.tsx`) rather than one long
scroll. Each tab is its own component under `src/components/tabs/`:

| Tab | Component | Access |
| --- | --- | --- |
| Today | `TodayTab.tsx` | Everyone — John's mascot greeting, a "Continue Your Story" teaser into The Path, Today's Verse/Devotional/Prayer (see below), streak, XP, level, the apostle companion message, check-in |
| The Path | `PathTab.tsx` | Free: exactly one lesson at a time, completion-gated (1/day cap); 3 prayers/day. Premium: the whole library, all in one chronological sequence (3 lessons/day, 15 prayers/day) — see "Daily caps" and "The Path: strict visibility and completion-gated rotation" above/below |
| The Armory | `ArmoryTab.tsx` | Free: teaser (see below). Premium: full access |
| Peter's Watch | `WatchTab.tsx` | Free: teaser. Premium: full access |
| The Word | `WordTab.tsx` | Everyone, never gated |
| Disciples | `DisciplesTab.tsx` | Everyone — a "Coming soon" placeholder, no functionality yet |

### Today: story teaser

A "Continue Your Story" card (`NextStoryTeaser.tsx`,
`src/components/NextStoryTeaser.tsx`) points at whatever lesson is
"current" for this user right now — `nextLesson` (`src/lib/roadmap.ts`),
the first not-yet-completed lesson in the library's single chronological
sequence. Both tiers walk the same one line now, so there's only ever one
"next" lesson regardless of tier — the teaser and The Path's own view
always point at the same lesson.

Derived from `allTimeCompletedLessonIds` (see "All-time completion
tracking" above), not from today's progress doc alone. This is **not** a
fourth daily-rotation pool: there's no new collection, no XP awarded here,
nothing completable from Today itself. It's a pointer into the user's own
progress in The Path, which is why it changes the moment a lesson is
completed rather than once a day.

Tapping "Continue" switches to The Path tab and jumps straight to that
story's detail panel — `Dashboard` (`src/app/page.tsx`) builds a
`PathFocusRequest` (lesson ID and a `nonce` so re-tapping the same story
still re-triggers it) and passes it down through `PathTab` to
`PathEventList`, which opens that lesson's detail directly. This uses
React's adjust-state-during-render pattern (a guarded `setState` call in
the render body, not inside a `useEffect`) rather than an effect,
specifically because this project's lint config
(`react-hooks/set-state-in-effect`) flags `setState` synchronously inside
effects as an avoidable extra render — adjusting during render lets the
same pass produce the correct output immediately.

### Today: daily content

The Today tab shows three app-provided picks — Today's Verse, Today's
Devotional, Today's Prayer (the app's guided prayer, distinct from the
user's own free-text prayer journal in The Path) — that change every
calendar day rather than staying static or repeating.

Today's Verse and Today's Devotional sit on `DailyContentBackdrop`
(`src/components/DailyContentBackdrop.tsx`) — an illustrated "landscape"
(soft hills, a sun glow) built from CSS variables pointing at the app's
existing palette tokens (`--color-sage-200/400`, `--color-clay-50/200/400`)
rather than a photo or a new image asset, so it stays on-brand and adds no
binary dependency. It's purely decorative and sits behind the cards, which
keep their normal solid `bg-paper` treatment on top — the backdrop never
touches text readability. Today's Prayer stays a plain card below it, not
inside the illustrated band.

- **Three separate pools**, not pulled from `lessons`: `daily_verses`,
  `daily_devotionals`, `daily_prayers` (`DailyVerseDoc`/
  `DailyDevotionalDoc`/`DailyPrayerDoc` in `src/types/firestore.ts`, seeded
  from `scripts/daily-content-data.mjs` via `npm run seed:daily-content`).
  Keeping these structurally separate from the lesson library is what
  guarantees Today and The Path never show the same content on the same
  day — there's no shared ID space for a pick to collide against.
- **Rotation:** `pickForDate(pool, dateKey)` (`src/lib/dailyContent.ts`)
  is a pure, pool-size-modulo-day-of-year function — deterministic (the
  same date always yields the same pick, so refreshing doesn't change it
  mid-day) and non-repeating until the whole pool has cycled through
  (unlike picking at random, which could hand back the same verse two
  days running). It indexes by each item's own `order` field after
  sorting, not by array/query position, so the rotation already shown to
  users doesn't shift retroactively if more content is appended to a pool
  later. Fetched once per session the same way `fetchLessons` is
  (`src/lib/db/dailyContent.ts`), then picked client-side — no extra
  Firestore read per pick.
- **Global, not per-user.** Every signed-in user sees the same verse/
  devotional/prayer on a given date, rather than each user getting their
  own independent rotation. Nothing else in the daily-content data model
  tracks a per-user "seen" history the way it would need to for a
  personalized rotation, and building one just for this would add a new
  per-user subcollection and write path for content that isn't XP-bearing
  or otherwise personalized — the standard "Verse of the Day" shape this
  mirrors is global for the same reason. Revisit this if the content ever
  needs to be personalized.
- **No XP, no completion state, read-only for v1** — these are things to
  read, not tasks to complete, unlike lessons.

### The Path: an event-first card feed

The Path is a flat, scrollable feed of event cards — `PathEventList.tsx`
(`src/components/PathEventList.tsx`, mounted by `PathTab.tsx`), one card
per lesson (`PathEventCard.tsx`). Each card's main heading is the
event/story title ("The Creation of the World"), with its Bible book and
content type as a small "GENESIS · LESSONS" subheading underneath, and an
image area on top — the lesson's own `imageUrl` if set, falling back to a
tinted gradient with the content type's icon (no illustrations generated
yet) — the book is identifying context, not the primary unit.

- **Schema:** every `LessonDoc` (`src/types/firestore.ts`) has a required
  `lessonBook: string`, an exact `BIBLE_BOOKS` (`src/lib/bible.ts`) entry
  name (e.g. `"Psalms"`, not `"Psalm"`), plus `track`
  (`"scripture" | "prayer" | "devotional"`) used for the content-type label
  and color — display metadata only; see "guided lesson screens" below for
  what actually drives ordering and gating now.
- **Ordering:** `flattenPathEvents` (`src/lib/roadmap.ts`, premium only —
  see below) sorts every lesson into **one single chronological sequence**
  across the whole library, by `chronologicalOrder` — not grouped by book
  or track anymore. Each card's state comes from where it sits in that one
  line:
  - **`completed`** — checkmark badge on the image, green "Completed" chip.
  - **`current`** — the first not-yet-completed lesson in the whole
    sequence: a colored "UP NEXT" tag, an accent border/ring, and a
    "Continue" pill. There's exactly **one** current lesson for the whole
    library now, not one per book/track group as before.
  - **`sequenceLocked`** — everything after the current lesson. Names the
    specific lesson blocking it ("Complete 'Noah and the Flood' first").
    Nobody, on either tier, can skip ahead.
  - Only `completed`/`current` cards are tappable; tapping swaps the whole
    feed for that lesson's guided screen-by-screen flow — `LessonFlow.tsx`
    — with a "back to path" button.
- **Strict per-tier visibility (free tier):** free accounts never see
  `flattenPathEvents`'s full list at all — `PathEventList` renders exactly
  one card, from `nextLesson` (see "strict visibility and completion-gated
  rotation" below). There's no locked/dimmed card for anything else in the
  library; the rest simply isn't rendered.
- **Content-type color identity:** `CONTENT_TYPE_META`
  (`src/lib/contentType.ts`) holds each track's label, icon, and literal
  Tailwind class strings (image gradient, accent border/ring, button,
  badge) — Lessons stays `clay` (existing), Prayer is `dusk`, Devotion is
  `gold`, all built to the same 50/200/400/600/700 ramp and muted character
  as `clay`/`sage` in `globals.css`. Classes are all literal, defined once
  in this object — Tailwind's build-time scanner can't see a class
  assembled at runtime (`` `bg-${accent}-600` `` never works), so every
  consumer just indexes into the shared object instead. Locked cards stay
  neutral (`mist`) regardless of accent on purpose: richness belongs to
  what's active, not to what's out of reach.
- **Only `scripture` has real content today** — all 10 seeded lessons are
  that track (see "event-based stories" below), so every Prayer/Devotion
  card in the feed today is a preview of the color system rather than
  something to complete yet.

### The Path: strict visibility and completion-gated rotation

Both tiers now walk the **same single chronological sequence** — that's
the headline change from the earlier per-book-parallel-tracks design.
They differ only in how much of it is shown and the daily cap:

- **Premium** sees the whole sequence, unlocked and browsable, from day
  one — matching the "Full gamified lesson library" pricing copy. There's
  exactly one "current" lesson for the whole library (not one per book/
  track group as before this restructure), so premium's advantage is
  "sees the full list + higher daily cap," not "several parallel tracks."
  Only the daily *completions* ceiling applies
  (`PREMIUM_DAILY_EVENT_LIMIT`, 3/day) — a cost/abuse ceiling, not a
  meaningful product restriction.
- **Free tier** collapses to exactly **one active lesson, system-wide**.
  `nextLesson` (`src/lib/roadmap.ts`) sorts the whole library by
  `chronologicalOrder` and returns the first lesson not yet in
  `allTimeCompletedLessonIds`. That's the only card free tier's Path ever
  renders — and it's the same function premium's Today teaser uses too
  (see "Today: story teaser" above), since there's only ever one "next"
  lesson regardless of tier.
- **Completion-gated, not date-based.** There's no persisted
  rotation-position field anywhere — "today's active lesson" is always
  derived functionally from the all-time completed set (see "All-time
  completion tracking" above). The moment the active lesson is completed,
  the very next call to `nextLesson` returns the next one in the sequence —
  but `FREE_DAILY_EVENT_LIMIT` (1/day) still blocks completing a second one
  the same day, so in practice a free user advances exactly one lesson per
  day they complete something, and a skipped day just leaves the same
  lesson waiting rather than advancing or expiring.
- Once every lesson in the library has been completed, `PathEventList`
  shows a "You've completed every story in the library" message instead of
  a card — the library hasn't been designed to cycle back to the start yet.

### Upgrade prompt: hitting the free-tier daily cap

When a free-tier user completes their one event for the day,
`PathEventList` shows an enticing nudge instead of a plain locked state —
"You've completed today's story. Want more? Unlock 3 lessons a day with
Premium," with the same Monthly/Yearly checkout buttons (`handleUpgrade`,
Plisio) used everywhere else upgrade is offered. Premium sees the
equivalent state worded as a plain "come back tomorrow," with no upsell
(they're already subscribed). `suppressUpgradeNag` still hides this right
after checkout, while the upgrade is confirming on the network.

### The Path: event-based stories

Lesson content is narrative Bible events (Creation, the Red Sea, David and
Goliath, the Resurrection, ...) tied to a chapter-range reference, not
isolated verses — a content choice, not a schema change: `title`,
`scriptureReference` (now a range like `"Exodus 14:1-31"`), `summary` (the
narrative — what happens and why it matters), and `lessonBook` are the
same fields `LessonDoc` already had. The 10 stories in
`scripts/lessons-data.mjs` span both testaments across 7 books (Genesis,
Exodus, 1 Samuel, Daniel, Luke, Mark, John).

**Migration note:** these reuse the original 10 lesson IDs
(`day-01-creation` etc.) rather than retiring them for new ones — a
deliberate choice so re-seeding stays a plain content update with no
orphaned docs, at the cost of a user who'd completed the old single-verse
version of an ID showing as having completed the new story version too
(harmless over-credit, not under-credit).

### The Path: guided lesson screens

A lesson is a guided, one-screen-at-a-time sequence — `LessonFlow.tsx`
(`src/components/LessonFlow.tsx`) — not a single scrolling card. `LessonDoc`
(`src/types/firestore.ts`) shapes it as:

1. **Intro screen** — `imageUrl` (or the placeholder gradient+icon) and
   `summary`, the scene setup. Deliberately doesn't give away the ending —
   `resolution` does that on the final screen, so the two aren't redundant.
2. **One question screen per entry in `screens: LessonScreen[]`** — a
   progress bar and "X of N" indicator sit above every screen, and a back
   arrow lets the user step to the previous screen (not just exit to The
   Path — `PathEventList`'s own "back to path" link still does that at the
   outer level). Only the current screen's own prompt is ever shown — no
   scrolling past it to see the next one.
3. **Resolution screen** — `resolution` (what actually happened in
   Scripture) plus `nextHook` (a cliffhanger pointing at the next lesson in
   chronological order) in a separate callout. **This is where completing
   a lesson actually fires** — `completeLesson()` (`src/lib/db/lessons.ts`)
   needed **zero changes** for any of this restructure, since it only ever
   touched `lesson.id`/`lesson.xpReward`.

`LessonScreen` is a union of four types, each its own component inside
`LessonFlow.tsx`:

- **`scenario`** — "You're standing with the Israelites at the sea — what
  do you say to Moses?" Free text, no right/wrong answer; advancing just
  requires something written. The text is saved via `saveLessonAnswer`
  (`src/lib/db/lessonAnswers.ts`) to `users/{uid}/lessonAnswers/{lessonId}_
  {screenId}` — preserved, never graded, same spirit as the prayer journal
  below. Writing again (e.g. after stepping back to revise) just overwrites
  the same doc, unlike the prayer journal's immutability.
- **`multipleChoice`** — a recall question with plausible distractors.
  Picking `correctIndex` unlocks Continue; a wrong pick shows a gentle "not
  quite" and stays open to retry — never a dead end, matching the app's
  tone everywhere else.
- **`shortAnswer`** — a typed, **self-marked** reflection: the user answers,
  taps "Check my thinking" to reveal it was worth writing down, then
  Continue. Not an auto-graded exact match — those tend to false-negative a
  reasonable but differently worded answer, which would undercut the
  app's grace-first tone.
- **`verseBlank`** — the existing Duolingo-style fill-in-the-blank activity,
  reused as one screen type among several rather than a lesson's only
  interactive content. Its `activity` field is the same `VerseActivity`
  shape as before (`{ verses: VerseBlank[], wordBank: string[] }`) — up to
  5 of the passage's most important verses (fewer when the passage doesn't
  have that many worth quizzing), each with a `template` marking blanks
  with the literal substring `BLANK_TOKEN` (`"_____"`). Verse selection
  favors the passage's most quotable line(s) or its theological/narrative
  turning point, not necessarily its first verse — e.g. Noah and the Flood
  picks the rainbow-covenant verse (9:13) over the flood's opening or
  mechanics, a judgment call made case by case.

`FillBlankCard` (`src/components/FillBlankCard.tsx`) itself is **completely
unchanged** by this restructure — it already took `activity`/`track` props
independent of how it was embedded, so it drops straight into a
`verseBlank` screen. It renders every verse on its own line (with a
reference label), flattens their blanks into one running sequence so the
word bank fills them in document order, shuffles the bank for display, and
checks all blanks across the whole activity at once. On a wrong attempt: a
gentle "Not quite — take another look and try again" with a reset, never a
locked-out failure state.

**Contrast:** word-bank pills and a filled-but-unchecked blank use
`CONTENT_TYPE_META.activeBgClass` (`src/lib/contentType.ts`) — each
track's own color at its ramp's darkest (`-700`) shade, not the `-600`
`solidBgClass`/`buttonClass` used elsewhere (the "current" card badge,
the Continue pill). This is deliberate, not cosmetic: at the small pill
size these sit at, `-600` against the paper background measures under
WCAG's 4.5:1 text-contrast floor for clay and gold (~3.4-3.5:1) and reads
as washed out; `-700` clears it comfortably (~4.9-6.6:1 across all three
tracks) — a real production complaint, not a hypothetical one. Correct
turns solid sage-700; incorrect turns solid `ink` (the app's core near-
black text color, repurposed as a background here) rather than a deeper
shade of the track's own color, specifically so it's never the same color
as the pending/active state it's transitioning from — sage and ink also
mean "correct"/"incorrect" read the same regardless of which track's
color the activity happens to be in. No red anywhere, matching the app's
never-shaming tone. The empty-blank placeholder is a light tint fill
(`-50`) plus a bold `-700` dashed border (`emptyBlankClass`) — a real box
shape at a glance, not the previous unfilled `-400` dashed outline that
was nearly invisible. The completion/XP backend (`completeLesson`,
`src/lib/db/lessons.ts`) needed **zero changes** — it only ever touched
`lesson.id`/`lesson.xpReward`, unaffected by this.

**Migration note:** all 10 seeded lessons moved from the old single-card
shape (`summary` + one embedded `verseActivity`) to this screen-flow shape
in the same pass that added `chronologicalOrder`/`imageUrl` — every
lesson's `verseActivity` became a `verseBlank` entry inside `screens`,
each also gained a `scenario`, `multipleChoice`, and `shortAnswer` screen,
and each got a `resolution`/`nextHook`. `npm run seed:lessons`
(`scripts/seed-lessons.mjs`) explicitly `FieldValue.delete()`s the old
flat `lessonType`/`template`/`answers`/`wordBank` fields (from the
original reading/fillBlank split) *and* the old top-level `order`/
`verseActivity` fields (from the single-card era) on existing docs —
otherwise `merge: true` would leave them stranded alongside the current
shape rather than replacing them.

**A schema change alone doesn't update already-written documents** —
`npm run seed:lessons` has to actually be re-run against a project for its
existing `lessons` docs to gain the current shape. Until that happens,
`fetchLessons()` (`src/lib/db/lessons.ts`) runs every doc through
`isValidLessonDoc` (checks `summary`/`resolution`/`nextHook` are strings,
`chronologicalOrder` is a number, and `screens` is a non-empty array where
every entry matches its declared `type`) and **drops any doc that fails
it**, logging `console.error` with the doc ID rather than returning it —
this is the fix for a real incident, during the previous single-card
schema, where a still-unmigrated doc's missing `verseActivity` crashed
`FillBlankCard` (`activity.verses` on `undefined`) and took down the whole
lesson-detail page with a generic Next.js error screen. A user on free
tier, whose one visible lesson is whichever unmigrated doc sorts first,
would see this on every open; a premium user browsing the rest of the
library might not hit an affected doc at all — same root cause,
tier-shaped only by which lesson each tier happens to load. A
filtered-out lesson simply doesn't appear (same "nothing to show yet"
experience as an empty collection) until it's re-seeded correctly, and
`src/app/error.tsx` is a last-resort boundary so any other unexpected
render error shows a friendly retry card instead of a blank page.

### The Path: prayer journal

Below the lesson feed, `PathTab.tsx` renders `PrayerJournal.tsx` — a place
to write a free-text prayer instead of only reading guided ones. Submitting
awards XP the same way completing a lesson does: `submitPrayer`
(`src/lib/db/prayers.ts`) runs the same shape of transaction as
`completeLesson` (`src/lib/db/lessons.ts`) — a write, a streak check-in
(only once per day; a second prayer the same day still saves, it just
doesn't re-award the streak bonus), and a `check_ins` record (using the
`"prayer"` `CheckInType`, which already existed in the schema — this
feature seems to have been anticipated). Unlike lessons, there's **no
daily cap** on prayer submissions, free or premium — nothing in the
feature asked for one, so none was added.

- **Storage:** `users/{uid}/prayers/{prayerId}` — a subcollection, not a
  flat top-level collection with a `userId` field, mirroring
  `conversations/{uid}/messages`'s pattern (ownership via the uid path
  segment). Unlike that collection, the client writes here directly (no
  server-side routing logic to protect), but entries are **immutable**
  once created — `firestore.rules` denies `update`/`delete` entirely; this
  is a journal, not an editable note, and v1 doesn't need editing.
- **"My Prayers"** is a collapsible list under the input, newest first,
  subscribed live via `subscribeToPrayers`.
- **Verified**: 8 new emulator rules tests (own-uid write, id-must-match-
  docId, empty-text rejected, cross-user write denied, immutable), plus a
  full transactional test against the emulator (not just rules in
  isolation) confirming the prayer, streak, and XP all commit together
  correctly in one atomic write.

### The Armory

Scripture grouped by struggle — "the sword of the Spirit, which is the word
of God" (Ephesians 6:17) — content lives in `src/lib/armory.ts` as static
data (`ARMORY_CATEGORIES`: Lust, Anger, Envy, Fear, each with a handful of
verses), not a Firestore collection, since it's reference content rather
than anything user- or dashboard-driven. The verse wording is given in
common, widely-recognized phrasing close to public-domain translations —
worth checking against your preferred translation before treating it as an
exact quote.

### Peter's Watch: AI chat

Free tier sees a blurred, illustrative preview of the chat concept (no
Firestore, no network — just static markup) under the same
`UnlockCard`/`blurredPreviewClass` pattern as The Armory. Premium unlocks a
real chat with Claude, styled as ordinary message bubbles: Peter opens
("Tell me what's on your mind today."), the user types, and one of three
apostles replies.

- **Where the logic lives.** `src/lib/chat-apostle.ts` is a small,
  dependency-free module (no Firestore, no Anthropic SDK) holding:
  - `isCrisisMessage(text)` — a deterministic, regex-based first-layer
    safety net (self-harm/suicide language) checked **before** any call to
    Claude. If it fires, the reply is always the same fixed
    `CRISIS_RESPONSE` string — never model-generated — pointing to 988 (US)
    or findahelpline.com and encouraging the user to reach a real person.
  - `routeApostle(text)` — simple, ordered keyword matching deciding who
    replies: doubt/discouragement language → **Thomas**, positive/
    encouragement-worthy language → **John**, everything else (the default,
    including ordinary accountability content) → **Peter**. Intentionally
    simple per spec — "good enough," not sentiment analysis.
  - `systemPromptFor(apostleId)` — builds each apostle's system prompt from
    the `characteristic`/`tone` strings already in `src/lib/apostles.ts`
    (shared with the notification system, so the voice is consistent app-
    wide), plus shared guidelines: short replies, never shame or diagnose,
    always point back to grace and a concrete next step, be honest if asked
    whether it's a real person, and defer to the crisis instructions above
    if the model itself picks up on subtler crisis language the first-layer
    regex list misses.
  - All three are covered by a scratch unit-test pass (not checked into the
    repo as a script, run ad hoc) verifying the crisis short-circuit,
    apostle routing including a doubt-vs-encouragement tie-break, and that
    each system prompt carries the expected persona and safety language.
- **The route.** `POST /api/watch-chat` (`src/app/api/watch-chat/route.ts`)
  verifies the caller's ID token, re-checks `tier === "premium"` server-side
  (defense in depth beyond the UI gate — the same discipline as the daily
  lesson cap), writes the user's message to Firestore, runs the crisis
  check, and — if it didn't fire — checks the daily message limit (below),
  and if there's still quota left, fetches the last 20 messages as
  conversation history, routes to an apostle, and calls Claude via the
  official `@anthropic-ai/sdk` (model `claude-opus-5`, `effort: "low"`,
  `max_tokens: 400` — a short chat reply doesn't need more). It checks
  `stop_reason === "refusal"` before reading the response and falls back to
  a gentle, hard-coded line if the model declines to answer. Both the user's
  message and the reply are written via the Admin SDK, which is why clients
  can't write to `conversations` directly (see "Security rules" above).
- **Daily message limit.** `WATCH_CHAT_DAILY_LIMIT` (15, in
  `src/lib/chat-apostle.ts`) caps how many user messages get a real Claude
  reply per calendar day — generous, not a stingy trickle, but enough to
  keep API cost predictable. Enforced with a per-user-per-day Firestore
  counter, `watch_chat_usage/{uid}_{date}` (`FieldValue.increment(1)` via
  the Admin SDK; `date` is client-supplied, the same accepted trade-off
  already documented on `daily_lesson_progress` — a cost control, not a
  security boundary). It's fully server-only: `firestore.rules` denies
  clients read *and* write on it outright, since nothing client-side ever
  needs to touch it directly. **Crisis messages are exempt** — the crisis
  check runs first and always gets a response, cap or no cap. Once the cap
  is hit, the route skips Claude entirely and instead writes one of four
  in-character closing lines (`pickClosingMessage()`, randomly chosen, in
  whichever apostle the message would have routed to) with
  `limitReached: true` on that message doc — a real bubble in the
  conversation, not an error banner. The client derives "today's cap is
  hit" purely by checking whether the *last* stored message carries that
  flag and falls on today's date (`WatchTab.tsx`) — no separate usage-doc
  read needed — and swaps the input row for a quiet "{Apostle} will be
  back tomorrow" note instead of graying out a still-functional box.
- **The client.** `src/lib/db/conversations.ts` subscribes to a user's
  message history in order; `src/lib/watch-chat.ts` posts a new message
  (with the user's local date, for the daily limit) to the route.
  `WatchTab.tsx` shows the running conversation, an apostle name + small
  icon (`ApostleAvatar`) next to every assistant bubble, a "…" pending
  indicator while waiting on a reply, and a visible (not silent) error
  with the draft text preserved if a send fails.
- **What's verified vs. not from this sandbox.** The crisis-detection and
  apostle-routing logic, the daily-limit constant and closing-message
  variety, the system prompts, the Firestore rules (via
  `npm run test:rules`, including `watch_chat_usage`'s deny-all), and the
  chat UI's layout/styling in both a normal and a limit-reached state (via
  a mocked, non-committed dev-preview route and Playwright screenshots) are
  all checked. **An actual end-to-end call to Claude is not** — this
  sandbox has no `ANTHROPIC_API_KEY` and `api.anthropic.com` reachability
  from here is unconfirmed. Verify a real round trip once
  `ANTHROPIC_API_KEY` is set in your environment.
- **Environment variable.** Add `ANTHROPIC_API_KEY` (from
  [console.anthropic.com](https://console.anthropic.com/settings/keys)) to
  `.env.local` locally and to Vercel under **Project Settings → Environment
  Variables** before this feature will work in production — server-only,
  never prefixed `NEXT_PUBLIC_`.

Partner matching (an older idea for this tab — pairing two users up as
accountability partners) was replaced by the AI chat above and isn't built.
`check_ins` and `accountability_links` still exist in the schema and rules
(and are still covered by `npm run test:rules`) in case that's revisited
later, but nothing in the UI reads from them anymore —
`src/lib/db/accountability.ts` (the old `subscribeToCheckInHistory`/
`subscribeToAccountabilityLink` helpers) was deleted as dead code once
`WatchTab.tsx` stopped using it.

### The Armory & Peter's Watch: the shared locked-preview pattern

Both premium-gated tabs use `src/components/PremiumGate.tsx`:
`UnlockCard` (the lock icon + copy + "Unlock — Monthly $6.99" / "Yearly
$59.99" buttons, wired to the same Plisio checkout as everywhere else) and
`blurredPreviewClass` (a `blur`/`opacity`/`pointer-events-none` utility
string) applied by each tab around whatever content should read as "real,
but locked" — category names and section headers stay crisp; the actual
verses or check-in rows underneath are blurred, not hidden outright, so a
free user can see enough to want it rather than hitting an immediate
popup.

`UnlockCard` also renders `SecureCheckoutNote` (same file) just below its
buttons — a small `bg-clay-50` note with a shield icon, framed around the
user's benefit ("keeps fees low... no card details ever stored") rather
than as an apology for using crypto, or a technical explanation of how
Plisio works. It's exported separately so `PricingSection.tsx` (the
landing page's pre-signup pricing card, which can't use `UnlockCard`
itself — there's no signed-in user yet to check out) shows the identical
note under its own CTA, so the expectation is set the first time anyone
sees a payment button, not just at checkout.

### The Word

A general Bible reader, free for everyone, never gated. Verse text comes
from **bible-api.com** (free, public-domain World English Bible
translation, no API key) via a server-side proxy,
`src/app/api/bible/route.ts` — proxied rather than called directly from the
browser so CORS/error-handling live in one place and the third-party
dependency isn't hardcoded into client code. `src/lib/bible.ts` holds the
client-side `fetchChapter()` helper and the full 66-book/chapter-count list
that drives the book/chapter picker. **Not exercised against the live API
from this environment** — bible-api.com is blocked by this sandbox's
egress proxy, confirmed via a direct request that correctly produced the
route's own "Could not reach the Bible text source" error rather than
crashing — so verify it end-to-end once deployed somewhere without that
restriction.

The reading layout: a chapter header card (serif "Book Chapter" title above
labeled book/chapter selects) followed by the verse list, each verse a
small circular number badge next to serif text with generous line-height
and spacing between verses — reading as a designed page rather than a wall
of plain text. Tapping a verse opens a labeled 3-color highlight picker
(Clay/Sage/Stone); `highlightVerse`/`removeHighlight`
(`src/lib/db/highlights.ts`) write to `user_highlights`, keyed by
`{uid}_{book}_{chapter}_{verse}` so a user has at most one highlight per
verse — picking a new color overwrites it rather than stacking duplicates.
`subscribeToHighlights` loads a user's highlights across every book/chapter
they've ever read in one listener, filtered client-side to whatever
chapter is currently open. Every highlight/remove write shows a "Saving…"
state and a clear error on failure instead of assuming success — a write
that's silently rejected (the undeployed-rules issue above) used to look
identical to one that worked, which is what actually made highlighting
feel unreliable; now a failure is visible instead of silent.

## Profile

A profile avatar button sits at the top-right of the header
(`ProfileButton`, `src/components/ProfileButton.tsx`) on every tab — not
one of the 5 in the bottom bar — and opens a dedicated Profile page
(`ProfilePage.tsx`) in its place, with its own back button; "Sign out"
lives here now instead of the main header.

- **Photo.** Tapping the small camera badge on the avatar opens a file
  picker; `uploadProfilePhoto` (`src/lib/storage.ts`) uploads to Firebase
  Storage at `avatars/{uid}` (one file per user — re-uploading overwrites
  it, no orphaned old files) and the resulting download URL is saved to
  `users/{uid}.photoURL` (`updateUserProfile`, `src/lib/db/users.ts`) — the
  same field Google sign-in already populates, so both paths feed the one
  field the rest of the app reads. `storage.rules` caps uploads at 5MB and
  requires an image content type; `uploadProfilePhoto` checks the same
  limits client-side first for a fast, clear error.
- **Display name.** An editable field over the same `users/{uid}.displayName`
  already in the schema, saved explicitly (a "Save name" button, disabled
  until the value actually changes) rather than auto-saving on every
  keystroke.
- **Highlighted Verses.** Every highlight from `user_highlights`
  (`subscribeToHighlights`), newest first, each its own card — reference,
  the verse text stored on the highlight itself (no re-fetch), and a notes
  textarea (`updateHighlightNote`) with its own "Save note" button, dirty
  only enabling once the text actually changes from what's saved.
- **Your Plan.** A status card (`PlanCard`, inside `ProfilePage.tsx`) driven
  entirely by the existing `users/{uid}` doc — no new Firestore reads.
  - **Free**: a "Free" badge, a one-line summary of what Premium adds
    (The Armory, Peter's Watch, the full library with 3 lessons and 15
    prayers a day instead of 1 and 3 — see "Daily caps" above), and the
    same `UnlockCard`
    component used on The Armory/Peter's Watch's paywalls — not a
    separate, near-duplicate upgrade button, the literal same component
    and checkout flow.
  - **Premium**: a "Premium" badge, plus `planId` ("Monthly"/"Yearly", if
    set — see below) and `premiumUntil` ("Access through {date}", if set)
    each shown only when present. Deliberately says "**access through**",
    never "renews on" — Plisio payments are one-time, not auto-renewing,
    so implying a renewal date would be a false claim. If neither field is
    set (a grant made before `planId` existed, or any other gap), it falls
    back to a plain "Premium member" — no invented date.

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
  "completed"`, writes `tier: "premium"`, `premiumSince` (now), `premiumUntil`
  (`premiumSince` + 30 days for monthly or 365 for yearly — both computed
  from the same `Timestamp.now()` call, so the relationship between them is
  exact, not approximate), and `planId` (`"monthly"` | `"yearly"`, parsed
  from the same `order_number` the webhook already splits apart) on the
  user's Firestore doc via the Admin SDK (bypassing `firestore.rules`,
  which is exactly why only this server-side path can grant premium — see
  the `users` rule above; all four are locked from client writes the same
  way). `premiumUntil`/`planId` power Profile's "Your Plan" section (see
  "Profile" above) and the expiry cron below.
- `/premium/success` and `/premium/failed` — plain pages Plisio redirects the
  browser to after checkout, independent of the webhook (the webhook is what
  actually grants premium; these pages are just user-facing confirmation).

### Environment variables

| Variable | Used by | Notes |
| --- | --- | --- |
| `PLISIO_SECRET_KEY` | create-invoice, webhook | Plisio dashboard → API keys. Server-only — never prefixed `NEXT_PUBLIC_`, never sent to the browser. |
| `FIREBASE_PROJECT_ID` | create-invoice, webhook, watch-chat (Admin SDK) | From a Firebase service account — see below. **Must exactly match** `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — a mismatch makes every ID token fail verification, not just some. |
| `FIREBASE_CLIENT_EMAIL` | create-invoice, webhook, watch-chat (Admin SDK) | Same service account. |
| `FIREBASE_PRIVATE_KEY` | create-invoice, webhook, watch-chat (Admin SDK) | Same service account — see the exact paste format below; a mis-pasted value is the most common way this whole setup breaks. |

Generate the Admin SDK credential at Firebase console → **Project settings →
Service accounts → Generate new private key**. This downloads a JSON file —
copy `project_id`, `client_email`, and `private_key` from it into the three
`FIREBASE_*` variables above (separate from `serviceAccountKey.json`, which
is only used locally by `npm run seed:lessons`). Add all four variables
(this repo's `PLISIO_SECRET_KEY` plus the three `FIREBASE_*` ones) to Vercel
under **Project Settings → Environment Variables** before payments — or
Peter's Watch, or Profile's "Your Plan" — will work in production.

**`FIREBASE_PRIVATE_KEY`'s exact expected format:** open the downloaded JSON
in a plain text editor and copy everything between (not including) the
quotes on the `"private_key": "..."` line — that text already looks like
`-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n`, with
literal two-character `\n` sequences rather than real line breaks, because
that's how JSON represents a multiline string. **Paste exactly that into
Vercel's value field — nothing more:**
- Do **not** add quotes around it — Vercel's field is not JSON, and a
  leftover pair of quotes from copying too much of the JSON line is the
  single most common way this breaks (`src/lib/firebase-admin.ts` now
  strips a single matching pair defensively, but don't rely on that).
  Pasting the real, multiline PEM text directly (actual line breaks, no
  `\n` at all) into Vercel's field also works — `normalizePrivateKey()` in
  that same file accepts either shape.
- Don't hand-edit the `\n` sequences into real newlines yourself; the app
  does that at runtime (`normalizePrivateKey()` in
  `src/lib/firebase-admin.ts`, which also tolerates a Windows-style
  `\r\n`-escaped key and trims stray whitespace from the copy).
- If the value is wrong in a way that isn't just escaping — truncated,
  missing the `BEGIN`/`END` lines — the app now fails immediately with a
  clear `FIREBASE_PRIVATE_KEY doesn't look like a valid PEM private key...`
  error instead of a cryptic downstream crypto failure; see "Diagnosing
  'Your session has expired'" below for where that shows up in Vercel's
  logs.

### Paste these into Plisio's dashboard

Once deployed, give Plisio your production domain with these paths
(`https://<your-domain>` + the path), matching what `create-invoice`
already sends as `callback_url`/`success_invoice_url`/`fail_invoice_url`:

- Webhook / callback URL: `/api/plisio/webhook`
- Success URL: `/premium/success`
- Failed URL: `/premium/failed`

### Premium expiry

Plisio payments are one-time invoices, not an auto-renewing subscription —
without something checking `premiumUntil`, a user who pays once would stay
Premium forever. Two pieces close that gap:

- **The daily cron.** `GET /api/cron/expire-premium`
  (`src/app/api/cron/expire-premium/route.ts`), scheduled once a day by
  Vercel Cron via the `crons` entry in `vercel.json`
  (`"schedule": "0 6 * * *"`, 06:00 UTC — Vercel may shift this slightly on
  the Hobby plan, which batches cron triggers for cost reasons). It queries
  `users` where `tier == "premium"` — a single equality filter, deliberately
  not combined with a range filter on `premiumUntil` in the query itself,
  since that combination needs a Firestore composite index and this project
  has already been bitten once by config that was written but never
  actually deployed (see "Known limitations" below) — then filters to
  actually-expired users in code (`isPremiumExpired`, `src/lib/premium.ts`)
  and batch-writes `tier: "free"` for each (Firestore batches cap at 500
  writes, so it chunks). `premiumSince`/`premiumUntil`/`planId` are left in
  place as a historical record of the last grant, not cleared.
- **Securing it.** The route requires `Authorization: Bearer
  ${CRON_SECRET}` (a new env var — see below) — Vercel automatically
  attaches this header on cron-triggered invocations once `CRON_SECRET` is
  set, so add it to Vercel the same way as the other env vars. Without a
  matching header the route returns 401, so a random request to the URL
  can't trigger a mass downgrade.
- **The renewal reminder.** `Dashboard` (`src/app/page.tsx`) shows an
  in-app banner ("Your Premium access ends in N days — renew to keep it")
  during the last `RENEWAL_REMINDER_WINDOW_DAYS` (3, `src/lib/premium.ts`)
  days before `premiumUntil`, with a "Renew now" button that starts a
  fresh checkout for the same `planId` the user is already on (falling
  back to monthly if `planId` is unset — a legacy grant from before that
  field existed). No push notification — that infrastructure doesn't
  exist in this app; an in-app banner is what the feature request's
  fallback option asked for when push isn't already set up.
- **`src/lib/premium.ts`** holds all three pieces of logic
  (`daysUntilExpiry`, `shouldShowRenewalReminder`, `isPremiumExpired`) as
  dependency-free pure functions — no Firestore import either way — so the
  identical day-counting math runs on both the client (the banner) and the
  server (the cron), and so it's unit-testable without a database.

**Environment variable:**

| Variable | Used by | Notes |
| --- | --- | --- |
| `CRON_SECRET` | `/api/cron/expire-premium` | Any long random string (e.g. `openssl rand -hex 32`). Add it to Vercel **before** the cron job's first scheduled run — Vercel only attaches the `Authorization` header automatically once this env var exists. |

**Verified from this sandbox** by seeding six users into the Firestore
emulator (two expired premium grants of different plans, one still
active, one expiring soon but not yet, one free, and one premium grant
with no `premiumUntil` at all — a legacy-data edge case) and running the
actual compiled route against them through a real local production
server: it correctly downgraded exactly the two expired users and left
the other four untouched (confirmed independently by re-reading Firestore
afterward, not just trusting the route's own response), and re-running it
immediately after downgraded zero more — idempotent, as a job re-triggered
by a retry or a manual re-run needs to be. The auth check was verified
too: no header and a wrong secret both correctly return 401.

**Not verifiable from this sandbox:** whether Vercel has actually
registered and is triggering the cron job in production — that's
Vercel-side state with no local equivalent (this sandbox has no Vercel
dashboard or API access; see the "Could not start checkout" troubleshooting
entries above for the same limitation hit repeatedly with Plisio/Firebase
config). **After deploying, confirm it yourself:** Vercel dashboard → your
project → **Settings → Cron Jobs** (or the **Cron Jobs** tab) should list
`/api/cron/expire-premium` with a next-run time; after it's fired at least
once, its invocation shows up there with a status, and in **Deployments →
[latest] → Functions/Logs** filtered to `cron/expire-premium` you should
see the `cron expire-premium: checked N premium users, downgraded M` line
this route logs on every run.

### Fixed: "Could not start checkout" was a `jose` ESM/CJS crash, not credentials

Clicking an Unlock button (The Armory, Peter's Watch, or Profile's "Your
Plan") used to show this error instead of redirecting to Plisio. It was
first suspected to be a stale `PLISIO_SECRET_KEY` after a key rotation —
**that suspicion was wrong.** The real cause, found in Vercel's function
logs (`Error: require() of ES Module ... not supported`), was a
third-party ESM/CJS incompatibility, unrelated to Plisio credentials
entirely:

- **Root cause.** `firebase-admin/auth` (used by every route that verifies
  a caller's ID token — `create-invoice`, `webhook`, `watch-chat`, all via
  `src/lib/firebase-admin.ts`) eagerly `require()`s a chain that ends at
  `jose`, the JWT/JWK library: `firebase-admin/auth` → `lib/auth/base-auth.js`
  → `lib/utils/jwt.js` → `jwks-rsa` → `jose`. `firebase-admin@14.4.0` pins
  `jwks-rsa@^4.0.1`, which depends on `jose@^6.1.3` — and **jose v6 is
  pure ESM** (`"type": "module"`, no CommonJS build at all). The moment
  anything imports `firebase-admin/auth`, Node tries to `require()` that
  ESM-only package and throws, *before any of our own route logic ever
  runs* — so every call to any of those three routes failed identically,
  regardless of the Plisio key, the plan, or the ID token's validity.
  (It didn't reproduce locally in this environment because this sandbox's
  Node 22.22 supports `require()`-ing synchronous ESM graphs, a fairly
  recent Node feature — Vercel's deployed runtime evidently doesn't have
  it, which is exactly why this only surfaced in production.)
- **The fix.** `package.json` pins `jose` to its last version with a real
  CommonJS build via npm's `overrides` field:
  ```json
  "overrides": { "jose": "^4.15.9" }
  ```
  This forces `jwks-rsa`'s `require('jose')` to resolve to
  `jose@4`'s `./dist/node/cjs/index.js` instead of `jose@6`'s ESM-only
  entry — no code changes needed, since `jose@4` exposes the same
  `importJWK`/`exportSPKI` APIs `jwks-rsa` calls with compatible
  signatures. (`transpilePackages`/`serverExternalPackages` were
  considered but wouldn't have helped: this is Node's own `require()`
  refusing to load a real ESM module, not a webpack bundling artifact —
  the version conflict had to be resolved, not routed around.)
- **How this was verified**, all from this sandbox (`api.plisio.net`
  itself is still unreachable here, but nothing above needed it):
  `node -e "require('firebase-admin/auth')"` after the override resolves
  cleanly; `jwks-rsa`'s exact `importJWK`/`exportSPKI` calls were run
  directly against the pinned `jose@4` build and succeeded; and a full
  local production build (`next build && next start`) hit all three
  affected routes (`create-invoice`, `webhook`'s shared import, and
  `watch-chat`) with a bogus bearer token — each returned a clean, expected
  `{"error":"Your session has expired — sign in again."}` (401) instead of
  crashing, confirming the whole `verifyIdToken` → `jwks-rsa` → `jose` path
  now runs end-to-end without the module-loading error.
- **After deploying this**, Vercel's function logs for `create-invoice`
  should show no more `ERR_REQUIRE_ESM` errors, and clicking Unlock should
  reach Plisio and either redirect to a real invoice page or, if something
  else is still wrong (e.g. the key genuinely is stale), surface one of the
  route's own specific error messages instead of the generic fallback —
  which would then point at an actual Plisio-side problem, not this one.

### Diagnosing "Your session has expired" on a fresh sign-in

The ESM/CJS crash above happened at *import* time — before any request
ever reached `verifyIdToken()`. Once it was fixed, `verifyIdToken()` ran
for the first time in production and could, in principle, fail for a
completely different, previously-invisible reason. Two changes make that
diagnosable instead of a generic, unexplained 401:

- **`src/lib/firebase-admin.ts` now checks `FIREBASE_PROJECT_ID` (Admin
  SDK) against `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (client) on first use**,
  and logs a specific, loud warning if they don't match. This is the #1
  real-world cause of "every ID token fails, even a fresh one": Admin SDK
  `verifyIdToken()` rejects a token outright if its `aud` (audience) claim
  doesn't equal the project the Admin SDK was initialized with — and that
  check has nothing to do with whether the token is actually expired, so
  it fails identically for a token that's 2 seconds old or 2 hours old.
- **Every route that calls `adminAuth().verifyIdToken()`**
  (`create-invoice`, `watch-chat`) **now logs the specific Admin SDK error**
  via `logTokenVerificationError()` (same file) before returning the
  generic client-facing message — previously the `catch` block discarded
  the real error entirely, so a project-ID mismatch, a genuinely expired
  token, and a malformed token all looked identical in the logs (nothing
  at all). Check Vercel's function logs for a line like
  `plisio create-invoice: ID token verification failed (code=..., ...)` —
  the `code` (e.g. `auth/argument-error`) and message name the exact cause.

**Verified from this sandbox** by reproducing the failure directly against
firebase-admin's real verification code — no live credentials or network
access to Google's cert endpoint needed, since the project-ID check runs
before any signature/network step: a throwaway RSA keypair plus a
hand-built token were used to initialize the Admin SDK against one project
ID while presenting a token audienced to another, and to confirm the
reverse (matching project IDs) produces a different, expected error
instead. The full local production server was hit both ways:
- **Mismatched `FIREBASE_PROJECT_ID`**: logged both the startup warning
  and `ID token verification failed (code=auth/argument-error): Firebase
  ID token has incorrect "aud" (audience) claim. Expected
  "davar-app-WRONG-PROJECT" but got "davar-app". Make sure the ID token
  comes from the same Firebase project as the service account used to
  authenticate this SDK.` — exactly the class of error this feature is
  built to surface.
- **Matching `FIREBASE_PROJECT_ID`**: no mismatch warning (confirmed no
  false positive), and verification failed for the expected different
  reason instead (an unrecognized `kid`, since the test token wasn't a
  real Google-signed one) — confirming the code path runs past the
  project-ID check normally once the IDs agree.

If this happens again: the very next request's logs will name the exact
Admin SDK error code and message, which points straight at the fix —
matching `FIREBASE_PROJECT_ID` to the real client project if it's an
`auth/argument-error` "aud" mismatch, or regenerating the service account
key in Vercel if it's a credential/signing error.

**What this logging actually caught in production:** the real error was
`code=app/invalid-credential): Failed to parse...` — a malformed
`FIREBASE_PRIVATE_KEY`, not a project-ID mismatch. `src/lib/firebase-admin.ts`
already had `.replace(/\\n/g, "\n")` to un-escape a JSON-pasted key, but two
realistic paste mistakes still broke it (confirmed by parsing each variant
with Node's own `crypto.createPrivateKey()`, not just pattern-matching the
string): a leftover pair of surrounding quote characters, and a
Windows-edited key whose newlines were escaped as `\r\n` instead of `\n`.
`normalizePrivateKey()` (same file) now handles both, plus a real multiline
paste with no escaping at all, plus stray whitespace from the copy — and if
the value is broken in some *other* way, `adminApp()` now fails immediately
with a specific "doesn't look like a valid PEM" error instead of the
Admin SDK's cryptic downstream parse failure. See the exact expected paste
format under "Environment variables" above.

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
- **No subscription/recurring billing.** Each payment is a one-time crypto
  invoice; there's no automatic renewal — a user re-runs checkout manually
  (the renewal-reminder banner's "Renew now" button, or any Unlock button)
  when their `premiumUntil` is approaching or has passed. Expiry itself
  *is* enforced now — see "Premium expiry" above — this limitation is only
  about there being no auto-charge.

## Apostle Companion

Every in-app nudge is attributed to one of four apostles rather than a
generic "notification" — each stands for a different kind of moment, drawn
from their own story:

| Apostle | Notification type | Tone |
| --- | --- | --- |
| Peter | Accountability / check-in nudges | Bold, restorative — a stumble isn't the end |
| Matthew | Progress & stats recaps | Precise, detail-oriented |
| John | Daily gentle encouragement — now a permanent fixture on Today (`MascotHero`), not part of the rotation below | Warm, relational |
| Thomas | Reassurance during doubt / low motivation | Honest about doubt, still points to faith |

- `src/lib/apostles.ts` — the data model: `APOSTLES` (name, one-line
  scriptural characteristic, tone, and a message-template array per
  apostle) and `APOSTLE_FOR_TYPE`, the **fixed** type → apostle mapping
  (Peter always sends check-in nudges, never Matthew). Which message
  within that apostle's own list is shown is picked by
  `pickApostleMessage(apostle, seed)` — deterministically hashed from a
  `${uid}-${date}-${type}` seed rather than `Math.random()`, so it's stable
  across re-renders/navigation within a day (no flicker) but still varies
  day to day and user to user. `formatApostleMessage` fills
  `{streak}`/`{longest}`/`{xp}`/`{level}` placeholders (used by Matthew's
  recap templates).
- `src/lib/apostle-moment.ts` — `pickApostleMoment(ctx)` decides which
  *type* applies right now from simple dashboard state, in priority order:
  not checked in today → Peter; checked in but the streak just reset after
  being longer → Thomas; checked in on a 7-day streak milestone → Matthew;
  otherwise → **null** (no rotating card that day — John's own permanent
  slot on Today already covers the "steady baseline" role, so there's no
  encouragement fallback case here anymore).
- `src/components/ApostleAvatar.tsx` / `ApostleMessageCard.tsx` — the UI
  surface for Peter/Matthew/Thomas: each gets a small distinct icon (a key
  for Peter, a ledger for Matthew, an eye for Thomas) in the existing
  clay/sage/neutral palette — no new colors — so apostles are told apart by
  glyph, not by introducing new hues. The card shows the apostle's name and
  avatar next to their message on the dashboard (`src/app/page.tsx`,
  `Dashboard`), only when `pickApostleMoment` returns non-null.
- **John's mascot hero** (`src/components/MascotHero.tsx`) — always
  visible at the top of Today, using his full-body portrait
  (`public/apostles/john.png`, the same asset the landing page crops to a
  square — see "Companion portraits" below) next to a speech-bubble card.
  The bubble shows the current streak ("Day {n}") plus a short
  encouragement line, picked the same deterministic way as the rotation
  above (`pickApostleMessage(APOSTLES.john, ...)`, stable all day, new
  tomorrow) but always from John's message list — never conditional,
  never rotated away.
- **Companion portraits.** The landing page's "Meet your companions" screen
  shows a character portrait per apostle from
  `public/apostles/{peter,matthew,john,thomas}.png` (`CompanionPortrait` in
  `src/app/page.tsx`, via `next/image`, cropped to a square on the top of
  the image). If a file is ever missing or fails to load, it falls back to
  that apostle's `ApostleAvatar` icon instead of a broken-image icon, so
  the screen never looks unfinished — replace a file to update that
  apostle's portrait.

## Auth & streak logic

- `src/lib/auth-context.tsx` — `AuthProvider`/`useAuth()`: email+password and
  Google sign-in, wired up in `src/app/layout.tsx`. On first sign-in it calls
  `ensureUserDoc` (`src/lib/db/users.ts`) to create the `users/{uid}` doc.
- `src/components/AuthForm.tsx` — sign-in/sign-up form. The signed-out home
  page (`src/app/page.tsx`) is a short, swipeable 5-screen onboarding
  carousel rather than a long scroll — hero → pain points → grace → meet
  the companions → pricing + sign-up — with a "1 / 5"-style counter in the
  header. Every "Get Started" CTA jumps straight to the sign-up form on the
  last screen, reachable in at most 4 swipes from the hero (or 0, via the
  jump). It's plain CSS scroll-snap (`overflow-x-auto` + `snap-x`) with a
  dot indicator and prev/next buttons driving `scrollTo`, not a
  swipe-gesture library — native touch/trackpad swipe and the on-screen
  controls both work. Headlines use a serif font (`font-serif`, Georgia —
  a `@theme` token in `globals.css`, no webfont to load) distinct from the
  sans body/UI text, matching the onboarding design this was adapted from.
  `src/components/icons.tsx` holds the small set of line icons shared
  between the onboarding screens and `PricingSection`.
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
                  api/plisio/create-invoice, api/plisio/webhook,
                  api/bible (route handlers — the last proxies bible-api.com)
  components/     UI components (StreakVisual, PlantIcon, PathEventList,
                  PathEventCard, LessonFlow (the guided screen-by-screen
                  lesson sequence — see "guided lesson screens" above),
                  FillBlankCard (the verseBlank screen type), MascotHero,
                  DailyContentBackdrop, NextStoryTeaser, PricingSection,
                  AuthForm, ApostleAvatar, ApostleMessageCard, BottomTabBar,
                  PremiumGate (UnlockCard + blurredPreviewClass),
                  ProfileButton, ProfilePage, icons.tsx — shared line icons)
                  tabs/ — TodayTab, PathTab, ArmoryTab, WatchTab, WordTab
                  (see "Navigation" above)
  lib/            firebase.ts (client SDK init, incl. Storage), firebase-admin.ts
                  (server-only Admin SDK init), auth-context.tsx, streak.ts,
                  xp.ts, date.ts (pure logic),
                  roadmap.ts (the single chronological sequence, flattenPathEvents,
                  nextLesson — see "strict visibility and
                  completion-gated rotation" above),
                  contentType.ts (Lessons/Prayer/Devotion tab metadata —
                  see "content-type tabs and color identity" above),
                  dailyContent.ts (pickForDate rotation — see "Today: daily
                  content" above), apostles.ts, apostle-moment.ts
                  (see "Apostle Companion" above), armory.ts (Armory content),
                  bible.ts (book list + /api/bible client — BIBLE_BOOKS is
                  now display-only for lessons, chronologicalOrder drives
                  ordering), storage.ts
                  (profile photo upload), db/ (Firestore reads/writes,
                  including highlights.ts, accountability.ts, lessonAnswers.ts
                  (scenario-screen answers), and dailyContent.ts),
                  plisio/ (plans.ts, checkout.ts, verify.ts — see "Payments" below)
  types/          firestore.ts (Firestore document types)
public/
  logo.svg        Full logo lockup (mark + wordmark + tagline), used in the
                  landing page hero
  icons/          PNG app icons (192/512/maskable-512/apple-touch), cropped
                  to just the mark from logo.svg — see below
  apostles/       peter.png, matthew.png, john.png, thomas.png — companion
                  portraits for the landing page (see "Apostle Companion"
                  above); falls back to an icon avatar if one's ever missing
firestore.rules   Security rules matching the schema above
storage.rules     Security rules for profile photo uploads (see "Profile" above)
scripts/          seed-lessons.mjs + lessons-data.mjs (Admin SDK lesson seeding),
                  seed-daily-content.mjs + daily-content-data.mjs (Admin SDK
                  Today-tab daily-content seeding),
                  rules-test.mjs (firestore.rules tests, npm run test:rules),
                  plisio-verify.test.mjs (webhook signature tests, npm run test:plisio)
```

## Deploying

Push to a Git repo and import it in [Vercel](https://vercel.com/new), or run
`vercel` from the CLI. Add the Firebase environment variables from step 6
above before the first deploy.
