import { callClaudeJSON, CLAUDE_MODEL_HAIKU } from '@/lib/claude/client'
import type { GovernorOutput } from '@/lib/schemas/governor'
import type { LensOutput } from '@/lib/schemas/lens'
import {
  DecisionMemoSchema,
  DecisionMemoJsonSchema,
  type DecisionMemo,
} from '@/lib/schemas/decision-memo'
import { SYNTHESISER_SYSTEM_PROMPT } from '@/prompts/synthesiser'

type DecisionInput = {
  question: string
  input_context: Record<string, unknown> | null
}

/**
 * Ensures mandatory memo fields are never empty.
 * Belt-and-braces fallback if model returns empties despite prompt rules.
 */
function ensureMandatoryMemoFields(memo: DecisionMemo): DecisionMemo {
  const result: DecisionMemo = { ...memo }

  // 1. Assumptions: must have at least 1 item
  if (!result.assumptions?.length) {
    result.assumptions = [
      {
        assumption: 'Key unknowns remain unvalidated.',
        why_it_matters:
          'Validate with a small real-user test before full commitment.',
        confidence: 'low',
      },
    ]
  }

  // 2. Review trigger: must be non-empty
  if (!result.review_trigger || result.review_trigger.length < 10) {
    result.review_trigger =
      'Revisit after 14 days or once you have results from the next steps.'
  }

  // 3. Escape hatch: must be non-empty (string per schema)
  if (!result.escape_hatch || result.escape_hatch.length < 10) {
    result.escape_hatch =
      'If there is no measurable progress after the check-in window, stop and pivot.'
  }

  return result
}

export async function synthesise(
  decision: DecisionInput,
  lensOutputs: LensOutput[],
  governorOutput: GovernorOutput,
): Promise<DecisionMemo> {
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

  const callOnce = async (
    messages: { role: 'user' | 'assistant'; content: string }[],
  ) => {
    return callClaudeJSON<DecisionMemo>({
      model: CLAUDE_MODEL_HAIKU,
      max_tokens: 3500,
      system: SYNTHESISER_SYSTEM_PROMPT,
      messages,
      schema: DecisionMemoJsonSchema,
    })
  }

  const clampArrays = (memo: DecisionMemo): DecisionMemo => {
    return {
      ...memo,
      next_steps: Array.isArray(memo.next_steps)
        ? memo.next_steps.slice(0, 4)
        : [],
      why_this_call: Array.isArray(memo.why_this_call)
        ? memo.why_this_call.slice(0, 5)
        : [],
      risks: Array.isArray(memo.risks) ? memo.risks.slice(0, 5) : [],
      examples: {
        worked: Array.isArray(memo.examples?.worked)
          ? memo.examples.worked.slice(0, 2)
          : [],
        failed: Array.isArray(memo.examples?.failed)
          ? memo.examples.failed.slice(0, 2)
          : [],
      },
    }
  }

  let result: DecisionMemo
  try {
    result = await callOnce(baseMessages)
  } catch (err) {
    if ((err as Error)?.name === 'ClaudeValidationError') {
      result = await callOnce([
        ...baseMessages,
        { role: 'user', content: repairMessage },
      ])
    } else {
      throw err
    }
  }

  const normalized = ensureMandatoryMemoFields(clampArrays(result))
  return DecisionMemoSchema.parse(normalized)
}
