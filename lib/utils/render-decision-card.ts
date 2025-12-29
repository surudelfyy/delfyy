// Elite Decision Card renderer. Transforms internal structured output to display schema.
import type {
  ConfidenceLevel,
  DecisionCard,
  GovernorOutput,
  LensOutput,
  PatternMatcherOutput,
  SynthesiserOutput,
} from '@/types'

interface RenderContext {
  internal: SynthesiserOutput
  pattern: PatternMatcherOutput
  lensOutputs: LensOutput[]
  governorOutput: GovernorOutput
}

function capitalise(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function shortenToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  const truncated = words.slice(0, maxWords).join(' ')
  const endsWithPunctuation = /[.!?]$/.test(truncated)
  return endsWithPunctuation ? truncated : `${truncated}…`
}

function selectAndJoin(sentences: string[], wordLimit: number): string {
  if (sentences.length === 0) return ''
  const result: string[] = []
  let used = 0
  for (const sentence of sentences) {
    const wordCount = sentence.trim().split(/\s+/).length
    if (used + wordCount > wordLimit && result.length > 0) break
    result.push(sentence)
    used += wordCount
    if (used >= wordLimit) break
  }
  if (result.length === 0) {
    return sentences[0]
  }
  return result.join(' ')
}

function renderConfidence(label: ConfidenceLevel, reason: string): string {
  const cappedReason = shortenToWords(reason, 10)
  return `${capitalise(label)}. ${cappedReason}`
}

function formatAssumption(a: { assumption: string; confidence: ConfidenceLevel }): string {
  if (a.confidence === 'high') return a.assumption
  return `${a.assumption} — ${a.confidence.toUpperCase()} confidence`
}

function computeWasContested(lensOutputs: LensOutput[], governor: GovernorOutput): boolean {
  const stances = lensOutputs.map((l) => l.stance)
  const hasOppose = stances.includes('oppose')
  const hasSupport = stances.includes('support')
  const hasUnclear = stances.includes('unclear')
  return (hasOppose && hasSupport) || hasUnclear || governor.trigger_round_2
}

function selectTopByConfidence<T extends { confidence: ConfidenceLevel }>(
  items: T[],
  count: number
): T[] {
  const order: Record<ConfidenceLevel, number> = { low: 0, medium: 1, high: 2 }
  return [...items].sort((a, b) => order[a.confidence] - order[b.confidence]).slice(0, count)
}

function selectTopRisks(
  keyRisks: { risk: string; why_it_matters: string }[],
  safetyNotes: { flag: string; note: string }[],
  count: number
): { risk: string }[] {
  const combined: { risk: string }[] = [
    ...keyRisks.map((r) => ({ risk: r.risk })),
    ...safetyNotes.map((s) => ({ risk: s.note })),
  ]
  return combined.slice(0, count)
}

function formatTradeoff(t: { tradeoff: string; what_you_gain: string; what_you_risk: string }): string {
  return `${t.tradeoff}: gain ${t.what_you_gain}, risk ${t.what_you_risk}`
}

function formatWhere(item: { example: string; timeframe: string; lesson: string }): string {
  return `${item.example} (${item.timeframe}): ${item.lesson}`
}

export function renderDecisionCard(ctx: RenderContext): DecisionCard {
  const { internal, pattern, lensOutputs, governorOutput } = ctx

  const wasContested = computeWasContested(lensOutputs, governorOutput)

  const decision = shortenToWords(internal.recommended_call.choice, 30)
  const confidence = shortenToWords(
    renderConfidence(internal.recommended_call.confidence_label, internal.confidence_reason),
    20
  )

  const assumptionsFormatted = selectTopByConfidence(internal.assumptions, 3).map(formatAssumption)
  const assumptions = shortenToWords(selectAndJoin(assumptionsFormatted, 60), 60)

  const tradeoffs = shortenToWords(
    selectAndJoin(internal.tradeoffs.slice(0, 2).map(formatTradeoff), 50),
    50
  )

  const risks = shortenToWords(
    selectAndJoin(selectTopRisks(internal.key_risks, internal.safety_notes, 2).map((r) => r.risk), 40),
    40
  )

  const nextStep =
    internal.next_steps.length > 0
      ? shortenToWords(internal.next_steps[0].step, 35)
      : 'Define your first validation test.'

  const reviewTrigger =
    internal.revisit_signals.length > 0
      ? shortenToWords(
          selectAndJoin(
            internal.revisit_signals
              .slice(0, 2)
              .map((r) => `Revisit if: ${r.signal}`),
            35
          ),
          35
        )
      : 'Revisit if key assumptions prove false.'

  const escapeHatch =
    internal.escape_hatch !== null
      ? shortenToWords(
          `If ${internal.escape_hatch.condition}, then ${internal.escape_hatch.immediate_action}`,
          35
        )
      : 'No immediate flip conditions identified.'

  const approach =
    wasContested && internal.contest_summary
      ? shortenToWords(internal.contest_summary, 30)
      : undefined

  const principle = shortenToWords(pattern.principle, 35)

  const whereWorked = shortenToWords(
    selectAndJoin(pattern.where_worked.slice(0, 2).map(formatWhere), 50),
    50
  )

  const whereFailed = shortenToWords(
    selectAndJoin(pattern.where_failed.slice(0, 2).map(formatWhere), 50),
    50
  )

  const mechanism = shortenToWords(pattern.mechanism, 40)

  return {
    decision,
    confidence,
    assumptions,
    trade_offs: tradeoffs,
    risks,
    next_step: nextStep,
    review_trigger: reviewTrigger,
    escape_hatch: escapeHatch,
    approach,
    principle,
    where_worked: whereWorked,
    where_failed: whereFailed,
    mechanism,
  }
}

