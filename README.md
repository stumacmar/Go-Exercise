# Reset — Health & Training Dashboard

A calm, private, mobile-first dashboard for tracking **weight, blood pressure,
food/calories, and training** — built for losing weight steadily and safely
while on appetite-suppressing medication (e.g. Mounjaro / tirzepatide).

Data lives in **Supabase** (Postgres + Auth), so it syncs across your phone and
laptop. The app is a **PWA** you can install on your phone home screen.

> ⚠️ **Not medical advice.** Reset is a personal tracking tool. It does not
> diagnose, treat, or replace your GP. Never start, stop, or change medication
> based on anything shown here.

---

## Features

- **Overview** — current weight, kg-to-goal, start→goal progress bar, latest BP
  with auto-category, today's calorie ring, macro split, and a tick-off
  this-week training strip.
- **Weight & BP** — one weigh-in per day (upsert); BP log with automatic
  category (Healthy / Elevated / Stage 1 / Stage 2 / Crisis); trend chart with a
  dashed goal line; history with delete.
- **Food & Calories** — **barcode scanning** with your phone camera
  (`@zxing/browser`), **text search** and **manual entry** via
  [Open Food Facts](https://world.openfoodfacts.org) (no API key), quantity /
  gram control, daily totals vs target, macro breakdown.
- **Training** — TrainingPeaks-style logging (type, duration, RPE, calories, avg
  HR, distance, "how it felt"), weekly load summary + last-7-days bar chart,
  history with delete.
- **The Plan** — editable targets, weekly training template, nutrition
  framework, and guiding principles.

### Safety, built in
- First-load disclaimer (and a copy in the Plan tab).
- If logged calories are **below 1200**, a supportive warning to prioritise
  protein + fluids and aim toward target — it **never** congratulates very low
  intake (the real risk on these meds is under-eating).
- If protein is below your floor, a nudge toward it (muscle preservation).
- A weekly **BP logging** reminder plus a note that medication may need a **GP
  review** as weight drops — it never suggests adjusting medication.

---

## Tech stack

Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Supabase
(Postgres + Auth, magic-link) · Recharts · `@zxing/browser` · PWA
(manifest + service worker). Deploys to Vercel.

---

## Setup — do this in order

### 1. Create a Supabase project
1. Go to <https://app.supabase.com> → **New project**. Pick a name and a strong
   database password, and a region near you.
2. Wait for it to finish provisioning.

### 2. Run the schema
1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of [`schema.sql`](./schema.sql) and click **Run**.
   This creates all tables, **Row Level Security** policies (each user sees only
   their own rows), and a trigger that seeds default settings on first sign-in.
   It's safe to re-run.

### 3. Configure Auth (magic link)
1. **Authentication → Providers → Email**: make sure **Email** is enabled.
   (Magic links work out of the box — no password needed.)
2. **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` for local dev (change to your Vercel
     URL after deploying).
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` and, later,
     `https://YOUR-APP.vercel.app/auth/callback`.

### 4. Copy your env vars
From **Project Settings → API**, copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Create `.env.local` from the template:

```bash
cp .env.example .env.local
# then edit .env.local and paste your values
```

### 5. Install & run locally
```bash
npm install
npm run dev
```
Open <http://localhost:3000>, enter your email, click the magic link, and you're
in. (In local dev the magic-link email is sent by Supabase's built-in mailer.)

---

## Deploy to Vercel

> ⚠️ **GitHub Pages will not work** for this app. Pages only serves static
> files — Reset needs a live server for its API routes (`/api/food`),
> Supabase auth, and middleware. Use Vercel (free), which runs Next.js natively.

**One-click:** complete steps 1–4 of *Setup* above first (you need your two
Supabase env values), then click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fstumacmar%2FGo-Exercise&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_SITE_URL&envDescription=Supabase%20URL%20%2B%20anon%20key%20and%20your%20site%20URL&envLink=https%3A%2F%2Fgithub.com%2Fstumacmar%2FGo-Exercise%234-copy-your-env-vars)

Vercel will ask for the three env vars during import. After the first deploy,
set `NEXT_PUBLIC_SITE_URL` to the URL Vercel gives you and redeploy, then add
that URL to Supabase's Auth settings (see step 6).

**Or manually:**

1. **Push to GitHub** (this repo / branch).
2. Go to <https://vercel.com> → **Add New… → Project** → import the repo.
3. Framework preset is auto-detected as **Next.js**. No build settings needed.
4. **Environment Variables** — add the same three (for Production *and* Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your deployment URL, e.g.
     `https://YOUR-APP.vercel.app`
5. **Deploy.** Vercel auto-deploys on every push to `main`.
6. Back in **Supabase → Authentication → URL Configuration**, set the **Site
   URL** to your Vercel URL and add `https://YOUR-APP.vercel.app/auth/callback`
   to the **Redirect URLs**.

---

## Install as a phone app (PWA)

- **iPhone (Safari):** open your Vercel URL → **Share** → **Add to Home Screen**.
- **Android (Chrome):** open the URL → menu **⋮** → **Install app** /
  **Add to Home screen**.

It launches full-screen, works offline for the shell, and uses the camera for
barcode scanning (allow the camera permission when prompted — scanning needs
HTTPS, which Vercel provides).

---

## Project structure

```
schema.sql                  Postgres schema + RLS policies
public/
  manifest.json             PWA manifest
  sw.js                     service worker (offline shell)
  icons/                    generated app icons
scripts/generate-icons.mjs  regenerates the PNG/SVG icons (no deps)
src/
  app/
    layout.tsx              fonts, metadata, SW registration
    page.tsx                auth gate → Dashboard
    login/page.tsx          magic-link sign-in
    auth/callback/route.ts  exchanges the magic-link code for a session
    api/food/route.ts       Open Food Facts proxy (barcode + search, 5s timeout)
  components/
    Dashboard.tsx           tab shell + bottom nav
    tabs/                    Overview, WeightBP, Food, Training, Plan
    BarcodeScanner.tsx       @zxing camera scanner
    SettingsContext.tsx      loads/updates user_settings
    ui.tsx                   shared UI primitives
  lib/
    supabase/               browser + server + middleware clients
    health.ts               BP categories + calorie/protein safety nudges
    dates.ts                local-date helpers
    constants.ts            training types, weekly plan, nutrition framework
    types.ts                shared types
  middleware.ts             session refresh + route protection
```

## Scripts
```bash
npm run dev        # local dev
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit (strict)
npm run lint       # eslint
```

## Notes
- Open Food Facts requires **no API key**. Requests are proxied through
  `/api/food` (avoids CORS), send a descriptive `User-Agent`, and time out after
  5s with a graceful "add manually" fallback.
- Supabase is the **single source of truth**. The service worker only caches the
  app shell; data calls always hit the network.
