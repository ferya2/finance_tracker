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
- 3D hero scene: an interactive floating coin that reacts to the pointer, with
  floating crystal accents and an ambient ring, rendered via react-three-fiber.
- Ambient 3D page background: a pointer-reactive, instanced particle field plus
  animated gradient-mesh orbs behind the landing sections, dark-mode aware and
  lazy-loaded.
- Micro-interactions: reusable animated buttons, magnetic hero CTA, animated nav
  with gradient hover underlines, lift/glow hover states on cards, and smooth
  anchor scrolling.
- Responsive + performance pass: mobile-friendly overflow handling, 3D hero only
  on desktop, idle-deferred ambient 3D, full `prefers-reduced-motion` support
  (static content, no 3D), and theme-color viewport metadata.
- Landing UI refinement pass: added numbered section dividers (02, 03), increased
  vertical whitespace and section padding, tighter card gaps, softer 3D lighting
  and reduced decoration count, and subtler card hover effects.
- Supabase client bootstrap: `lib/supabase/client.ts` with env-driven client
  creation, auth helpers (sign up / sign in / sign out), a committed
  `.env.example`, and mocked-client unit tests.
- Sign-up page: animated `/sign-up` form with pure client-side validation
  (`lib/auth/validate.ts`, unit-tested) wired to Supabase Auth, with loading and
  error/confirmation states, plus a "Sign up" nav link.
- Login page: animated `/login` form with pure `validateLogin` logic (unit-tested)
  wired to Supabase Auth, server-error handling, a "Log in" nav link, and
  cross-links between the login and sign-up forms.
