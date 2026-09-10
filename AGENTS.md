# AI Development Instructions

## Project

A **personal Finance / Expense Tracker** web app. Track income and expenses,
organize by category, set monthly budgets, and view reports and charts.

## Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Animation:** `framer-motion` — the UI should feel modern and smooth
- **3D:** `three` + `@react-three/fiber` + `@react-three/drei` (landing hero, accents)
- **Icons:** `lucide-react`
- **Database:** **Supabase** (Postgres) via `@supabase/supabase-js`
- **Auth:** **Supabase Auth** (email/password). Data is user-scoped via RLS —
  every row has a `user_id` and users only see their own data.
- **Testing:** **Vitest** (unit tests for logic) + Testing Library for components

The app is built to deploy on **Vercel** (Supabase handles persistence, so no
local filesystem DB — everything works serverless).

The UI must be **premium**: modern, smooth `framer-motion` animations, tasteful
**3D** touches, dark mode, and polished micro-interactions.

**Landing page design reference:** https://pasin.ryyarf.my.id/ — clean minimal
light aesthetic, numbered sections, humanist sans-serif, an interactive
drag-to-rotate 3D hero, and smooth scroll-reveal motion. Full brief in
`.ai/DESIGN.md` — follow it for all landing-page work (Week 1).

## Architecture (testability first)

```
src/
├── app/            # Next.js routes, pages, layouts (thin UI)
├── components/     # reusable React components (presentational)
├── lib/
│   ├── finance/    # PURE business logic (totals, budgets, summaries) — unit tested
│   └── supabase/   # Supabase client + data access (thin) — mocked in tests
└── types/          # shared TypeScript types
```

**The golden rule:** all money math and business logic lives in `src/lib/finance/`
as **pure functions with no I/O**, so they are trivially unit-tested without a
database or network. UI and Supabase calls stay thin.

## Development Rules

- Follow existing conventions and the folder structure above.
- Keep changes small — ONE task from `.ai/TASKS.md` per run.
- **Every function in `src/lib/finance/` MUST have Vitest unit tests.**
- Do not hit real Supabase in tests — mock the client.
- UI must be **modern, responsive, and smoothly animated** (use `framer-motion`
  for transitions, list animations, and micro-interactions). Support dark mode.
- Do not introduce a new state/data library unless a task requires it.
- Never commit secrets. Supabase keys come from environment variables only
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Database schema is fixed and owned by the human.** The app only reads/writes
  ROWS via the `supabase-js` client (`.from(...).select()/.insert()/.update()/
  .delete()` and `supabase.auth.*`). NEVER generate or run DDL — no `CREATE TABLE`,
  `ALTER TABLE`, migrations, or raw SQL — and never a Supabase service-role key.
  The tables (`transactions`, `categories`, `budgets`) already exist with RLS; if
  a task seems to need a schema change, note it in the PR instead of doing it.
- Do not manually edit the `version` in `package.json` — the release workflow
  manages it.
- Do NOT add any AI attribution (no `Co-Authored-By`, no "Generated with ...",
  no bot signatures) to commits or PR descriptions.
- After completing a task, append ONE brief bullet under `## Progress` in
  `README.md`. Keep it concise.

## Before Finishing

Run, in order:

- `npm run lint`
- `npm test`

Only commit if both pass. If a task cannot be completed cleanly, make no changes.

## Commit Format

```
<type>(<scope>): <description>
```

Example: `feat(finance): add monthly budget status calculation`
