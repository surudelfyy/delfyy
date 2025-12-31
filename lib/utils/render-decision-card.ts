import type { LensOutput } from '@/lib/schemas/lens'
import type { GovernorOutput } from '@/lib/schemas/governor'
import type { SynthesiserCardBits } from '@/lib/schemas/synthesiser'
import type { PatternMatcherOutput } from '@/lib/schemas/pattern-matcher'
import type { DecisionCard } from '@/lib/schemas/decision-card'

interface RenderInput {
  internal: SynthesiserCardBits
  pattern: PatternMatcherOutput
  lensOutputs: LensOutput[]
  governorOutput: GovernorOutput
}

function wordCount(text: string): number {
  if (!text) return 0
  return text.trim().split(/\s+/).length
}

function joinWithinLimit(sentences: string[], maxWords: number, fallback: string): string {
  if (!sentences.length) return fallback
  const chosen: string[] = []
  let used = 0
  for (const sentence of sentences) {
    const count = wordCount(sentence)
    if (count === 0) continue
    if (used + count > maxWords && chosen.length > 0) break
    chosen.push(sentence)
    used += count
    if (used >= maxWords) break
  }
  return chosen.length ? chosen.join(' ') : fallback
}

function computeWasContested(lensOutputs: LensOutput[], governor: GovernorOutput): boolean {
  const stances = lensOutputs.map((l) => l.stance)
  const hasOppose = stances.includes('oppose')
  const hasSupport = stances.includes('support')
  const hasUnclear = stances.includes('unclear')
  return (hasOppose && hasSupport) || hasUnclear || governor.trigger_round_2
}

function renderConfidence(internal: SynthesiserCardBits): string {
  const parts = [
    `${internal.recommended_call.confidence_label} confidence`,
    `score ${(internal.recommended_call.confidence_score ?? 0).toFixed(2)}`,
    internal.confidence_reason,
  ].filter(Boolean)
  return parts.join('. ')
}

function renderAssumptions(assumptions: SynthesiserCardBits['assumptions'], maxWords: number): string {
  const sentences = assumptions.map(
    (a) => `${a.assumption} (why: ${a.why_it_matters}; confidence: ${a.confidence})`
  )
  return joinWithinLimit(sentences, maxWords, 'No assumptions provided.')
}

function renderTradeoffs(tradeoffs: SynthesiserCardBits['tradeoffs'], maxWords: number): string {
  const sentences = tradeoffs.map(
    (t) => `${t.tradeoff}: gain ${t.what_you_gain}; risk ${t.what_you_risk}`
  )
  return joinWithinLimit(sentences, maxWords, 'No trade-offs noted.')
}

function renderRisks(
  keyRisks: SynthesiserCardBits['key_risks'],
  safetyNotes: { flag: string; note: string }[],
  maxWords: number
): string {
  const sentences = [
    ...keyRisks.map((r) => `${r.risk}${r.why_it_matters ? `: ${r.why_it_matters}` : ''}`),
    ...safetyNotes.map((s) => `${s.flag}: ${s.note}`),
  ]
  return joinWithinLimit(sentences, maxWords, 'No key risks captured.')
}

function renderNextSteps(steps: SynthesiserCardBits['next_steps'], maxWords: number): string {
  const sentences = steps.map((s) => `${s.step}${s.expected_output ? ` → ${s.expected_output}` : ''}`)
  return joinWithinLimit(sentences, maxWords, 'Define the immediate next step.')
}

function renderRevisitSignals(
  signals: { signal: string; why_it_matters: string }[] | undefined,
  maxWords: number
): string {
  const sentences =
    signals?.map((s) => `${s.signal}${s.why_it_matters ? `: ${s.why_it_matters}` : ''}`) ?? []
  return joinWithinLimit(sentences, maxWords, 'Revisit when a core assumption is disproved.')
}

function renderEscapeHatch(escape: SynthesiserCardBits['escape_hatch'], maxWords: number): string {
  if (!escape) return 'No immediate escape condition.'
  const sentence = `If ${escape.condition}, then ${escape.immediate_action}`
  return joinWithinLimit([sentence], maxWords, sentence)
}

function renderExamples(
  items: PatternMatcherOutput['where_worked'],
  maxWords: number,
  fallback: string
): string {
  const sentences = items.map((i) => `${i.example} (${i.timeframe}): ${i.lesson}`)
  return joinWithinLimit(sentences, maxWords, fallback)
}

export function renderDecisionCard(input: RenderInput): DecisionCard {
  const { internal, pattern, lensOutputs, governorOutput } = input

  const wasContested = computeWasContested(lensOutputs, governorOutput)
  const hasWorked = Array.isArray(pattern.where_worked) && pattern.where_worked.length > 0
  const hasFailed = Array.isArray(pattern.where_failed) && pattern.where_failed.length > 0

  const safetyNotes: { flag: string; note: string }[] = []
  const revisitSignals: { signal: string; why_it_matters: string }[] = []

  return {
    decision: joinWithinLimit([internal.recommended_call.choice], 30, ''),
    confidence: joinWithinLimit([renderConfidence(internal)], 20, ''),
    assumptions: renderAssumptions(internal.assumptions, 60),
    trade_offs: renderTradeoffs(internal.tradeoffs, 50),
    risks: renderRisks(internal.key_risks, safetyNotes, 40),
    next_step: renderNextSteps(internal.next_steps, 35),
    review_trigger: renderRevisitSignals(revisitSignals, 35),
    escape_hatch: renderEscapeHatch(internal.escape_hatch, 35),
    approach: wasContested ? undefined : undefined,
    principle: joinWithinLimit([pattern.principle], 35, ''),
    where_worked: hasWorked
      ? renderExamples(pattern.where_worked, 50, 'No success examples available.')
      : 'No success examples available.',
    where_failed: hasFailed
      ? renderExamples(pattern.where_failed, 50, 'No failure examples available.')
      : 'No failure examples available.',
    mechanism: joinWithinLimit([pattern.mechanism], 40, ''),
  }
}

