# Daily Tasks — ~4 Month Plan (121 days)

One small task per day. The agent works on the **first unchecked** day, completes
it, ticks the box, and opens a PR. Never bundle two days into one run.

> Week 1 is the **landing page**: Day 01 ships a complete (rough) landing page;
> Days 02-08 elevate it toward the design reference (see `.ai/DESIGN.md` and
> AGENTS.md). Then auth, an early dummy-data dashboard (Day 18), logic-first
> feature work, and finally Month 4 is dedicated to security.

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

## Week 3 — Core finance logic + dummy dashboard

- [x] **Day 16 — Money formatting.** `lib/finance/format.ts`: `formatCurrency`,
  `parseAmount` (cents-based). Full tests.
- [x] **Day 17 — Transaction model.** `types/transaction.ts` + `validateTransaction`.
  Tests for valid/invalid.
- [x] **Day 18 — Dashboard shell + full dummy UI (many menus).** Build a beautiful
  authed app shell + dashboard using DUMMY data only (no Supabase queries yet).
  Sidebar/top nav linking ALL planned areas — Dashboard, Transactions, Categories,
  Budgets, Reports, Insights, Settings (each a placeholder page is fine for now).
  Dashboard page: summary cards (balance / income / expense with animated
  counters), a recent-transactions list, a category breakdown, and budget progress
  bars — all hardcoded dummy data. Dark mode, smooth framer-motion, follow the
  `.ai/DESIGN.md` aesthetic (clean, modern, premium). Redirect signed-in users to
  `/dashboard` after login/sign-up. Real data is wired in Weeks 4-5 — do NOT query
  Supabase here. Keep it type-clean (`npm run typecheck`); render tests where
  practical.
- [ ] **Day 19 — Totals.** `sumIncome`, `sumExpense`, `balance`. Full tests.
- [ ] **Day 20 — By category.** Group + sum per category, sorted. Full tests.
- [ ] **Day 21 — Monthly summary.** Filter by year+month → {income,expense,balance}.
  Full tests.
- [ ] **Day 22 — Budget status.** {spent, remaining, percent, overBudget}. Tests.
- [ ] **Day 23 — Date/period helpers.** Month ranges, current period (dates passed
  in as args). Tests.

## Week 4 — Data layer (Supabase, mocked in tests)

- [ ] **Day 24 — Transactions read/create.** `lib/supabase/transactions.ts`. Mocked
  tests.
- [ ] **Day 25 — Transactions update/delete.** Mocked tests.
- [ ] **Day 26 — Categories CRUD.** `lib/supabase/categories.ts`. Mocked tests.
- [ ] **Day 27 — Budgets CRUD.** `lib/supabase/budgets.ts`. Mocked tests.
- [ ] **Day 28 — Data wiring.** Server actions/hooks to fetch a user's data.
- [ ] **Day 29 — Error & loading helpers.** Result/error + loading utilities. Tests.
- [ ] **Day 30 — Default categories.** Seed starter categories for a new user.

## Week 5 — Wire real data into the dashboard

> Replace the Day 18 dummy data with real Supabase-backed data, keeping the same UI.

- [ ] **Day 31 — Authed app layout (real).** Finalize sidebar/top nav, dark mode,
  page transitions on the real app shell.
- [ ] **Day 32 — Dashboard data.** Wire the dashboard to real user data (from the
  Week 4 data layer), replacing dummy values.
- [ ] **Day 33 — Summary cards (real).** Balance / income / expense from real data.
- [ ] **Day 34 — Recent transactions widget (real).** Animated list from real data.
- [ ] **Day 35 — Category breakdown widget (real).** Animated bar/donut.
- [ ] **Day 36 — Budget widget (real).** Animated progress bars from budget status.
- [ ] **Day 37 — Dashboard polish.** Responsive + motion refinement.

## Week 6 — Transactions UI

- [ ] **Day 38 — Transactions page.** Animated list, formatted amounts.
- [ ] **Day 39 — Add transaction.** Animated modal/form, validated via lib/finance.
- [ ] **Day 40 — Edit transaction.** Prefilled animated form.
- [ ] **Day 41 — Delete transaction.** Confirm + undo snackbar.
- [ ] **Day 42 — Filter transactions.** By type/category (pure filter + UI).
- [ ] **Day 43 — Search transactions.** Text search (pure logic + input).
- [ ] **Day 44 — Month selector + pagination.** Filter by month, paginate.

## Week 7 — Categories & budgets UI

- [ ] **Day 45 — Categories page.** List with colors.
- [ ] **Day 46 — Add/edit category.** Color + icon picker, animated.
- [ ] **Day 47 — Delete category.** Reassign/handle linked transactions.
- [ ] **Day 48 — Budgets page.** List budgets per month.
- [ ] **Day 49 — Set/edit budget.** Per category/month.
- [ ] **Day 50 — Budget alerts.** Over-budget indicators + toast.
- [ ] **Day 51 — Categories/budgets polish.** Motion + responsive.

## Week 8 — Charts & reports

- [ ] **Day 52 — Trend line chart.** Spending over time (aggregation tested).
- [ ] **Day 53 — Income vs expense chart.** Grouped bars.
- [ ] **Day 54 — Category donut.** Share per category.
- [ ] **Day 55 — Monthly report page.** Composed report view.
- [ ] **Day 56 — Yearly overview.** 12-month summary.
- [ ] **Day 57 — Report date-range filter.** Custom ranges (logic tested).
- [ ] **Day 58 — Chart animations.** Smooth transitions + polish.

## Week 9 — Advanced features I

- [ ] **Day 59 — Recurring transactions (logic).** Model + next-occurrence logic.
  Tests.
- [ ] **Day 60 — Recurring UI.** Create/manage recurring entries.
- [ ] **Day 61 — Accounts/wallets (model+data).** Multiple accounts, per-account
  balance. Tests + schema note.
- [ ] **Day 62 — Accounts UI + transfers.** Transfer between accounts.
- [ ] **Day 63 — Tags (logic+data).** Tag model + filter logic. Tests.
- [ ] **Day 64 — Tags UI.** Assign + filter by tag.
- [ ] **Day 65 — Receipts.** Upload receipt image to Supabase Storage, attach to a
  transaction.

## Week 10 — Advanced features II

- [ ] **Day 66 — Savings goals (logic).** Goal model + progress logic. Tests.
- [ ] **Day 67 — Savings goals UI.** Animated progress.
- [ ] **Day 68 — Multi-currency (logic).** Currency + conversion display. Tests.
- [ ] **Day 69 — Currency settings.** Choose currency, format everywhere.
- [ ] **Day 70 — Export CSV.** Export transactions (pure serializer tested).
- [ ] **Day 71 — Export PDF.** Export a report.
- [ ] **Day 72 — Import CSV.** Parse + validate + insert (parser tested).

## Week 11 — Insights & UX

- [ ] **Day 73 — Insights.** Top categories, average spend, trends (logic tested).
- [ ] **Day 74 — Budget recommendations.** Suggest budgets from history. Tests.
- [ ] **Day 75 — In-app notifications.** Over-budget / reminders center.
- [ ] **Day 76 — Onboarding.** First-run guided setup, animated.
- [ ] **Day 77 — Quick add / command palette.** Fast entry via keyboard.
- [ ] **Day 78 — Keyboard shortcuts.** Navigate + actions.
- [ ] **Day 79 — Skeleton/empty/error states.** Everywhere, animated.

## Week 12 — Polish & PWA

- [ ] **Day 80 — Settings page.** Profile, currency, theme, danger zone.
- [ ] **Day 81 — Theme customization.** Accent colors, persisted.
- [ ] **Day 82 — PWA.** Installable + offline app shell.
- [ ] **Day 83 — Performance.** Lazy-load, memoization, bundle trims.
- [ ] **Day 84 — Accessibility.** Focus, aria, contrast pass.
- [ ] **Day 85 — Error boundaries + 404/500.** Animated fallback pages.
- [ ] **Day 86 — SEO/meta.** Metadata + Open Graph for the landing page.

## Week 13 — Finalize (app)

- [ ] **Day 87 — Responsive audit.** Mobile/tablet/desktop across all pages.
- [ ] **Day 88 — Micro-interaction sweep.** Consistent hover/tap/transition feel.
- [ ] **Day 89 — 3D/animation refinement.** Tasteful accents on dashboard.
- [ ] **Day 90 — Test coverage pass.** Fill gaps in lib/ unit tests.
- [ ] **Day 91 — Documentation.** README feature list + screenshots placeholder.
- [ ] **Day 92 — Vercel deploy checklist + QA.** Final pass, deploy notes.
- [ ] **Day 93 — Buffer / bugfix.** Catch-all for anything left.

## Month 4 — Security hardening (Weeks 14-17)

> Goal: make the database and the app genuinely secure — no cross-user data
> leaks, hardened auth, and defense against common web attacks.

### Week 14 — Database security
- [ ] **Day 94 — RLS audit.** Verify every table's policies; add automated tests
  that attempt cross-user access and MUST be denied.
- [ ] **Day 95 — Server-side validation.** Validate/normalize every write on the
  server; never trust client input. Tests.
- [ ] **Day 96 — Rate limiting.** Throttle auth + write actions.
- [ ] **Day 97 — Secrets/env audit.** Ensure no service-role key reaches the
  client and no secret is in the bundle.
- [ ] **Day 98 — Injection review.** Confirm all DB access is parameterized via
  supabase-js; no raw string SQL.
- [ ] **Day 99 — Least privilege.** Tighten table + Storage bucket policies.
- [ ] **Day 100 — DB security docs.** Document the DB threat model in SECURITY.md.

### Week 15 — Auth & session security
- [ ] **Day 101 — Auth hardening.** Email confirmation on, strong password policy.
- [ ] **Day 102 — Session security.** Secure cookies, refresh, logout-everywhere.
- [ ] **Day 103 — Route guard audit.** Enforce auth server-side, not just client.
- [ ] **Day 104 — Sensitive-op re-auth.** Password change + re-auth prompts.
- [ ] **Day 105 — Brute-force protection.** Login lockout / backoff.
- [ ] **Day 106 — CSRF protection.** Protect mutating actions.
- [ ] **Day 107 — Auth security tests.**

### Week 16 — App / web security
- [ ] **Day 108 — Security headers.** CSP, HSTS, X-Frame-Options, etc. in config.
- [ ] **Day 109 — XSS review.** Escape/sanitize any user-rendered content.
- [ ] **Day 110 — Upload security.** Receipt uploads: validate type/size, safe storage.
- [ ] **Day 111 — Dependency audit.** `npm audit` + fix vulnerabilities.
- [ ] **Day 112 — Safe errors.** Never leak stack traces or secrets to the client.
- [ ] **Day 113 — Audit logging.** Record security-relevant events.
- [ ] **Day 114 — API surface + CORS review.**

### Week 17 — Review & finalize
- [ ] **Day 115 — Cross-user pen tests.** Automated attempts to read others' data.
- [ ] **Day 116 — Auth abuse tests.**
- [ ] **Day 117 — Fix findings (round 1).**
- [ ] **Day 118 — Fix findings (round 2).**
- [ ] **Day 119 — Security regression suite.**
- [ ] **Day 120 — SECURITY.md + threat model.**
- [ ] **Day 121 — Final security QA + sign-off.**

---

### Notes for the human (product owner)

- Reorder/adjust freely before the agent reaches a day.
- Split any day that feels too big (logic/data one day, UI the next).
