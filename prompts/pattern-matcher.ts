// Pattern Matcher prompt template. Finds real-world examples from atoms.
import type { ConceptAtom, PatternMatcherInput } from '@/types'

export const PATTERN_MATCHER_SYSTEM_PROMPT = `You are Delfyy's Pattern Matcher.
Your job is to find relevant real-world examples from the provided atoms that illustrate the decision's principle.
HARD RULES:
1. Output ONLY valid JSON matching the schema exactly. No prose before or after.
2. You MUST include both success and failure cases when available.
3. Do NOT invent examples — only use what's in the provided atoms.
4. No internal jargon: never say atoms, lens, compiler, taxonomy, schema.
5. Use plain language: examples, patterns, lessons.
6. Keep principle statement plain and true, not catchy or bloggy.
7. Include timeframe for each example when available.
OUTPUT SCHEMA:
{
  "principle": "≤35 words stating the pattern plainly",
  "where_worked": [
    { "example": "company or product name", "timeframe": "year or period", "lesson": "what it teaches", "atom_id": "source atom id" }
  ],
  "where_failed": [
    { "example": "company or product name", "timeframe": "year or period", "lesson": "what it teaches", "atom_id": "source atom id" }
  ],
  "mechanism": "≤40 words explaining why this principle works or breaks"
}
ARRAY LIMITS:
- where_worked: 1-3 items
- where_failed: 1-3 items
If no success examples available, return empty array for where_worked.
If no failure examples available, return empty array for where_failed.
At least one of where_worked or where_failed must have items.
Return JSON only. No markdown code blocks. No explanation.`

export function buildPatternMatcherUserPrompt(params: {
  input: PatternMatcherInput
  atoms: ConceptAtom[]
}): string {
  const { input, atoms } = params

  const formatReasons = input.top_reasons
    .map((r, idx) => `${idx + 1}. ${r.reason}: ${r.because}`)
    .join('\n')

  const exampleAtoms = atoms.filter((a) => a.type === 'Example')

  const formattedAtoms =
    exampleAtoms.length === 0
      ? 'None provided'
      : exampleAtoms
          .map((a) => {
            const timeframe =
              a.timeframe && a.timeframe.start_year !== undefined && a.timeframe.end_year !== undefined
                ? `${a.timeframe.start_year}-${a.timeframe.end_year}`
                : 'n/a'
            const context = a.context && a.context.length > 0 ? a.context.join(', ') : 'n/a'
            const outcome = a.outcome ?? 'n/a'
            return `- id: ${a.id}; claim: ${a.claim}; outcome: ${outcome}; timeframe: ${timeframe}; context: ${context}`
          })
          .join('\n')

  return `Find patterns and examples for this decision.
DECISION CONTEXT:
Level: ${input.classifier_output.level}
Dimension: ${input.classifier_output.dimension}
Mode: ${input.classifier_output.decision_mode}
Tags: ${input.classifier_output.context_tags.join(', ') || 'None'}
RECOMMENDED CHOICE:
${input.recommended_choice}
TOP REASONS:
${formatReasons}
AVAILABLE EXAMPLES FROM KNOWLEDGE BASE:
${formattedAtoms}
Return the JSON output only.`
}

