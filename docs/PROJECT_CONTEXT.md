# Delfyy — Project Context

## What Delfyy Is
Delfyy is a Decision Accountability System that helps founders make defensible strategic decisions. It runs a Delphi-style process behind the scenes: multiple independent AI perspectives evaluate a decision, surface disagreements, then synthesise into a clear recommendation with evidence.

Users arrive uncertain. They leave with a recommendation they can defend.

---

## Trust Boundaries (Read This First)
- **Browser/client is hostile**: never trust inputs, never store secrets here.
- **Server is trusted**: authentication, validation, and orchestration live here.
- **Database enforces access**: Supabase RLS is the final gate.
- **LLM output is untrusted**: treat it like user input until validated (Zod).

---

## Non-Negotiable Decisions

### Auth & Security
- Auth is enforced at the database layer (**Supabase RLS**), not application logic.
- Route protection happens in **layouts** using server-side checks, not middleware redirects.
- `user_id` is always set server-side from `auth.uid()` — never trust client input.
- Service role key is only used for admin tasks, never in client-accessible code.

### Architecture
- **3 lenses only** (Customer / Business / Feasibility). This is a product contract (UI + pricing + mental model). Not extensible in MVP.
- Evidence Governor is **pure logic** (no LLM call). It inspects lens outputs.
- LensPack Compiler is **deterministic code** (no LLM call). It selects atoms.
- All AI responses are validated with **Zod schemas** before use.
- Streaming uses **SSE via POST + fetch**, not EventSource.

### Data
- `decisions.status`: `running` → `complete | partial | failed`
- `decision_card_text` is rendered at save-time for full-text search.
- Atoms have `dimension: string | null` where `null = global`.

### Failure/Recovery Contract
- `partial` = some steps succeeded + usable output saved, with missing sections clearly marked.
- Never lose the original `question` + `input_context` once created.
- Orchestration should be safe to retry (idempotent by decision id).

---

## What We Intentionally Avoided

| Avoided | Why |
|---------|-----|
| Auth checks in middleware | Cookie/session refresh edge cases; layout checks are simpler + clearer |
| LangChain | Unnecessary abstraction; hides what matters and complicates debugging |
| Client-side auth logic | Security must be server-enforced |
| Evidence as a 4th lens | It’s a logic check, not a perspective |
| Multiple git branches (for now) | Solo MVP; switch to PRs/branches once we have external users or contributors |
| Lovable / no-code tools | Need full control over AI orchestration |

---

## Naming Conventions

| Term | Meaning |
|------|---------|
| Decision | One user question + its full reasoning lifecycle |
| Lens | One AI perspective (Customer, Business, or Feasibility) |
| Atom | A single piece of strategic knowledge from the book library |
| LensPack | 8-12 atoms selected for one lens |
| Governor | Logic that calculates confidence from lens outputs |
| Decision Card | Final output with recommendation + evidence |

---

## Tech Stack

| Layer | Tool |
|------|------|
| Frontend | Next.js (App Router) — currently 16.x |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Backend | Supabase (Auth, Postgres, RLS) |
| AI | Claude API (direct, no abstraction) |
| Hosting | Vercel |
| Dev | Cursor |

