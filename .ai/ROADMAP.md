# Roadmap — Finance Tracker (Next.js + Supabase, ~3 months)

Source of truth for **what** to build. The agent picks daily tasks from
`.ai/TASKS.md`. Tick a box when a whole phase is done.

## Phase 1 — Landing page (Week 1)
- [x] Complete landing page, then modern UI + framer-motion + 3D + polish

## Phase 2 — Auth (Week 2)
- [ ] Supabase Auth: sign up, login, session, protected routes, account

## Phase 3 — Core finance logic (Week 3, pure & tested)
- [ ] Formatting, model/validation, totals, by-category, monthly, budget, periods

## Phase 4 — Data layer (Week 4, Supabase)
- [ ] Transactions / categories / budgets CRUD, data wiring, defaults

## Phase 5 — App shell & dashboard (Week 5)
- [ ] Authed layout, dashboard, summary cards, widgets

## Phase 6 — Transactions UI (Week 6)
- [ ] List, add, edit, delete, filter, search, month + pagination

## Phase 7 — Categories & budgets UI (Week 7)
- [ ] Category CRUD UI, budgets UI, alerts

## Phase 8 — Charts & reports (Week 8)
- [ ] Trend, income/expense, donut, monthly & yearly reports

## Phase 9 — Advanced I (Week 9)
- [ ] Recurring, accounts/transfers, tags, receipts (Storage)

## Phase 10 — Advanced II (Week 10)
- [ ] Savings goals, multi-currency, export CSV/PDF, import CSV

## Phase 11 — Insights & UX (Week 11)
- [ ] Insights, recommendations, notifications, onboarding, command palette

## Phase 12 — Polish & PWA (Week 12)
- [ ] Settings, theming, PWA, performance, a11y, error pages, SEO

## Phase 13 — Finalize (Week 13)
- [ ] Responsive audit, micro-interactions, 3D refinement, tests, docs, deploy

## Phase 14 — Security hardening (Month 4, Weeks 14-17)
- [ ] Database security (RLS audit, validation, least privilege)
- [ ] Auth & session security (hardening, guards, re-auth, brute-force)
- [ ] Web security (headers/CSP, XSS, uploads, deps, safe errors)
- [ ] Pen-test, fixes, regression suite, SECURITY.md

---

**Rule:** the agent does not invent features. A human adds them here first.
