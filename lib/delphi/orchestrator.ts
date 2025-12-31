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
    let classifierOutput
    console.time('1-classifier')
    try {
      onProgress('classifying', 'Understanding your decision...')
      classifierOutput = await classify({
        question: decision.question,
        context: (decision.input_context as Record<string, unknown>) ?? {},
      })
      await supabase.from('decisions').update({ classifier_output: classifierOutput }).eq('id', decisionId)
    } finally {
      console.timeEnd('1-classifier')
    }

    let lensPacks
    console.time('2-lenspack')
    try {
      onProgress('compiling', 'Gathering relevant insights...')
      lensPacks = compileLensPacks({ classifierOutput, atoms })
    } finally {
      console.timeEnd('2-lenspack')
    }

    let lensOutputs
    console.time('3-lenses')
    try {
      onProgress('evaluating', 'Evaluating from three perspectives...')
      lensOutputs = await evaluateLenses(
        {
          question: decision.question,
          input_context: decision.input_context,
          classifier_output: classifierOutput,
        },
        lensPacks
      )
      await supabase.from('decisions').update({ lens_outputs: lensOutputs }).eq('id', decisionId)
    } finally {
      console.timeEnd('3-lenses')
    }

    let governorOutput
    console.time('4-governor')
    try {
      onProgress('governing', 'Checking confidence...')
      governorOutput = runEvidenceGovernor({ lensOutputs, classifierOutput })
      await supabase.from('decisions').update({ governor_output: governorOutput }).eq('id', decisionId)
    } finally {
      console.timeEnd('4-governor')
    }

    // Round 2 skipped for MVP (TODO: add when enabled)

    let internalCard
    console.time('5-synthesiser')
    try {
      onProgress('synthesising', 'Forming recommendation...')
      internalCard = await synthesise(
        { question: decision.question, input_context: decision.input_context },
        lensOutputs,
        governorOutput
      )
      await supabase.from('decisions').update({ decision_card_internal: internalCard }).eq('id', decisionId)
    } finally {
      console.timeEnd('5-synthesiser')
    }

    let pattern: PatternMatcherOutput
    console.time('6-pattern')
    try {
      onProgress('matching', 'Finding real-world examples...')
      const exampleAtoms = atoms.filter((a) => a.type === 'Example')
      console.log(
        '[MATCH INPUT DEBUG] firstExampleAtomFull',
        JSON.stringify(exampleAtoms[0] ?? null, null, 2).slice(0, 2000)
      )
      const typeCounts = atoms.reduce<Record<string, number>>((acc, a) => {
        const t = String((a as any).type)
        acc[t] = (acc[t] ?? 0) + 1
        return acc
      }, {})

      console.log('[MATCH INPUT DEBUG]', {
        hasAtoms: !!atoms?.length,
        totalAtoms: atoms?.length ?? 0,
        typeCounts,
        uniqueTypes: Object.keys(typeCounts),
      })
      const topReasons: { reason: string; because: string }[] = []
      const result = await matchPatterns({
        classifierOutput,
        recommendedChoice: internalCard.recommended_call.choice,
        topReasons: [], // top reasons omitted in card bits payload
        exampleAtoms,
        decisionQuestion: decision.question,
      })
      if (!result) {
        throw new Error('PATTERN_MATCH_RETURNED_NULL')
      }
      pattern = result
    } finally {
      console.timeEnd('6-pattern')
    }

    console.log('[match] output', JSON.stringify(pattern, null, 2))
    console.log('[match] counts', {
      worked: pattern?.where_worked?.length ?? 0,
      failed: pattern?.where_failed?.length ?? 0,
    })

    let displayCard
    console.time('7-render')
    try {
      onProgress('rendering', 'Preparing your decision card...')
      displayCard = renderDecisionCard({
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
    } finally {
      console.timeEnd('7-render')
    }

    const { data: final } = await supabase.from('decisions').select('*').eq('id', decisionId).single()
    return final as DecisionRow
  } catch (err) {
    await supabase.from('decisions').update({ status: 'failed' }).eq('id', decisionId)
    throw err
  }
}

