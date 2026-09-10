# Development & Validation

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
```

## Validation commands (the agent MUST run before committing)

```bash
npm run lint
npm test
```

Both must pass before a commit is created. Tests run offline (no Supabase needed).

## Running locally (human)

```bash
npm run dev
```

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=...        # from Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # from Supabase project settings
```

On Vercel, set these in Project → Settings → Environment Variables.

## Conventions

- Files: `kebab-case.ts` / `PascalCase.tsx` for components.
- Pure logic in `src/lib/finance/`, each with a `*.test.ts` beside it.
- Keep components presentational; pass data/handlers as props.
- Animate with `framer-motion`; keep motion subtle and smooth (ease, ~200-300ms).

## Definition of Done (per daily task)

1. Feature implemented as described in `.ai/TASKS.md`.
2. Tests added/updated and passing (`npm test`).
3. `npm run lint` clean.
4. `.ai/TASKS.md` checkbox ticked (+ `.ai/ROADMAP.md` if the feature is complete).
5. `README.md` Progress bullet added.
6. One atomic commit + PR.
