# Delfyy Audit Checklist

Plain-English audit pass for devs. Think PM voice, but call out technical gates.

## Quick gate
- Run `npm run check` (lint + typecheck + prettier check). No green, no merge.

## Pattern audit (app/api/*/route.ts)
Enforce the contract and the order:
1) Size guard (reject oversized payloads early).
2) Auth check (server-side; no trust of client hints).
3) Rate limit (per user; consistent window + limit).
4) Parse JSON (handle bad JSON explicitly).
5) Zod validation (schemas in `lib/schemas/*`).
6) Idempotency (decide route only; header wins over body).
7) Business logic (do the work).
8) Response (structured, correct status).

## Security search checklist (grep/rg these strings)
- `SUPABASE_SERVICE_ROLE_KEY`
- `service_role`
- `ANTHROPIC_API_KEY`
- `localStorage`
- `dangerouslySetInnerHTML`
- `as any` / `: any` / `@ts-ignore`

## Supabase checks
- RLS is enabled on tables being touched (assume browser is hostile).
- `idempotency_keys` column names match what code expects (`idempotency_key`, `status`, `response`, etc.).

## When something fails
- Capture repro + inputs (no secrets), then rerun `npm run check`.
- If API fails: confirm the route order above, validate Zod schemas, and verify Supabase RLS + idempotency path.
- If LLM call fails: confirm env (`ANTHROPIC_API_KEY`), schema validation, timeouts, and retries.
- If lint/type errors: fix or justify; no disabling rules without a description.
- If unsure: write down the risk, the guard you’re relying on, and the next action.*** End Patch"]],

