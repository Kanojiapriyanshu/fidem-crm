# Fidem — Migration Notes

Rebuilt from the Collabglam V3 codebase as an **admin-only internal tool**.
No brand or influencer accounts exist. Four features only:

1. **Pitch Sheet** — admin creates/manages, shares with a brand via a public,
   no-login link (`/pitch-folder/shared/[token]`).
2. **Modash Media Kit** — creator media kit lookup/report (`/mediakit/[id]`
   is the public share view; `/admin/influencer-data` is the admin tool).
3. **Insight OS** — YouTube channel insight reports (`/insight-os`,
   `/insight-os/report`).
4. **Influencer Discovery (YouTube, admin-side)** — `/admin/youtube` and
   related tooling, backed by `youtubeController` / `youtubeData.controller`.

Everything else — brand & influencer sign-up/login, campaigns marketplace,
contracts, milestones, disputes, chat, outreach/Instantly, subscriptions,
payments, the public marketing site/legal pages — has been removed.

## What was verified

- **Backend**: every file reachable from `app.js` (89 files) passes a Node
  syntax check, and the full `require()` dependency graph was traced and
  resolves cleanly. Not run against a live MongoDB in this environment.
- **Frontend**: `npm install` succeeded, `npx tsc --noEmit` passes with
  **zero TypeScript errors**, and `next build` compiled and bundled
  successfully — it only stopped at the Google Fonts fetch step because this
  sandbox has no general internet access. On a normal machine this should
  build clean.

## Structural changes worth knowing about

- **New `controllers/adminAuthController.js` + `routes/adminAuthRoutes.js`**
  replace the old `masterController.js`/`adminController.js`. Same behavior
  (login, invite admin, accept invite, list admins, update status, `/me`),
  but with the brand/campaign-marketplace code stripped out. Mounted at
  `/admins/*`.
- **`pitchFolderController.js`** no longer looks up "signed-up influencer"
  accounts (that model is gone) — the lookup always resolves to null, which
  the existing code already handled gracefully.
- **The Modash/YouTube search UI** (`SearchHeader`, `ResultsGrid`,
  `DetailPanel`, `YouTubeBrowse`, etc.) lived inside the old brand portal at
  `app/brand/(protected)/browse-influencer/`. It's been relocated to
  `src/features/discovery/browse-influencer/` since it's core product, not
  brand-only UI. `mediaKitApi.ts` was extracted the same way from the old
  influencer-portal service file, trimmed to just the two functions the
  media kit viewer needs.
- **Admin nav** (`admin-access.ts` / `AdminSideBar.tsx`) now only lists:
  Pitch Sheets, Influencer Discovery, Missing Emails, Team & Roles, Error
  Logs. `/admin` now redirects to `/admin/pitch-folders`. The root `/` now
  redirects to `/admin` (the old marketing homepage is gone).
- Chat, sockets, cron jobs, and ~30 unused service files were removed from
  the backend bootstrap. `jobs/` now only contains `mediakitSync.js`.

## Known follow-ups (not done)

- **Env setup**: you'll need `MONGO_URI`, `JWT_SECRET`, Modash API creds,
  YouTube API creds, AWS SES/S3 creds (for pitch-folder file attachments and
  email), and `FRONTEND_ORIGIN`/`NEXT_PUBLIC_API_URL` set for both apps.
- **First admin account**: there's no public sign-up. You'll need to seed
  one `super_admin` directly in MongoDB (or add a one-off seed script) to
  log in for the first time and invite others via `/admin/invite`.
- **Campaign/ApplyCampaign models are still present** in the backend because
  `pitchFolderController.js` optionally links a pitch-folder item to a
  "campaign" for tracking. Since there's no campaigns marketplace anymore,
  this is a vestigial optional feature — worth a decision on whether to keep
  it (harmless, unused by anything else) or simplify pitch-folder items to
  not reference `Campaign` at all.
- **`influencer.js` and `brand.js` models were kept** (not deleted) because
  Modash/media-kit/filter controllers still import them for internal creator
  records (fields like `isAdminCreated`) and quota checks — this is expected
  and fine, just noting it since the names are misleading given there's no
  sign-up flow anymore.
- **Dead files not yet deleted** (harmless, just clutter): old email
  templates for invites/OTP/contracts/disputes under `emails/` and
  `template/`, a few one-off migration scripts under `scripts/`, and
  `ARCHITECTURE.md`/`.gitignore` still reference "Collabglam" — none of
  these are on the live code path.
- **A few dead links remain** in kept pages that pointed at now-deleted
  admin routes (e.g. one button in `influencer-pipeline/pipeline` linking to
  `/admin/inbound-emails`). Non-blocking — the page loads fine, the specific
  button just 404s if clicked. Worth a quick sweep.
- **Not run against a real database or your API keys** — recommend doing
  that next (ideally in Claude Code, where you can iterate against a live
  environment) before considering this done.

## Suggested next step

Hand this to Claude Code (or your local dev setup) to:
1. Set up `.env` for both apps and a MongoDB instance.
2. Seed the first admin account.
3. Boot both servers and click through all five admin pages end-to-end.
4. Do a final sweep for the small known follow-ups above.
