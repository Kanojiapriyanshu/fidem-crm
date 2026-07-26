# Fidem

Admin-only internal tool: pitch sheets, Modash media kit, Insight OS, and
YouTube-based influencer discovery. No brand or influencer accounts.

- `server/` — Node/Express API (was `fidem-backend`)
- `client/` — Next.js admin panel (was `fidem-frontend`)

See `MIGRATION_NOTES.md` for what changed during the strip-down from
Collabglam and what was verified.

---

## 1. Prerequisites

- **Node.js 18+** (20+ recommended)
- **MongoDB** — either:
  - Local: install MongoDB Community and run it (`mongod`), or
  - Free hosted: a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
    (easiest if you don't want to install anything)
- **API keys** you'll need before the features actually work:
  - **Modash API key** — required. The server will *crash on startup*
    without it (`MODASH_API_KEY is missing`). Get one from your Modash
    account/dashboard.
  - **YouTube Data API key** — required for the YouTube discovery feature.
    Get one from the [Google Cloud Console](https://console.cloud.google.com/)
    (enable "YouTube Data API v3").
  - **OpenAI API key** — optional. Powers Insight OS's AI analysis; without
    it, that enrichment step is skipped rather than failing.
  - **AWS credentials (S3 + SES)** — optional. Needed for pitch-folder file
    attachments and for sending admin-invite emails. Without them, those
    specific actions will fail but the rest of the app works.

## 2. Server setup

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in at minimum:

```
MONGODB_URI=mongodb://127.0.0.1:27017/fidem      # or your Atlas connection string
JWT_SECRET=<any long random string>
MODASH_API_KEY=<your modash key>
YOUTUBE_API_KEY=<your youtube data api key>
```

Everything else in `.env.example` is optional — see the comments in that
file for what each var does and what breaks (or gracefully degrades)
without it.

Start it:

```bash
npm run dev      # nodemon, restarts on file changes
# or
npm start        # plain node
```

You should see `🚀 Fidem server listening on port 8000` with no errors. If
it crashes immediately, the error message will usually name the missing
env var.

### Create your first admin account

There's no public sign-up screen — you seed the first `super_admin`
directly:

```bash
node scripts/seedSuperAdmin.js you@example.com "Your Name" "a-strong-password"
```

This creates (or updates) an **active** `super_admin` you can log in with
immediately. Once logged in, use the "Team & Roles" page in the admin UI to
invite additional admins by email — they'll get a real invite flow from
there on.

## 3. Client setup

In a separate terminal:

```bash
cd client
npm install
cp .env.example .env.local
```

Make sure `.env.local` points at your running server:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start it:

```bash
npm run dev
```

Visit **http://localhost:3000** — it should redirect you to
`/admin/login`. Log in with the account you seeded above.

## 4. Smoke-testing each feature

Once logged in:

1. **Pitch Sheets** (`/admin/pitch-folders`) — create a new pitch folder,
   add an item, then use its "share" action to generate a public link.
   Open that link in an incognito window — it should load with **no
   login required**, confirming the brand-share flow works.
2. **Influencer Discovery** (`/admin/youtube` and `/admin/influencer-data`)
   — run a YouTube search. If you get "Missing YOUTUBE_API_KEY", double
   check that var in `server/.env` and restart the server (env changes
   need a restart, `nodemon` alone won't pick up `.env` edits either —
   restart the process).
3. **Modash Media Kit** — from the discovery results, open a creator's
   media kit / report. This exercises the Modash API key.
4. **Insight OS** (`/insight-os`) — run a channel insight report. Works
   without `OPENAI_API_KEY` but with less analysis depth; set that key to
   test the full experience.
5. **Missing Emails** (`/admin/missing-emails`) and **Error Logs**
   (`/admin/error-log`) — should just load without errors (empty lists on
   a fresh database are expected).

## 5. Common issues

- **"MODASH_API_KEY is missing" and the server won't start at all** — set
  it in `server/.env`, this one's genuinely required to boot.
- **Login fails with "Invalid credentials"** — re-run the seed script; it's
  safe to run again (it upserts by email).
- **Frontend shows network errors / CORS errors** — check
  `FRONTEND_ORIGIN` in `server/.env` includes `http://localhost:3000`
  (it does by default) and that `NEXT_PUBLIC_API_URL` in `client/.env.local`
  matches where your server is actually running.
- **Env var changes not taking effect** — restart both `npm run dev`
  processes after editing either `.env` file.

## Quick start (reference)

```bash
# server
cd server
npm install
cp .env.example .env   # then fill in MONGODB_URI, JWT_SECRET, MODASH_API_KEY, YOUTUBE_API_KEY
npm run dev

# in a new terminal — create your first login
cd server
node scripts/seedSuperAdmin.js you@example.com "Your Name" "a-strong-password"

# client, in a third terminal
cd client
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

