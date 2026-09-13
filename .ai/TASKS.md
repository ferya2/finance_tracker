# Daily Tasks — Plan (129 days)

One small task per day. The agent works on the **first unchecked** day, completes
it, ticks the box, and opens a PR. Never bundle two days into one run.

> Flow: landing page (Week 1) → auth (Week 2) → dummy dashboard (Day 18) → full
> dummy UI for every menu (Week 4) → core logic → data layer → wire real data into
> all the pages → advanced features → polish → Month-4 security.

**Landing design north star:** https://pasin.ryyarf.my.id/ — clean minimal light
aesthetic, numbered sections (01, 02, …), humanist sans-serif with generous
whitespace, an interactive drag-to-rotate **3D** hero, and smooth scroll-reveal
**framer-motion**. See `.ai/DESIGN.md` for the full brief.

---

## Week 1 — Landing page (match the reference)

- [x] **Day 01 — Landing page (rough, complete).** Build a full landing page with
  numbered sections like the reference: hero (headline + CTA), "how it works",
  features, and footer CTA. Real content. `npm run lint` + `npm test` pass.
- [x] **Day 02 — Design system.** Light/minimal theme: near-black text on clean
  white, one restrained accent, humanist sans-serif type scale, generous spacing,
  numbered section dividers (01/02/…). Dark mode variant.
- [x] **Day 03 — Entrance & scroll animations.** framer-motion: hero entrance,
  reveal-on-scroll per section, staggered items — subtle and smooth.
- [x] **Day 04 — 3D hero.** react-three-fiber scene: a drag-to-rotate 3D object
  (coin / card / wallet) that the user can spin, like the reference's 3D viewer.
- [x] **Day 05 — 3D refinement.** Lighting, materials, subtle auto-rotate + pointer
  parallax; keep it performant and lazy-loaded.
- [x] **Day 06 — Micro-interactions.** Buttons, magnetic CTA, animated nav, smooth
  anchor scrolling between numbered sections.
- [x] **Day 07 — Responsive + performance.** Flawless on mobile; respect
  prefers-reduced-motion; lazy-load 3D; Lighthouse-friendly.
- [x] **Day 08 — Landing UI refinement (match reference).** Polish the whole
  landing to the quality bar of https://pasin.ryyarf.my.id/ — tighten spacing,
  typography, section rhythm, make the 3D and framer-motion feel clean and
  intentional. This is a dedicated "make it beautiful" pass, no new sections.

## Week 2 — Auth (Supabase)

- [x] **Day 09 — Supabase client + env.** `lib/supabase/client.ts`, `.env.example`,
  auth helper. Test the module loads with mocked env.
- [x] **Day 10 — Sign up page.** Form + validation wired to Supabase Auth. Animated.
  Tests.
- [x] **Day 11 — Login page.** Login form + error handling. Animated. Tests.
- [x] **Day 12 — Session & logout.** User/session context/provider + logout. Tests
  for the pure helpers.
- [x] **Day 13 — Protected routes.** Middleware/guard: redirect unauthenticated
  users to login; redirect logged-in users away from auth pages.
- [x] **Day 14 — Auth UX polish.** Loading states, inline errors, transitions,
  "forgot password" stub.
- [x] **Day 15 — Account basics.** Show current user, basic profile display.

## Week 3 — Early logic + dummy dashboard

- [x] **Day 16 — Money formatting.** `lib/finance/format.ts`: `formatCurrency`,
  `parseAmount` (cents-based). Full tests.
- [x] **Day 17 — Transaction model.** `types/transaction.ts` + `validateTransaction`.
  Tests for valid/invalid.
- [x] **Day 18 — Dashboard shell + full dummy UI (many menus).** Authed app shell +
  dashboard with dummy data and nav to all planned areas.

## Week 4 — Full dummy UI for every menu (smooth animation + 3D)

> Build a beautiful, complete UI for EVERY menu page using DUMMY/hardcoded data
> only — NO Supabase queries yet. Emphasis: premium look, smooth `framer-motion`
> (entrance, stagger, hover, page transitions) and tasteful **3D**
> (react-three-fiber) accents. Follow `.ai/DESIGN.md`. Lazy-load 3D and respect
> `prefers-reduced-motion`. Real data is wired later (Week 7). Keep type-clean
> (`npm run typecheck`); add render tests where practical.

- [ ] **Day 19 — Transactions page (dummy UI).** Rich animated list of dummy
  transactions: date, colored category badge + icon, note, signed amount (income
  vs expense colors). Static filter/search/type controls (non-functional). List
  entrance stagger + row hover micro-interactions.
- [ ] **Day 20 — Categories page (dummy UI).** Grid of category cards (color +
  lucide icon, item counts), grouped income/expense. Staggered card grid, hover
  lift/glow. Dummy "add category" button + modal shell (non-functional).
- [ ] **Day 21 — Budgets page (dummy UI).** Budget cards per category with animated
  progress bars/rings (spent vs limit), on-track / near / over-budget color
  states, smooth progress + count-up animation. Dummy data.
- [ ] **Day 22 — Reports page (dummy UI).** Animated dummy charts: monthly trend
  (line/area), income-vs-expense (bars), category split (donut) — with draw-in
  animation. Lightweight inline SVG (no heavy chart dep unless needed).
- [ ] **Day 23 — Insights page (dummy UI + 3D).** Insight cards (top category, avg
  daily spend, biggest expense, savings rate) plus an eye-catching **3D** hero
  accent (react-three-fiber — e.g. floating 3D bars/orb) for a premium feel.
  Animated reveal.
- [ ] **Day 24 — Settings page (dummy UI).** Sections: profile, currency, theme,
  notifications, danger zone — animated toggles/selects/inputs (non-functional).
  Smooth section reveal.
- [ ] **Day 25 — Account page (dummy UI polish).** Enrich the account page: avatar,
  profile card, quick stats, recent-activity list — animated, dummy data.
- [ ] **Day 26 — 3D + animation polish pass.** Tasteful 3D accent on the dashboard,
  smooth page transitions between ALL menu routes (AnimatePresence), and a
  consistent micro-interaction feel across pages. Respect reduced-motion.

## Week 5 — Core finance logic (pure, unit-tested)

- [ ] **Day 27 — Totals.** `sumIncome`, `sumExpense`, `balance`. Full tests.
- [ ] **Day 28 — By category.** Group + sum per category, sorted. Full tests.
- [ ] **Day 29 — Monthly summary.** Filter by year+month → {income,expense,balance}.
  Full tests.
- [ ] **Day 30 — Budget status.** {spent, remaining, percent, overBudget}. Tests.
- [ ] **Day 31 — Date/period helpers.** Month ranges, current period (dates passed
  in as args). Tests.

## Week 6 — Data layer (Supabase, mocked in tests)

- [ ] **Day 32 — Transactions read/create.** `lib/supabase/transactions.ts`. Mocked
  tests.
- [ ] **Day 33 — Transactions update/delete.** Mocked tests.
- [ ] **Day 34 — Categories CRUD.** `lib/supabase/categories.ts`. Mocked tests.
- [ ] **Day 35 — Budgets CRUD.** `lib/supabase/budgets.ts`. Mocked tests.
- [ ] **Day 36 — Data wiring.** Server actions/hooks to fetch a user's data.
- [ ] **Day 37 — Error & loading helpers.** Result/error + loading utilities. Tests.
- [ ] **Day 38 — Default categories.** Seed starter categories for a new user.

## Week 7 — Wire real data into the UI

> Replace the dummy data in the dashboard and every menu page (Week 4) with real
> Supabase-backed data, keeping the same polished UI.

- [ ] **Day 39 — App layout + session (real).** Finalize shell; show real user.
- [ ] **Day 40 — Dashboard data.** Wire dashboard widgets to real data.
- [ ] **Day 41 — Summary cards (real).** Balance / income / expense from real data.
- [ ] **Day 42 — Recent transactions (real).** Animated list from real data.
- [ ] **Day 43 — Category breakdown (real).** Animated bar/donut.
- [ ] **Day 44 — Budget widget (real).** Animated progress from budget status.
- [ ] **Day 45 — Dashboard polish.** Responsive + motion refinement.

## Week 8 — Transactions (functional)

- [ ] **Day 46 — Transactions list (real).** Wire the transactions page to real data.
- [ ] **Day 47 — Add transaction.** Animated modal/form, validated via lib/finance.
- [ ] **Day 48 — Edit transaction.** Prefilled animated form.
- [ ] **Day 49 — Delete transaction.** Confirm + undo snackbar.
- [ ] **Day 50 — Filter transactions.** By type/category (pure filter + UI).
- [ ] **Day 51 — Search transactions.** Text search (pure logic + input).
- [ ] **Day 52 — Month selector + pagination.** Filter by month, paginate.

## Week 9 — Categories & budgets (functional)

- [ ] **Day 53 — Categories (real).** Wire categories page to real data.
- [ ] **Day 54 — Add/edit category.** Color + icon picker, animated.
- [ ] **Day 55 — Delete category.** Reassign/handle linked transactions.
- [ ] **Day 56 — Budgets (real).** Wire budgets page to real data.
- [ ] **Day 57 — Set/edit budget.** Per category/month.
- [ ] **Day 58 — Budget alerts.** Over-budget indicators + toast.
- [ ] **Day 59 — Categories/budgets polish.** Motion + responsive.

## Week 10 — Charts & reports (functional)

- [ ] **Day 60 — Trend line chart.** Spending over time (aggregation tested).
- [ ] **Day 61 — Income vs expense chart.** Grouped bars.
- [ ] **Day 62 — Category donut.** Share per category.
- [ ] **Day 63 — Monthly report page.** Composed report view.
- [ ] **Day 64 — Yearly overview.** 12-month summary.
- [ ] **Day 65 — Report date-range filter.** Custom ranges (logic tested).
- [ ] **Day 66 — Chart animations.** Smooth transitions + polish.

## Week 11 — Advanced features I

- [ ] **Day 67 — Recurring transactions (logic).** Model + next-occurrence logic.
  Tests.
- [ ] **Day 68 — Recurring UI.** Create/manage recurring entries.
- [ ] **Day 69 — Accounts/wallets (model+data).** Multiple accounts, per-account
  balance. Tests + schema note.
- [ ] **Day 70 — Accounts UI + transfers.** Transfer between accounts.
- [ ] **Day 71 — Tags (logic+data).** Tag model + filter logic. Tests.
- [ ] **Day 72 — Tags UI.** Assign + filter by tag.
- [ ] **Day 73 — Receipts.** Upload receipt image to Supabase Storage, attach to a
  transaction.

## Week 12 — Advanced features II

- [ ] **Day 74 — Savings goals (logic).** Goal model + progress logic. Tests.
- [ ] **Day 75 — Savings goals UI.** Animated progress.
- [ ] **Day 76 — Multi-currency (logic).** Currency + conversion display. Tests.
- [ ] **Day 77 — Currency settings.** Choose currency, format everywhere.
- [ ] **Day 78 — Export CSV.** Export transactions (pure serializer tested).
- [ ] **Day 79 — Export PDF.** Export a report.
- [ ] **Day 80 — Import CSV.** Parse + validate + insert (parser tested).

## Week 13 — Insights & UX

- [ ] **Day 81 — Insights (real).** Top categories, average spend, trends (tested).
- [ ] **Day 82 — Budget recommendations.** Suggest budgets from history. Tests.
- [ ] **Day 83 — In-app notifications.** Over-budget / reminders center.
- [ ] **Day 84 — Onboarding.** First-run guided setup, animated.
- [ ] **Day 85 — Quick add / command palette.** Fast entry via keyboard.
- [ ] **Day 86 — Keyboard shortcuts.** Navigate + actions.
- [ ] **Day 87 — Skeleton/empty/error states.** Everywhere, animated.

## Week 14 — Polish & PWA

- [ ] **Day 88 — Settings (real).** Persist profile, currency, theme.
- [ ] **Day 89 — Theme customization.** Accent colors, persisted.
- [ ] **Day 90 — PWA.** Installable + offline app shell.
- [ ] **Day 91 — Performance.** Lazy-load, memoization, bundle trims.
- [ ] **Day 92 — Accessibility.** Focus, aria, contrast pass.
- [ ] **Day 93 — Error boundaries + 404/500.** Animated fallback pages.
- [ ] **Day 94 — SEO/meta.** Metadata + Open Graph for the landing page.

## Week 15 — Finalize (app)

- [ ] **Day 95 — Responsive audit.** Mobile/tablet/desktop across all pages.
- [ ] **Day 96 — Micro-interaction sweep.** Consistent hover/tap/transition feel.
- [ ] **Day 97 — 3D/animation refinement.** Tasteful accents across the app.
- [ ] **Day 98 — Test coverage pass.** Fill gaps in lib/ unit tests.
- [ ] **Day 99 — Documentation.** README feature list + screenshots placeholder.
- [ ] **Day 100 — Vercel deploy checklist + QA.** Final pass, deploy notes.
- [ ] **Day 101 — Buffer / bugfix.** Catch-all for anything left.

## Month 4 — Security hardening (Weeks 16-19)

> Goal: make the database and the app genuinely secure — no cross-user data
> leaks, hardened auth, and defense against common web attacks.

### Week 16 — Database security
- [ ] **Day 102 — RLS audit.** Verify every table's policies; add automated tests
  that attempt cross-user access and MUST be denied.
- [ ] **Day 103 — Server-side validation.** Validate/normalize every write on the
  server; never trust client input. Tests.
- [ ] **Day 104 — Rate limiting.** Throttle auth + write actions.
- [ ] **Day 105 — Secrets/env audit.** Ensure no service-role key reaches the
  client and no secret is in the bundle.
- [ ] **Day 106 — Injection review.** Confirm all DB access is parameterized via
  supabase-js; no raw string SQL.
- [ ] **Day 107 — Least privilege.** Tighten table + Storage bucket policies.
- [ ] **Day 108 — DB security docs.** Document the DB threat model in SECURITY.md.

### Week 17 — Auth & session security
- [ ] **Day 109 — Auth hardening.** Email confirmation on, strong password policy.
- [ ] **Day 110 — Session security.** Secure cookies, refresh, logout-everywhere.
- [ ] **Day 111 — Route guard audit.** Enforce auth server-side, not just client.
- [ ] **Day 112 — Sensitive-op re-auth.** Password change + re-auth prompts.
- [ ] **Day 113 — Brute-force protection.** Login lockout / backoff.
- [ ] **Day 114 — CSRF protection.** Protect mutating actions.
- [ ] **Day 115 — Auth security tests.**

### Week 18 — App / web security
- [ ] **Day 116 — Security headers.** CSP, HSTS, X-Frame-Options, etc. in config.
- [ ] **Day 117 — XSS review.** Escape/sanitize any user-rendered content.
- [ ] **Day 118 — Upload security.** Receipt uploads: validate type/size, safe storage.
- [ ] **Day 119 — Dependency audit.** `npm audit` + fix vulnerabilities.
- [ ] **Day 120 — Safe errors.** Never leak stack traces or secrets to the client.
- [ ] **Day 121 — Audit logging.** Record security-relevant events.
- [ ] **Day 122 — API surface + CORS review.**

### Week 19 — Review & finalize
- [ ] **Day 123 — Cross-user pen tests.** Automated attempts to read others' data.
- [ ] **Day 124 — Auth abuse tests.**
- [ ] **Day 125 — Fix findings (round 1).**
- [ ] **Day 126 — Fix findings (round 2).**
- [ ] **Day 127 — Security regression suite.**
- [ ] **Day 128 — SECURITY.md + threat model.**
- [ ] **Day 129 — Final security QA + sign-off.**

---

### Notes for the human (product owner)

- Reorder/adjust freely before the agent reaches a day.
- Split any day that feels too big (logic/data one day, UI the next).
