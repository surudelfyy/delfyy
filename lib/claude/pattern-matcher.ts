import { callClaudeJSON, CLAUDE_MODEL_HAIKU } from '@/lib/claude/client'
import type { ConceptAtom } from '@/lib/schemas/atoms'
import type { ClassifierOutput } from '@/lib/schemas/classifier'
import {
  PatternMatcherOutputSchema,
  PatternMatcherJsonSchema,
  type PatternMatcherOutput,
} from '@/lib/schemas/pattern-matcher'
import { PATTERN_MATCHER_SYSTEM_PROMPT } from '@/prompts/pattern-matcher'

type TopReason = { reason: string; because: string }

type MatchPatternsInput = {
  classifierOutput: ClassifierOutput
  recommendedChoice: string
  topReasons: TopReason[]
  exampleAtoms: ConceptAtom[]
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export async function matchPatterns(input: MatchPatternsInput): Promise<PatternMatcherOutput | null> {
  const examples = input.exampleAtoms.filter((a) => a.type === 'Example')

  if (examples.length === 0) {
    return null
  }

  const referenceNotes = examples.map((a) => ({
    id: a.id,
    source: a.source,
    claim: a.claim,
    lesson: a.rationale ?? a.outcome ?? '',
    timeframe:
      a.timeframe && typeof a.timeframe.start_year === 'number' && typeof a.timeframe.end_year === 'number'
        ? `${a.timeframe.start_year}–${a.timeframe.end_year}`
        : a.timeframe && typeof a.timeframe.start_year === 'number'
          ? `${a.timeframe.start_year}`
          : 'unknown',
    outcome: a.outcome ?? '',
    context: a.context ?? [],
  }))

  const userContent = [
    `Decision context: ${JSON.stringify(input.classifierOutput, null, 2)}`,
    `Recommended choice: ${input.recommendedChoice}`,
    `Top reasons: ${JSON.stringify(input.topReasons, null, 2)}`,
    'Reference notes (examples only):',
    JSON.stringify(referenceNotes, null, 2),
  ].join('\n\n')

  const result = await callClaudeJSON<PatternMatcherOutput>({
    model: process.env.CLAUDE_MODEL_HAIKU ?? CLAUDE_MODEL_HAIKU,
    max_tokens: 1400,
    system: PATTERN_MATCHER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    schema: PatternMatcherJsonSchema,
  })

  if (countWords(result.principle) > 35) {
    throw new Error('principle exceeds 35 words')
  }
  if (countWords(result.mechanism) > 40) {
    throw new Error('mechanism exceeds 40 words')
  }

  return result
}

