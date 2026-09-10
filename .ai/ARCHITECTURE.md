# Architecture

## Layers

```
┌───────────────────────────────────────────────┐
│                    UI                          │
│  app/ (routes)  +  components/                 │
│  React + Tailwind + framer-motion (animations) │
└───────────────────────┬───────────────────────┘
                        │ calls
                        ▼
┌───────────────────────────────────────────────┐
│              Business logic                    │
│  lib/finance/  — PURE functions, no I/O         │
│  totals, balance, category breakdown, budgets, │
│  monthly summaries, formatting                 │
│  (100% unit-tested with Vitest)                │
└───────────────────────┬───────────────────────┘
                        │ uses
                        ▼
┌───────────────────────────────────────────────┐
│               Data access                      │
│  lib/supabase/ — Supabase client + queries     │
│  thin wrappers; mocked in tests                │
└───────────────────────┬───────────────────────┘
                        │ network
                        ▼
┌───────────────────────────────────────────────┐
│              Supabase (Postgres)               │
│         transactions, categories, budgets      │
└───────────────────────────────────────────────┘
```

## Rules of the layers

- **UI** never computes money math inline — it calls `lib/finance/`.
- **UI** never queries Supabase directly — it goes through `lib/supabase/`.
- **`lib/finance/`** is pure: same input → same output, no `fetch`, no `Date.now()`
  passed implicitly (pass dates in as arguments). This is what keeps tests fast
  and deterministic.
- **`lib/supabase/`** is the only place that imports the Supabase client.

## Database (Supabase / Postgres)

Tables grow over the roadmap:

- `transactions` (id, amount, type: income|expense, category_id, note, occurred_on)
- `categories` (id, name, color, kind)
- `budgets` (id, category_id, month, limit_amount)

Schema is applied in Supabase (SQL in `.ai/` docs as it is designed). Access is
through typed helpers in `lib/supabase/`.

## Testing strategy

| Layer          | How it is tested                                   |
|----------------|----------------------------------------------------|
| lib/finance    | pure Vitest unit tests (no mocks needed)           |
| lib/supabase   | Vitest with a mocked Supabase client               |
| components     | Testing Library render tests where practical       |

The autonomous CI test gate runs `npm test` offline — it must never require a
live Supabase connection.
