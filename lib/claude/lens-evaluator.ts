import { callClaudeJSON, CLAUDE_MODEL_HAIKU } from '@/lib/claude/client'
import type { LensPack } from '@/lib/delphi/lenspack-compiler'
import { LENS_EVALUATOR_SYSTEM_PROMPT } from '@/prompts/lens-evaluator'
import type { ClassifierOutput } from '@/lib/schemas/classifier'
import { LensOutputSchema, LensOutputJsonSchema, type LensOutput } from '@/lib/schemas/lens'

type DecisionInput = {
  question: string
  input_context: any
  classifier_output: ClassifierOutput
}

const lensOrder: LensOutput['lens'][] = ['Customer', 'Business', 'Feasibility']

const fallbackLensOutput = (failedLens: LensOutput['lens']): LensOutput => ({
  lens: failedLens,
  stance: 'unclear',
  summary: 'Evaluation could not be completed.',
  supporting_points: [],
  counterpoints: [],
  assumptions: [],
  disconfirming_tests: [
    {
      test: 'Conduct 3 customer interviews to validate core assumptions',
      pass_signal: 'Customers confirm willingness to use/pay',
      fail_signal: 'Customers express confusion or disinterest',
    },
  ],
  open_questions: [],
  examples_in_pack: [],
  confidence: 'low',
})

function buildReferenceNotes(lensPack: LensPack | undefined) {
  if (!lensPack) return []
  return lensPack.atoms.map((atom) => ({
    id: atom.id,
    type: atom.type,
    purpose: atom.purpose,
    claim: atom.claim,
    rationale: atom.rationale,
    applies_when: atom.applies_when,
    breaks_when: atom.breaks_when,
    relevance_score: (atom as { relevance_score?: number }).relevance_score,
  }))
}

export async function evaluateLenses(
  decision: DecisionInput,
  lensPacks: LensPack[]
): Promise<LensOutput[]> {
  const packByLens = new Map<LensOutput['lens'], LensPack>()
  for (const pack of lensPacks) {
    packByLens.set(pack.lens, pack)
  }

  const jobs = lensOrder.map((lens) => {
    const notes = buildReferenceNotes(packByLens.get(lens))
    const userContent = [
      `Decision question: ${decision.question}`,
      '',
      `Input context: ${JSON.stringify(decision.input_context ?? {}, null, 2)}`,
      '',
      `Classifier output: ${JSON.stringify(decision.classifier_output, null, 2)}`,
      '',
      'Reference notes for your evaluation:',
      JSON.stringify(notes, null, 2),
    ].join('\n')

    return callClaudeJSON<LensOutput>({
      model: process.env.CLAUDE_MODEL_HAIKU ?? CLAUDE_MODEL_HAIKU,
      max_tokens: 1400,
      system: LENS_EVALUATOR_SYSTEM_PROMPT(lens),
      messages: [{ role: 'user', content: userContent }],
      schema: LensOutputJsonSchema,
    })
  })

  const results = await Promise.allSettled(jobs)

  const outputs: LensOutput[] = results.map((result, idx) => {
    const lens = lensOrder[idx]
    if (result.status === 'fulfilled') {
      return result.value
    }
    return fallbackLensOutput(lens)
  })

  return outputs
}

