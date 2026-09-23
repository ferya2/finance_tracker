# Daily Tasks — Plan (122 days)

One small task per day. The agent works on the **first unchecked** day, completes
it, ticks the box, and opens a PR. Never bundle two days into one run.

> Flow: landing (Week 1) → auth (Week 2) → dummy dashboard (Day 18) → full dummy
> UI for every menu in one pass (Day 19) → core logic → data layer → wire real
> data into the pages → advanced features → polish → Month-4 security.

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

## Week 3 — Early logic + full dummy UI

- [x] **Day 16 — Money formatting.** `lib/finance/format.ts`: `formatCurrency`,
  `parseAmount` (cents-based). Full tests.
- [x] **Day 17 — Transaction model.** `types/transaction.ts` + `validateTransaction`.
  Tests for valid/invalid.
- [x] **Day 18 — Dashboard shell + full dummy UI (many menus).** Authed app shell +
  dashboard with dummy data and nav to all planned areas.
- [x] **Day 19 — Full dummy UI for ALL menus (animation + 3D).** In one pass, build
  complete, polished DUMMY UI for every menu page — **Transactions, Categories,
  Budgets, Reports, Insights, Settings, Account** — using hardcoded/dummy data
  only (NO Supabase queries). Every page should look realistic and premium with:
  smooth **framer-motion** (entrance, stagger, hover, page transitions),
  tasteful **3D** (react-three-fiber) accents where they fit (e.g. an Insights or
  Reports hero visual), and subtle decorative **background patterns / motifs**
  (corak) behind the content — e.g. soft gradient-mesh, grain/noise, geometric
  shapes, or the existing ambient 3D particle field — kept subtle, not
  distracting, and dark-mode aware. Follow `.ai/DESIGN.md`. Lazy-load 3D and
  respect `prefers-reduced-motion`. Real data is wired later (Week 5+). Keep
  type-clean
  (`npm run typecheck`); add render tests where practical. This is a LARGE task —
  if it cannot all be finished cleanly in one run, prioritize Transactions,
  Categories, and Budgets first and leave the rest for a follow-up.

## Week 4 — Core finance logic (pure, unit-tested)

- [x] **Day 20 — Totals.** `sumIncome`, `sumExpense`, `balance`. Full tests.
- [x] **Day 21 — By category.** Group + sum per category, sorted. Full tests.
- [x] **Day 22 — Monthly summary.** Filter by year+month → {income,expense,balance}.
  Full tests.
- [x] **Day 23 — Budget status.** {spent, remaining, percent, overBudget}. Tests.
- [x] **Day 24 — Date/period helpers.** Month ranges, current period (dates passed
  in as args). Tests.

## Week 5 — Data layer (Supabase, mocked in tests)

- [x] **Day 25 — Transactions read/create.** `lib/supabase/transactions.ts`. Mocked
  tests.
- [x] **Day 26 — Transactions update/delete.** Mocked tests.
- [x] **Day 27 — Categories CRUD.** `lib/supabase/categories.ts`. Mocked tests.
- [x] **Day 28 — Budgets CRUD.** `lib/supabase/budgets.ts`. Mocked tests.
- [x] **Day 29 — Data wiring.** Server actions/hooks to fetch a user's data.
- [x] **Day 30 — Error & loading helpers.** Result/error + loading utilities. Tests.
- [x] **Day 31 — Default categories.** Seed starter categories for a new user.

## Week 6 — Wire real data into the UI

> Replace the dummy data in the dashboard and every menu page with real
> Supabase-backed data, keeping the same polished UI.

- [ ] **Day 32 — App layout + session (real).** Finalize shell; show real user.
- [ ] **Day 33 — Dashboard data.** Wire dashboard widgets to real data.
- [ ] **Day 34 — Summary cards (real).** Balance / income / expense from real data.
- [ ] **Day 35 — Recent transactions (real).** Animated list from real data.
- [ ] **Day 36 — Category breakdown (real).** Animated bar/donut.
- [ ] **Day 37 — Budget widget (real).** Animated progress from budget status.
- [ ] **Day 38 — Dashboard polish.** Responsive + motion refinement.

## Week 7 — Transactions (functional)

- [ ] **Day 39 — Transactions list (real).** Wire the transactions page to real data.
- [ ] **Day 40 — Add transaction.** Animated modal/form, validated via lib/finance.
- [ ] **Day 41 — Edit transaction.** Prefilled animated form.
- [ ] **Day 42 — Delete transaction.** Confirm + undo snackbar.
- [ ] **Day 43 — Filter transactions.** By type/category (pure filter + UI).
- [ ] **Day 44 — Search transactions.** Text search (pure logic + input).
- [ ] **Day 45 — Month selector + pagination.** Filter by month, paginate.

## Week 8 — Categories & budgets (functional)

- [ ] **Day 46 — Categories (real).** Wire categories page to real data.
- [ ] **Day 47 — Add/edit category.** Color + icon picker, animated.
- [ ] **Day 48 — Delete category.** Reassign/handle linked transactions.
- [ ] **Day 49 — Budgets (real).** Wire budgets page to real data.
- [ ] **Day 50 — Set/edit budget.** Per category/month.
- [ ] **Day 51 — Budget alerts.** Over-budget indicators + toast.
- [ ] **Day 52 — Categories/budgets polish.** Motion + responsive.

## Week 9 — Charts & reports (functional)

- [ ] **Day 53 — Trend line chart.** Spending over time (aggregation tested).
- [ ] **Day 54 — Income vs expense chart.** Grouped bars.
- [ ] **Day 55 — Category donut.** Share per category.
- [ ] **Day 56 — Monthly report page.** Composed report view.
- [ ] **Day 57 — Yearly overview.** 12-month summary.
- [ ] **Day 58 — Report date-range filter.** Custom ranges (logic tested).
- [ ] **Day 59 — Chart animations.** Smooth transitions + polish.

## Week 10 — Advanced features I

- [ ] **Day 60 — Recurring transactions (logic).** Model + next-occurrence logic.
  Tests.
- [ ] **Day 61 — Recurring UI.** Create/manage recurring entries.
- [ ] **Day 62 — Accounts/wallets (model+data).** Multiple accounts, per-account
  balance. Tests + schema note.
- [ ] **Day 63 — Accounts UI + transfers.** Transfer between accounts.
- [ ] **Day 64 — Tags (logic+data).** Tag model + filter logic. Tests.
- [ ] **Day 65 — Tags UI.** Assign + filter by tag.
- [ ] **Day 66 — Receipts.** Upload receipt image to Supabase Storage, attach to a
  transaction.

## Week 11 — Advanced features II

- [ ] **Day 67 — Savings goals (logic).** Goal model + progress logic. Tests.
- [ ] **Day 68 — Savings goals UI.** Animated progress.
- [ ] **Day 69 — Multi-currency (logic).** Currency + conversion display. Tests.
- [ ] **Day 70 — Currency settings.** Choose currency, format everywhere.
- [ ] **Day 71 — Export CSV.** Export transactions (pure serializer tested).
- [ ] **Day 72 — Export PDF.** Export a report.
- [ ] **Day 73 — Import CSV.** Parse + validate + insert (parser tested).

## Week 12 — Insights & UX

- [ ] **Day 74 — Insights (real).** Top categories, average spend, trends (tested).
- [ ] **Day 75 — Budget recommendations.** Suggest budgets from history. Tests.
- [ ] **Day 76 — In-app notifications.** Over-budget / reminders center.
- [ ] **Day 77 — Onboarding.** First-run guided setup, animated.
- [ ] **Day 78 — Quick add / command palette.** Fast entry via keyboard.
- [ ] **Day 79 — Keyboard shortcuts.** Navigate + actions.
- [ ] **Day 80 — Skeleton/empty/error states.** Everywhere, animated.

## Week 13 — Polish & PWA

- [ ] **Day 81 — Settings (real).** Persist profile, currency, theme.
- [ ] **Day 82 — Theme customization.** Accent colors, persisted.
- [ ] **Day 83 — PWA.** Installable + offline app shell.
- [ ] **Day 84 — Performance.** Lazy-load, memoization, bundle trims.
- [ ] **Day 85 — Accessibility.** Focus, aria, contrast pass.
- [ ] **Day 86 — Error boundaries + 404/500.** Animated fallback pages.
- [ ] **Day 87 — SEO/meta.** Metadata + Open Graph for the landing page.

## Week 14 — Finalize (app)

- [ ] **Day 88 — Responsive audit.** Mobile/tablet/desktop across all pages.
- [ ] **Day 89 — Micro-interaction sweep.** Consistent hover/tap/transition feel.
- [ ] **Day 90 — 3D/animation refinement.** Tasteful accents across the app.
- [ ] **Day 91 — Test coverage pass.** Fill gaps in lib/ unit tests.
- [ ] **Day 92 — Documentation.** README feature list + screenshots placeholder.
- [ ] **Day 93 — Vercel deploy checklist + QA.** Final pass, deploy notes.
- [ ] **Day 94 — Buffer / bugfix.** Catch-all for anything left.

## Month 4 — Security hardening (Weeks 15-18)

> Goal: make the database and the app genuinely secure — no cross-user data
> leaks, hardened auth, and defense against common web attacks.

### Week 15 — Database security
- [ ] **Day 95 — RLS audit.** Verify every table's policies; add automated tests
  that attempt cross-user access and MUST be denied.
- [ ] **Day 96 — Server-side validation.** Validate/normalize every write on the
  server; never trust client input. Tests.
- [ ] **Day 97 — Rate limiting.** Throttle auth + write actions.
- [ ] **Day 98 — Secrets/env audit.** Ensure no service-role key reaches the
  client and no secret is in the bundle.
- [ ] **Day 99 — Injection review.** Confirm all DB access is parameterized via
  supabase-js; no raw string SQL.
- [ ] **Day 100 — Least privilege.** Tighten table + Storage bucket policies.
- [ ] **Day 101 — DB security docs.** Document the DB threat model in SECURITY.md.

### Week 16 — Auth & session security
- [ ] **Day 102 — Auth hardening.** Email confirmation on, strong password policy.
- [ ] **Day 103 — Session security.** Secure cookies, refresh, logout-everywhere.
- [ ] **Day 104 — Route guard audit.** Enforce auth server-side, not just client.
- [ ] **Day 105 — Sensitive-op re-auth.** Password change + re-auth prompts.
- [ ] **Day 106 — Brute-force protection.** Login lockout / backoff.
- [ ] **Day 107 — CSRF protection.** Protect mutating actions.
- [ ] **Day 108 — Auth security tests.**

### Week 17 — App / web security
- [ ] **Day 109 — Security headers.** CSP, HSTS, X-Frame-Options, etc. in config.
- [ ] **Day 110 — XSS review.** Escape/sanitize any user-rendered content.
- [ ] **Day 111 — Upload security.** Receipt uploads: validate type/size, safe storage.
- [ ] **Day 112 — Dependency audit.** `npm audit` + fix vulnerabilities.
- [ ] **Day 113 — Safe errors.** Never leak stack traces or secrets to the client.
- [ ] **Day 114 — Audit logging.** Record security-relevant events.
- [ ] **Day 115 — API surface + CORS review.**

### Week 18 — Review & finalize
- [ ] **Day 116 — Cross-user pen tests.** Automated attempts to read others' data.
- [ ] **Day 117 — Auth abuse tests.**
- [ ] **Day 118 — Fix findings (round 1).**
- [ ] **Day 119 — Fix findings (round 2).**
- [ ] **Day 120 — Security regression suite.**
- [ ] **Day 121 — SECURITY.md + threat model.**
- [ ] **Day 122 — Final security QA + sign-off.**

---

### Notes for the human (product owner)

- Reorder/adjust freely before the agent reaches a day.
- Split any day that feels too big (logic/data one day, UI the next).
