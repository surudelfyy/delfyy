import { callClaudeJSON, CLAUDE_MODEL_HAIKU } from '@/lib/claude/client'
import type { GovernorOutput } from '@/lib/schemas/governor'
import type { LensOutput } from '@/lib/schemas/lens'
import { SynthesiserCardBitsSchema, type SynthesiserCardBits } from '@/lib/schemas/synthesiser'
import { SynthesiserCardBitsJsonSchema } from '@/lib/schemas/synthesiser-json'
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
): Promise<SynthesiserCardBits> {
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

  console.log('[MODEL] synthesiser using', CLAUDE_MODEL_HAIKU)

  const baseMessages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: userContent },
  ]
  const repairMessage =
    'Return ONLY valid JSON matching the schema; no code fences; no extra keys.'

  const callOnce = async (messages: { role: 'user' | 'assistant'; content: string }[]) => {
    return callClaudeJSON<SynthesiserCardBits>({
      model: CLAUDE_MODEL_HAIKU,
      max_tokens: 3500,
      system: SYNTHESISER_SYSTEM_PROMPT,
      messages,
      schema: SynthesiserCardBitsJsonSchema,
    })
  }

  let result: SynthesiserCardBits
  try {
    result = await callOnce(baseMessages)
  } catch (err) {
    if ((err as Error)?.name === 'ClaudeValidationError') {
      result = await callOnce([...baseMessages, { role: 'user', content: repairMessage }])
    } else {
      throw err
    }
  }

  const forbidden = containsForbiddenWord(result)
  if (forbidden) {
    const retryInstruction = `Rewrite the JSON to mean the same thing but remove these forbidden words: ${FORBIDDEN_WORDS.join(
      ', '
    )}. Do not use synonyms like 'classification' either. Return JSON only.`
    result = await callOnce([...baseMessages, { role: 'user', content: retryInstruction }])
    const forbiddenRetry = containsForbiddenWord(result)
    if (forbiddenRetry) {
      throw new Error(`Forbidden word present after retry: ${forbiddenRetry}`)
    }
  }

  return result
}

