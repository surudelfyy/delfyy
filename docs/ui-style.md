# UI Style Guide (Delfyy)

## Layout Primitives

- `<Page>`: wraps every screen; provides responsive padding and max-width
  - `width="narrow"` (default): max-w-2xl
  - `width="wide"`: max-w-5xl
  - Includes `min-h-screen`, `space-y-8`

- `<Stack>`: vertical spacing
  - `size={4}`: space-y-4
  - `size={6}` (default): space-y-6
  - `size={8}`: space-y-8

- `<Grid>`: responsive grid
  - `cols="1"`: single column
  - `cols="2"` (default): 1-col mobile, 2-col md+
  - `cols="3"`: 1-col mobile, 2-col md, 3-col lg

- `<Inline>`: horizontal row with flex-wrap + min-w-0

- `<SectionTitle>`: `text-lg md:text-xl font-semibold tracking-tight`

## Typography

| Element | Classes |
|---------|---------|
| Page title (H1) | `text-2xl md:text-3xl font-semibold tracking-tight` |
| Section title (H2) | `text-lg md:text-xl font-semibold tracking-tight` |
| Body (P) | `text-sm md:text-base leading-relaxed` |
| Muted | `text-sm text-muted-foreground` |

## Spacing Rules

- Page padding: `px-4 py-6` → `md:px-8 md:py-10` → `lg:px-10 lg:py-12`
- Stack sizes: 4, 6, 8 only
- Card padding: `p-6 space-y-4`
- Allowed Tailwind spacing: 2, 4, 6, 8, 12

## Responsive Guardrails

| Pattern | Rule |
|---------|------|
| Breakpoints | Mobile-first; only `md:` and `lg:` for layout; `sm:` only for button rows |
| Flex rows with text | Text container gets `min-w-0`; use `truncate` or `break-words` |
| Cards with code/JSON/IDs | Wrap in `overflow-x-auto` |
| Button rows | `flex-col gap-2 sm:flex-row sm:justify-end` |
| Dialogs | Content uses `max-h-[85vh] overflow-y-auto` |
| Every screen | Must use `<Page>` + `<Stack>`; no ad-hoc padding |

## Component Rules

- **No raw `<button>`**: use shadcn `Button`
- **No raw `<input>`**: use shadcn `Input`
- **Use shadcn primitives**: Card, Label, Textarea, Select, Checkbox, RadioGroup, Dialog, etc.
- **No custom .btn/.card CSS classes**: keep globals minimal

## Quality Gate

Test at: 320px, 375px, 768px, 1024px, 1440px
- No horizontal scroll
- No text overflow
- No stretched content on large screens
