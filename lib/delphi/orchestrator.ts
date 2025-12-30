import type { SupabaseClient } from '@supabase/supabase-js'
import { atoms as atomCorpus } from '@/atoms'
import { classify } from '@/lib/claude/classifier'
import { evaluateLenses } from '@/lib/claude/lens-evaluator'
import { matchPatterns } from '@/lib/claude/pattern-matcher'
import { synthesise } from '@/lib/claude/synthesiser'
import { compileLensPacks } from '@/lib/delphi/lenspack-compiler'
import { runEvidenceGovernor } from '@/lib/delphi/evidence-governor'
import { loadAtoms } from '@/lib/atoms/loader'
import { renderDecisionCard } from '@/lib/utils/render-decision-card'
import { renderDecisionCardText } from '@/lib/utils/render-decision-card-text'
import type { DecisionRow } from '@/types/decision'
import type { PatternMatcherOutput } from '@/lib/schemas/pattern-matcher'

export async function runPipeline(
  decisionId: string,
  supabase: SupabaseClient,
  onProgress: (step: string, message: string) => void
): Promise<DecisionRow> {
  const { data: decision, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('id', decisionId)
    .single()

  if (error || !decision) {
    throw new Error('Decision not found')
  }

  const atoms = loadAtoms(atomCorpus as unknown[])

  try {
    onProgress('classifying', 'Understanding your decision...')
    const classifierOutput = await classify({
      question: decision.question,
      context: (decision.input_context as Record<string, unknown>) ?? {},
    })
    await supabase.from('decisions').update({ classifier_output: classifierOutput }).eq('id', decisionId)

    onProgress('compiling', 'Gathering relevant insights...')
    const lensPacks = compileLensPacks({ classifierOutput, atoms })

    onProgress('evaluating', 'Evaluating from three perspectives...')
    const lensOutputs = await evaluateLenses(
      {
        question: decision.question,
        input_context: decision.input_context,
        classifier_output: classifierOutput,
      },
      lensPacks
    )
    await supabase.from('decisions').update({ lens_outputs: lensOutputs }).eq('id', decisionId)

    onProgress('governing', 'Checking confidence...')
    const governorOutput = runEvidenceGovernor({ lensOutputs, classifierOutput })
    await supabase.from('decisions').update({ governor_output: governorOutput }).eq('id', decisionId)

    // Round 2 skipped for MVP (TODO: add when enabled)

    onProgress('synthesising', 'Forming recommendation...')
    const internalCard = await synthesise(
      { question: decision.question, input_context: decision.input_context },
      lensOutputs,
      governorOutput
    )
    await supabase.from('decisions').update({ decision_card_internal: internalCard }).eq('id', decisionId)

    onProgress('matching', 'Finding real-world examples...')
    const exampleAtoms = atoms.filter((a) => a.type === 'Example')
    let pattern: PatternMatcherOutput
    try {
      const result = await matchPatterns({
        classifierOutput,
        recommendedChoice: internalCard.recommended_call.choice,
        topReasons: internalCard.top_reasons,
        exampleAtoms,
      })
      pattern =
        result || {
          principle: '',
          where_worked: [],
          where_failed: [],
          mechanism: '',
        }
    } catch {
      pattern = {
        principle: '',
        where_worked: [],
        where_failed: [],
        mechanism: '',
      }
    }

    onProgress('rendering', 'Preparing your decision card...')
    const displayCard = renderDecisionCard({
      internal: internalCard,
      pattern,
      lensOutputs,
      governorOutput,
    })
    const cardText = renderDecisionCardText(displayCard)

    await supabase
      .from('decisions')
      .update({
        status: 'complete',
        decision_card: displayCard,
        decision_card_text: cardText,
        confidence_tier: governorOutput.confidence_tier,
      })
      .eq('id', decisionId)

    const { data: final } = await supabase.from('decisions').select('*').eq('id', decisionId).single()
    return final as DecisionRow
  } catch (err) {
    await supabase.from('decisions').update({ status: 'failed' }).eq('id', decisionId)
    throw err
  }
}

