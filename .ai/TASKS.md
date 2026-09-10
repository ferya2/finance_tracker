# Daily Tasks — ~4 Month Plan (120 days)

One small task per day. The agent works on the **first unchecked** day, completes
it, ticks the box, and opens a PR. Never bundle two days into one run.

> Week 1 is the **landing page**: Day 01 ships a complete (rough) landing page;
> Days 02-08 elevate it toward the design reference (see `.ai/DESIGN.md` and
> AGENTS.md). After that the app is built logic-first so the Vitest gate stays
> reliable. Month 4 is dedicated to security.

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

- [ ] **Day 09 — Supabase client + env.** `lib/supabase/client.ts`, `.env.example`,
  auth helper. Test the module loads with mocked env.
- [ ] **Day 10 — Sign up page.** Form + validation wired to Supabase Auth. Animated.
  Tests.
- [ ] **Day 11 — Login page.** Login form + error handling. Animated. Tests.
- [ ] **Day 12 — Session & logout.** User/session context/provider + logout. Tests
  for the pure helpers.
- [ ] **Day 13 — Protected routes.** Middleware/guard: redirect unauthenticated
  users to login; redirect logged-in users away from auth pages.
- [ ] **Day 14 — Auth UX polish.** Loading states, inline errors, transitions,
  "forgot password" stub.
- [ ] **Day 15 — Account basics.** Show current user, basic profile display.

## Week 3 — Core finance logic (pure, unit-tested)

- [ ] **Day 16 — Money formatting.** `lib/finance/format.ts`: `formatCurrency`,
  `parseAmount` (cents-based). Full tests.
- [ ] **Day 17 — Transaction model.** `types/transaction.ts` + `validateTransaction`.
  Tests for valid/invalid.
- [ ] **Day 18 — Totals.** `sumIncome`, `sumExpense`, `balance`. Full tests.
- [ ] **Day 19 — By category.** Group + sum per category, sorted. Full tests.
- [ ] **Day 20 — Monthly summary.** Filter by year+month → {income,expense,balance}.
  Full tests.
- [ ] **Day 21 — Budget status.** {spent, remaining, percent, overBudget}. Tests.
- [ ] **Day 22 — Date/period helpers.** Month ranges, current period (dates passed
  in as args). Tests.

## Week 4 — Data layer (Supabase, mocked in tests)

- [ ] **Day 23 — Transactions read/create.** `lib/supabase/transactions.ts`. Mocked
  tests.
- [ ] **Day 24 — Transactions update/delete.** Mocked tests.
- [ ] **Day 25 — Categories CRUD.** `lib/supabase/categories.ts`. Mocked tests.
- [ ] **Day 26 — Budgets CRUD.** `lib/supabase/budgets.ts`. Mocked tests.
- [ ] **Day 27 — Data wiring.** Server actions/hooks to fetch a user's data.
- [ ] **Day 28 — Error & loading helpers.** Result/error + loading utilities. Tests.
- [ ] **Day 29 — Default categories.** Seed starter categories for a new user.

## Week 5 — App shell & dashboard

- [ ] **Day 30 — Authed app layout.** Sidebar/top nav, dark mode, page transitions.
- [ ] **Day 31 — Dashboard skeleton.** Route + grid layout + placeholders.
- [ ] **Day 32 — Summary cards.** Balance / income / expense with animated counters.
- [ ] **Day 33 — Recent transactions widget.** Animated list on the dashboard.
- [ ] **Day 34 — Category breakdown widget.** Animated bar/donut.
- [ ] **Day 35 — Budget widget.** Animated progress bars from budget status.
- [ ] **Day 36 — Dashboard polish.** Responsive + motion refinement.

## Week 6 — Transactions UI

- [ ] **Day 37 — Transactions page.** Animated list, formatted amounts.
- [ ] **Day 38 — Add transaction.** Animated modal/form, validated via lib/finance.
- [ ] **Day 39 — Edit transaction.** Prefilled animated form.
- [ ] **Day 40 — Delete transaction.** Confirm + undo snackbar.
- [ ] **Day 41 — Filter transactions.** By type/category (pure filter + UI).
- [ ] **Day 42 — Search transactions.** Text search (pure logic + input).
- [ ] **Day 43 — Month selector + pagination.** Filter by month, paginate.

## Week 7 — Categories & budgets UI

- [ ] **Day 44 — Categories page.** List with colors.
- [ ] **Day 45 — Add/edit category.** Color + icon picker, animated.
- [ ] **Day 46 — Delete category.** Reassign/handle linked transactions.
- [ ] **Day 47 — Budgets page.** List budgets per month.
- [ ] **Day 48 — Set/edit budget.** Per category/month.
- [ ] **Day 49 — Budget alerts.** Over-budget indicators + toast.
- [ ] **Day 50 — Categories/budgets polish.** Motion + responsive.

## Week 8 — Charts & reports

- [ ] **Day 51 — Trend line chart.** Spending over time (aggregation tested).
- [ ] **Day 52 — Income vs expense chart.** Grouped bars.
- [ ] **Day 53 — Category donut.** Share per category.
- [ ] **Day 54 — Monthly report page.** Composed report view.
- [ ] **Day 55 — Yearly overview.** 12-month summary.
- [ ] **Day 56 — Report date-range filter.** Custom ranges (logic tested).
- [ ] **Day 57 — Chart animations.** Smooth transitions + polish.

## Week 9 — Advanced features I

- [ ] **Day 58 — Recurring transactions (logic).** Model + next-occurrence logic.
  Tests.
- [ ] **Day 59 — Recurring UI.** Create/manage recurring entries.
- [ ] **Day 60 — Accounts/wallets (model+data).** Multiple accounts, per-account
  balance. Tests + schema note.
- [ ] **Day 61 — Accounts UI + transfers.** Transfer between accounts.
- [ ] **Day 62 — Tags (logic+data).** Tag model + filter logic. Tests.
- [ ] **Day 63 — Tags UI.** Assign + filter by tag.
- [ ] **Day 64 — Receipts.** Upload receipt image to Supabase Storage, attach to a
  transaction.

## Week 10 — Advanced features II

- [ ] **Day 65 — Savings goals (logic).** Goal model + progress logic. Tests.
- [ ] **Day 66 — Savings goals UI.** Animated progress.
- [ ] **Day 67 — Multi-currency (logic).** Currency + conversion display. Tests.
- [ ] **Day 68 — Currency settings.** Choose currency, format everywhere.
- [ ] **Day 69 — Export CSV.** Export transactions (pure serializer tested).
- [ ] **Day 70 — Export PDF.** Export a report.
- [ ] **Day 71 — Import CSV.** Parse + validate + insert (parser tested).

## Week 11 — Insights & UX

- [ ] **Day 72 — Insights.** Top categories, average spend, trends (logic tested).
- [ ] **Day 73 — Budget recommendations.** Suggest budgets from history. Tests.
- [ ] **Day 74 — In-app notifications.** Over-budget / reminders center.
- [ ] **Day 75 — Onboarding.** First-run guided setup, animated.
- [ ] **Day 76 — Quick add / command palette.** Fast entry via keyboard.
- [ ] **Day 77 — Keyboard shortcuts.** Navigate + actions.
- [ ] **Day 78 — Skeleton/empty/error states.** Everywhere, animated.

## Week 12 — Polish & PWA

- [ ] **Day 79 — Settings page.** Profile, currency, theme, danger zone.
- [ ] **Day 80 — Theme customization.** Accent colors, persisted.
- [ ] **Day 81 — PWA.** Installable + offline app shell.
- [ ] **Day 82 — Performance.** Lazy-load, memoization, bundle trims.
- [ ] **Day 83 — Accessibility.** Focus, aria, contrast pass.
- [ ] **Day 84 — Error boundaries + 404/500.** Animated fallback pages.
- [ ] **Day 85 — SEO/meta.** Metadata + Open Graph for the landing page.

## Week 13 — Finalize (app)

- [ ] **Day 86 — Responsive audit.** Mobile/tablet/desktop across all pages.
- [ ] **Day 87 — Micro-interaction sweep.** Consistent hover/tap/transition feel.
- [ ] **Day 88 — 3D/animation refinement.** Tasteful accents on dashboard.
- [ ] **Day 89 — Test coverage pass.** Fill gaps in lib/ unit tests.
- [ ] **Day 90 — Documentation.** README feature list + screenshots placeholder.
- [ ] **Day 91 — Vercel deploy checklist + QA.** Final pass, deploy notes.
- [ ] **Day 92 — Buffer / bugfix.** Catch-all for anything left.

## Month 4 — Security hardening (Weeks 14-17)

> Goal: make the database and the app genuinely secure — no cross-user data
> leaks, hardened auth, and defense against common web attacks.

### Week 14 — Database security
- [ ] **Day 93 — RLS audit.** Verify every table's policies; add automated tests
  that attempt cross-user access and MUST be denied.
- [ ] **Day 94 — Server-side validation.** Validate/normalize every write on the
  server; never trust client input. Tests.
- [ ] **Day 95 — Rate limiting.** Throttle auth + write actions.
- [ ] **Day 96 — Secrets/env audit.** Ensure no service-role key reaches the
  client and no secret is in the bundle.
- [ ] **Day 97 — Injection review.** Confirm all DB access is parameterized via
  supabase-js; no raw string SQL.
- [ ] **Day 98 — Least privilege.** Tighten table + Storage bucket policies.
- [ ] **Day 99 — DB security docs.** Document the DB threat model in SECURITY.md.

### Week 15 — Auth & session security
- [ ] **Day 100 — Auth hardening.** Email confirmation on, strong password policy.
- [ ] **Day 101 — Session security.** Secure cookies, refresh, logout-everywhere.
- [ ] **Day 102 — Route guard audit.** Enforce auth server-side, not just client.
- [ ] **Day 103 — Sensitive-op re-auth.** Password change + re-auth prompts.
- [ ] **Day 104 — Brute-force protection.** Login lockout / backoff.
- [ ] **Day 105 — CSRF protection.** Protect mutating actions.
- [ ] **Day 106 — Auth security tests.**

### Week 16 — App / web security
- [ ] **Day 107 — Security headers.** CSP, HSTS, X-Frame-Options, etc. in config.
- [ ] **Day 108 — XSS review.** Escape/sanitize any user-rendered content.
- [ ] **Day 109 — Upload security.** Receipt uploads: validate type/size, safe storage.
- [ ] **Day 110 — Dependency audit.** `npm audit` + fix vulnerabilities.
- [ ] **Day 111 — Safe errors.** Never leak stack traces or secrets to the client.
- [ ] **Day 112 — Audit logging.** Record security-relevant events.
- [ ] **Day 113 — API surface + CORS review.**

### Week 17 — Review & finalize
- [ ] **Day 114 — Cross-user pen tests.** Automated attempts to read others' data.
- [ ] **Day 115 — Auth abuse tests.**
- [ ] **Day 116 — Fix findings (round 1).**
- [ ] **Day 117 — Fix findings (round 2).**
- [ ] **Day 118 — Security regression suite.**
- [ ] **Day 119 — SECURITY.md + threat model.**
- [ ] **Day 120 — Final security QA + sign-off.**

---

### Notes for the human (product owner)

- Reorder/adjust freely before the agent reaches a day.
- Split any day that feels too big (logic/data one day, UI the next).
