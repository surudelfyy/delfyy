import { callClaude, CLAUDE_MODEL_SONNET } from '@/lib/claude/client'
import type { GovernorOutput } from '@/lib/schemas/governor'
import type { LensOutput } from '@/lib/schemas/lens'
import { SynthesiserOutputSchema, type SynthesiserOutput } from '@/lib/schemas/synthesiser'
import { SYNTHESISER_SYSTEM_PROMPT } from '@/prompts/synthesiser'

const FORBIDDEN_WORDS = [
  'lens',
  'lens pack',
  'compiler',
  'governor',
  'deterministic',
  'routing',
  'taxonomy',
  'schema',
  'atoms',
  'retrieval',
  'classifier',
]

function containsForbiddenWord(value: unknown): string | null {
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    for (const word of FORBIDDEN_WORDS) {
      if (lower.includes(word)) return word
    }
    return null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = containsForbiddenWord(item)
      if (found) return found
    }
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const found = containsForbiddenWord((value as Record<string, unknown>)[key])
      if (found) return found
    }
  }
  return null
}

type DecisionInput = {
  question: string
  input_context: any
}

export async function synthesise(
  decision: DecisionInput,
  lensOutputs: LensOutput[],
  governorOutput: GovernorOutput
): Promise<SynthesiserOutput> {
  const hasSupport = lensOutputs.some((l) => l.stance === 'support')
  const hasOppose = lensOutputs.some((l) => l.stance === 'oppose')
  const hasDisagreement = hasSupport && hasOppose

  const instruction = hasDisagreement
    ? 'Include contest_summary (max 150 chars).'
    : 'Do NOT include contest_summary.'

  const userContent = [
    `Decision question: ${decision.question}`,
    '',
    `Input context: ${JSON.stringify(decision.input_context ?? {}, null, 2)}`,
    '',
    `Customer view evaluation: ${JSON.stringify(lensOutputs.find((l) => l.lens === 'Customer') || {}, null, 2)}`,
    `Business view evaluation: ${JSON.stringify(lensOutputs.find((l) => l.lens === 'Business') || {}, null, 2)}`,
    `Feasibility view evaluation: ${JSON.stringify(lensOutputs.find((l) => l.lens === 'Feasibility') || {}, null, 2)}`,
    '',
    `Evidence summary: ${JSON.stringify(governorOutput, null, 2)}`,
    '',
    instruction,
  ].join('\n')

  const result = await callClaude<SynthesiserOutput>({
    model: CLAUDE_MODEL_SONNET,
    system: SYNTHESISER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    schema: SynthesiserOutputSchema,
    temperature: 0.2,
    maxTokens: 2500,
    maxRetries: 1,
  })

  if (!hasDisagreement && result.contest_summary) {
    throw new Error('contest_summary present without disagreement')
  }

  const forbidden = containsForbiddenWord(result)
  if (forbidden) {
    throw new Error(`Forbidden word present: ${forbidden}`)
  }

  return result
}

