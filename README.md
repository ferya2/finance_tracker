# Finance Tracker

A modern personal **finance / expense tracker** web app — track income and
expenses, organize by category, set budgets, and see reports. Built with a
premium, animated UI. Developed incrementally by an autonomous **OpenCode** agent,
one small reviewed task per day.

## Tech Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** + **framer-motion** (animation) + **three / @react-three/fiber** (3D)
- **Supabase** (Postgres + **Auth**, user-scoped via RLS)
- **Vitest** for unit tests
- Deploys on **Vercel**

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

See `supabase.md` (local, gitignored) for the database schema and `kredensial.md`
for the full credentials checklist.

## How It's Built

- Features are planned in [.ai/ROADMAP.md](.ai/ROADMAP.md) and broken into a
  ~4-month plan in [.ai/TASKS.md](.ai/TASKS.md).
- A daily GitHub Actions workflow runs the OpenCode agent to implement one task,
  run `npm run lint` + `npm test`, and open a Pull Request.
- PRs auto-merge when the test gate is green; releases are versioned automatically.

## Validation

```bash
npm run lint
npm test
```

## Progress

<!-- The agent appends one short bullet here per completed task. -->

- Project scaffolding, tooling (Vitest, framer-motion, 3D, Supabase), and
  autonomous CI/CD set up.
- Complete landing page (hero + CTA, features, how-it-works, footer) with dark
  mode support.
- Design system foundation: semantic color/typography/spacing tokens, class-based
  dark mode with a sticky-nav toggle, and Geist typography across the landing.
- Landing page entrance & scroll animations: staggered hero reveal, section
  scroll-reveal, and staggered feature/step cards via framer-motion.
