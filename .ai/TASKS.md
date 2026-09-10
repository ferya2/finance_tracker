# Daily Tasks — 3 Month Plan (~90 days)

One small task per day. The agent works on the **first unchecked** day, completes
it, ticks the box, and opens a PR. Never bundle two days into one run.

> Week 1 is the **landing page**: Day 01 ships a complete (rough) landing page;
> Days 02-07 elevate it with modern UI, framer-motion, and 3D. After that the app
> is built logic-first so the Vitest gate stays reliable.

---

## Week 1 — Landing page

- [x] **Day 01 — Landing page (rough, complete).** Build a full landing page:
  hero (headline + CTA), features section, "how it works", and footer. Real
  content, sensible layout. `npm run lint` + `npm test` pass.
- [x] **Day 02 — Design system + modern polish.** Color tokens, typography scale,
  spacing, dark mode. Refine the landing to look modern and intentional.
- [x] **Day 03 — Entrance & scroll animations.** framer-motion: hero entrance,
  section reveal-on-scroll, staggered feature cards.
- [x] **Day 04 — 3D hero.** Add a react-three-fiber scene to the hero (e.g. a
  floating coin/card/abstract shape) that reacts subtly to the pointer.
- [ ] **Day 05 — 3D / interactive background.** Ambient 3D or animated gradient
  mesh / particles behind sections, kept performant.
- [ ] **Day 06 — Micro-interactions.** Buttons, hover states, magnetic CTA,
  animated nav, smooth anchor scrolling.
- [ ] **Day 07 — Responsive + performance.** Make the landing flawless on mobile;
  lazy-load 3D, respect prefers-reduced-motion, Lighthouse-friendly.

## Week 2 — Auth (Supabase)

- [ ] **Day 08 — Supabase client + env.** `lib/supabase/client.ts`, `.env.example`,
  auth helper. Test the module loads with mocked env.
- [ ] **Day 09 — Sign up page.** Form + validation (email/password) wired to
  Supabase Auth. Animated. Render/logic tests.
- [ ] **Day 10 — Login page.** Login form + error handling. Animated. Tests.
- [ ] **Day 11 — Session & logout.** User/session context/provider + logout. Tests
  for the pure helpers.
- [ ] **Day 12 — Protected routes.** Middleware/guard: redirect unauthenticated
  users to login; redirect logged-in users away from auth pages.
- [ ] **Day 13 — Auth UX polish.** Loading states, inline errors, transitions,
  "forgot password" stub.
- [ ] **Day 14 — Account basics.** Show current user, basic profile display.

## Week 3 — Core finance logic (pure, unit-tested)

- [ ] **Day 15 — Money formatting.** `lib/finance/format.ts`: `formatCurrency`,
  `parseAmount` (cents-based). Full tests.
- [ ] **Day 16 — Transaction model.** `types/transaction.ts` + `validateTransaction`.
  Tests for valid/invalid.
- [ ] **Day 17 — Totals.** `sumIncome`, `sumExpense`, `balance`. Full tests.
- [ ] **Day 18 — By category.** Group + sum per category, sorted. Full tests.
- [ ] **Day 19 — Monthly summary.** Filter by year+month → {income,expense,balance}.
  Full tests.
- [ ] **Day 20 — Budget status.** {spent, remaining, percent, overBudget}. Tests.
- [ ] **Day 21 — Date/period helpers.** Month ranges, current period (dates passed
  in as args). Tests.

## Week 4 — Data layer (Supabase, mocked in tests)

- [ ] **Day 22 — Transactions read/create.** `lib/supabase/transactions.ts`. Mocked
  tests.
- [ ] **Day 23 — Transactions update/delete.** Mocked tests.
- [ ] **Day 24 — Categories CRUD.** `lib/supabase/categories.ts`. Mocked tests.
- [ ] **Day 25 — Budgets CRUD.** `lib/supabase/budgets.ts`. Mocked tests.
- [ ] **Day 26 — Data wiring.** Server actions/hooks to fetch a user's data.
- [ ] **Day 27 — Error & loading helpers.** Result/error + loading utilities. Tests.
- [ ] **Day 28 — Default categories.** Seed starter categories for a new user.

## Week 5 — App shell & dashboard

- [ ] **Day 29 — Authed app layout.** Sidebar/top nav, dark mode, page transitions.
- [ ] **Day 30 — Dashboard skeleton.** Route + grid layout + placeholders.
- [ ] **Day 31 — Summary cards.** Balance / income / expense with animated counters.
- [ ] **Day 32 — Recent transactions widget.** Animated list on the dashboard.
- [ ] **Day 33 — Category breakdown widget.** Animated bar/donut.
- [ ] **Day 34 — Budget widget.** Animated progress bars from budget status.
- [ ] **Day 35 — Dashboard polish.** Responsive + motion refinement.

## Week 6 — Transactions UI

- [ ] **Day 36 — Transactions page.** Animated list, formatted amounts.
- [ ] **Day 37 — Add transaction.** Animated modal/form, validated via lib/finance.
- [ ] **Day 38 — Edit transaction.** Prefilled animated form.
- [ ] **Day 39 — Delete transaction.** Confirm + undo snackbar.
- [ ] **Day 40 — Filter transactions.** By type/category (pure filter + UI).
- [ ] **Day 41 — Search transactions.** Text search (pure logic + input).
- [ ] **Day 42 — Month selector + pagination.** Filter by month, paginate.

## Week 7 — Categories & budgets UI

- [ ] **Day 43 — Categories page.** List with colors.
- [ ] **Day 44 — Add/edit category.** Color + icon picker, animated.
- [ ] **Day 45 — Delete category.** Reassign/handle linked transactions.
- [ ] **Day 46 — Budgets page.** List budgets per month.
- [ ] **Day 47 — Set/edit budget.** Per category/month.
- [ ] **Day 48 — Budget alerts.** Over-budget indicators + toast.
- [ ] **Day 49 — Categories/budgets polish.** Motion + responsive.

## Week 8 — Charts & reports

- [ ] **Day 50 — Trend line chart.** Spending over time (aggregation tested).
- [ ] **Day 51 — Income vs expense chart.** Grouped bars.
- [ ] **Day 52 — Category donut.** Share per category.
- [ ] **Day 53 — Monthly report page.** Composed report view.
- [ ] **Day 54 — Yearly overview.** 12-month summary.
- [ ] **Day 55 — Report date-range filter.** Custom ranges (logic tested).
- [ ] **Day 56 — Chart animations.** Smooth transitions + polish.

## Week 9 — Advanced features I

- [ ] **Day 57 — Recurring transactions (logic).** Model + next-occurrence logic.
  Tests.
- [ ] **Day 58 — Recurring UI.** Create/manage recurring entries.
- [ ] **Day 59 — Accounts/wallets (model+data).** Multiple accounts, per-account
  balance. Tests + schema note.
- [ ] **Day 60 — Accounts UI + transfers.** Transfer between accounts.
- [ ] **Day 61 — Tags (logic+data).** Tag model + filter logic. Tests.
- [ ] **Day 62 — Tags UI.** Assign + filter by tag.
- [ ] **Day 63 — Receipts.** Upload receipt image to Supabase Storage, attach to a
  transaction.

## Week 10 — Advanced features II

- [ ] **Day 64 — Savings goals (logic).** Goal model + progress logic. Tests.
- [ ] **Day 65 — Savings goals UI.** Animated progress.
- [ ] **Day 66 — Multi-currency (logic).** Currency + conversion display. Tests.
- [ ] **Day 67 — Currency settings.** Choose currency, format everywhere.
- [ ] **Day 68 — Export CSV.** Export transactions (pure serializer tested).
- [ ] **Day 69 — Export PDF.** Export a report.
- [ ] **Day 70 — Import CSV.** Parse + validate + insert (parser tested).

## Week 11 — Insights & UX

- [ ] **Day 71 — Insights.** Top categories, average spend, trends (logic tested).
- [ ] **Day 72 — Budget recommendations.** Suggest budgets from history. Tests.
- [ ] **Day 73 — In-app notifications.** Over-budget / reminders center.
- [ ] **Day 74 — Onboarding.** First-run guided setup, animated.
- [ ] **Day 75 — Quick add / command palette.** Fast entry via keyboard.
- [ ] **Day 76 — Keyboard shortcuts.** Navigate + actions.
- [ ] **Day 77 — Skeleton/empty/error states.** Everywhere, animated.

## Week 12 — Polish & PWA

- [ ] **Day 78 — Settings page.** Profile, currency, theme, danger zone.
- [ ] **Day 79 — Theme customization.** Accent colors, persisted.
- [ ] **Day 80 — PWA.** Installable + offline app shell.
- [ ] **Day 81 — Performance.** Lazy-load, memoization, bundle trims.
- [ ] **Day 82 — Accessibility.** Focus, aria, contrast pass.
- [ ] **Day 83 — Error boundaries + 404/500.** Animated fallback pages.
- [ ] **Day 84 — SEO/meta.** Metadata + Open Graph for the landing page.

## Week 13 — Finalize

- [ ] **Day 85 — Responsive audit.** Mobile/tablet/desktop across all pages.
- [ ] **Day 86 — Micro-interaction sweep.** Consistent hover/tap/transition feel.
- [ ] **Day 87 — 3D/animation refinement.** Tasteful accents on dashboard.
- [ ] **Day 88 — Test coverage pass.** Fill gaps in lib/ unit tests.
- [ ] **Day 89 — Documentation.** README feature list + screenshots placeholder.
- [ ] **Day 90 — Vercel deploy checklist + QA.** Final pass, deploy notes.
- [ ] **Day 91 — Buffer / bugfix.** Catch-all for anything left.

## Month 4 — Security hardening (Weeks 14-17)

> Goal: make the database and the app genuinely secure — no cross-user data
> leaks, hardened auth, and defense against common web attacks.

### Week 14 — Database security
- [ ] **Day 92 — RLS audit.** Verify every table's policies; add automated tests
  that attempt cross-user access and MUST be denied.
- [ ] **Day 93 — Server-side validation.** Validate/normalize every write on the
  server; never trust client input. Tests.
- [ ] **Day 94 — Rate limiting.** Throttle auth + write actions.
- [ ] **Day 95 — Secrets/env audit.** Ensure no service-role key reaches the
  client and no secret is in the bundle.
- [ ] **Day 96 — Injection review.** Confirm all DB access is parameterized via
  supabase-js; no raw string SQL.
- [ ] **Day 97 — Least privilege.** Tighten table + Storage bucket policies.
- [ ] **Day 98 — DB security docs.** Document the DB threat model in SECURITY.md.

### Week 15 — Auth & session security
- [ ] **Day 99 — Auth hardening.** Email confirmation on, strong password policy.
- [ ] **Day 100 — Session security.** Secure cookies, refresh, logout-everywhere.
- [ ] **Day 101 — Route guard audit.** Enforce auth server-side, not just client.
- [ ] **Day 102 — Sensitive-op re-auth.** Password change + re-auth prompts.
- [ ] **Day 103 — Brute-force protection.** Login lockout / backoff.
- [ ] **Day 104 — CSRF protection.** Protect mutating actions.
- [ ] **Day 105 — Auth security tests.**

### Week 16 — App / web security
- [ ] **Day 106 — Security headers.** CSP, HSTS, X-Frame-Options, etc. in config.
- [ ] **Day 107 — XSS review.** Escape/sanitize any user-rendered content.
- [ ] **Day 108 — Upload security.** Receipt uploads: validate type/size, safe storage.
- [ ] **Day 109 — Dependency audit.** `npm audit` + fix vulnerabilities.
- [ ] **Day 110 — Safe errors.** Never leak stack traces or secrets to the client.
- [ ] **Day 111 — Audit logging.** Record security-relevant events.
- [ ] **Day 112 — API surface + CORS review.**

### Week 17 — Review & finalize
- [ ] **Day 113 — Cross-user pen tests.** Automated attempts to read others' data.
- [ ] **Day 114 — Auth abuse tests.**
- [ ] **Day 115 — Fix findings (round 1).**
- [ ] **Day 116 — Fix findings (round 2).**
- [ ] **Day 117 — Security regression suite.**
- [ ] **Day 118 — SECURITY.md + threat model.**
- [ ] **Day 119 — Final security QA + sign-off.**

---

### Notes for the human (product owner)

- Reorder/adjust freely before the agent reaches a day.
- Split any day that feels too big (logic/data one day, UI the next).
