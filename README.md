# Expense Tracker

A production-ready personal expense tracker for daily use — built for India (₹ / INR by default). Log an expense in a few seconds, understand your spending in minutes.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Row Level Security)
- Recharts, Zod, React Hook Form, date-fns, Lucide React
- Deployed on Vercel

Money is stored as **integer paise** (not floating-point rupees) everywhere in the database and app state, to avoid rounding errors. Conversion to/from rupees only happens at the UI boundary (`lib/money.ts`).

## 1. Local setup

```bash
npm install
cp .env.example .env.local
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**. Pick a name, a strong database password, and a region close to your users (`ap-south-1` / Mumbai is a good choice for India).
2. Once provisioned, go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose this to the browser)
3. Go to **Authentication → Providers** and confirm **Email** is enabled.
4. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to `http://localhost:3000` for now (update to your production URL after deploying).
   - Add `http://localhost:3000/**` to **Redirect URLs**.
5. Run the schema migration — open **SQL Editor** in the Supabase dashboard, paste the contents of `supabase/migrations/0001_init.sql`, and run it. (Or, if you have the Supabase CLI: `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`.)
6. In **Table Editor**, confirm all tables exist and RLS shows as **Enabled** on `expenses`, `budgets`, `recurring_expenses`, `categories`, `profiles`.
7. (Optional, recommended) Regenerate the TypeScript types to match your live schema exactly:
   ```bash
   npx supabase gen types typescript --project-id <project-ref> > types/database.types.ts
   ```

Fill in `.env.local` with the values from steps 2–3.

## 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register an account (check your email for the confirmation link, unless you disabled "Confirm email" in Supabase for faster local testing), then log in.

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New Project** → import the repo (framework is auto-detected as Next.js).
3. Add the four environment variables from `.env.example` in **Project Settings → Environment Variables** (Production, Preview, and Development).
4. Deploy.
5. Back in Supabase → **Authentication → URL Configuration**, set **Site URL** to your production Vercel URL and add it to **Redirect Urls**.
6. Update `NEXT_PUBLIC_SITE_URL` in Vercel to the real production URL (needed so password-reset/confirmation emails link back correctly), then redeploy.

## Project structure

```
app/
  (auth)/        Login, register, forgot/reset password
  (app)/         Protected routes: dashboard, expenses, analytics, budgets, recurring, settings
  api/           Export (CSV/JSON) and import routes
  auth/callback/ Exchanges Supabase auth codes for a session
components/      UI components, grouped by feature
lib/
  supabase/      Browser/server/middleware Supabase clients
  queries/       Server-side data access (one file per domain)
  actions/       Server Actions (budgets, account settings)
  validations/   Zod schemas
  money.ts       Paise <-> rupee conversion helpers (the only place this happens)
supabase/migrations/0001_init.sql   Full schema, indexes, RLS policies, RPC functions
types/           Database + domain TypeScript types
```

## Testing checklist

Before considering a change complete, verify:

- [ ] Register, confirm email, log in, log out, forgot/reset password
- [ ] Add / edit / delete an expense; duplicate-submit is prevented
- [ ] Expenses persist after a page refresh and after logging out and back in
- [ ] A second test account cannot see the first account's expenses (RLS)
- [ ] Dashboard totals (today/week/month/avg/highest) match manual sums
- [ ] Editing/deleting an expense updates the dashboard and analytics immediately
- [ ] Search, category/payment/date filters, and sort all work and combine
- [ ] Monthly analytics, category breakdown, and month-over-month % are correct
- [ ] Budget progress thresholds (70/90/100%) show the right color/warning
- [ ] A recurring expense generates on schedule and never duplicates (reload repeatedly to confirm)
- [ ] CSV/JSON export contains only the logged-in user's data
- [ ] CSV import previews rows and rejects malformed ones without inserting them
- [ ] Works on a real mobile viewport — bottom nav, FAB, no horizontal scroll
- [ ] Dark mode, light mode, and system preference all render correctly
- [ ] No secrets appear in browser devtools / client bundle

## Notes on money & dates

- All amounts are stored as `bigint` paise. `lib/money.ts` is the single place that converts to/from rupees for display and input parsing — never do float math on money elsewhere.
- Dates use the browser's local timezone throughout (`lib/dates.ts`, built on `date-fns`). `expense_at` is stored as a `timestamptz` in Postgres.
