import type { LensOutput } from '@/lib/schemas/lens'
import type { GovernorOutput } from '@/lib/schemas/governor'
import type { SynthesiserCardBits } from '@/lib/schemas/synthesiser'
import type { PatternMatcherOutput } from '@/lib/schemas/pattern-matcher'
import { DecisionCardSchema, type DecisionCard } from '@/lib/schemas/decision-card'
import { polishDecisionCard } from './decision-card-polish'

interface RenderInput {
  question: string
  stage?: string
  internal: SynthesiserCardBits
  pattern: PatternMatcherOutput
  lensOutputs: LensOutput[]
  governorOutput: GovernorOutput
}

const JARGON_MAP: Record<string, string> = {
  PMF: 'product-market fit',
  TAM: 'total market',
  ICP: 'ideal customer',
  'WAU/DAU': 'weekly active users / daily active users',
  WTP: 'willingness to pay',
}

function titleCase(str: string): string {
  return str
    .trim()
    .replace(/\?+$/g, '')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function sentenceSanitize(text: string): string {
  if (!text) return ''
  let out = text.trim()
  out = out.replace(/\bIf\s+If\b/gi, 'If')
  out = out.replace(/\bIf\s+After\b/gi, 'If')
  out = out.replace(/;{2,}/g, ';')
  out = out.replace(/:{2,}/g, ':')
  out = out.replace(/^[:\-]\s*/, '')
  out = out.replace(/\bunknown\b/gi, '')
  for (const [term, replacement] of Object.entries(JARGON_MAP)) {
    const re = new RegExp(`\\b${term}\\b`, 'gi')
    out = out.replace(re, replacement)
  }
  out = out.replace(/\s+/g, ' ').trim()
  if (out && !/[.!?]$/.test(out)) {
    out = `${out}.`
  }
  return out
}

export function deDupeSemantics(lines: string[], max: number): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const line of lines) {
    const norm = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    result.push(line)
    if (result.length >= max) break
  }
  return result
}

export function toBulletsFromText(text: string, max: number): string[] {
  if (!text) return ['Not enough evidence yet — run the next step to learn.']
  const raw = text
    .split(/\n+/)
    .flatMap((chunk) => chunk.split(/;\s+/))
    .flatMap((chunk) => chunk.split(/\. /))
  const cleaned = raw
    .map((r) => sentenceSanitize(r))
    .filter((r) => r.trim().length > 0)
  const deduped = deDupeSemantics(cleaned, max)
  return deduped.length ? deduped.slice(0, max) : ['Not enough evidence yet — run the next step to learn.']
}

export function titleFromQuestion(question: string): string {
  const q = question.toLowerCase()
  if (q.includes('free') && q.includes('paid')) {
    return 'Free vs Paid for MVP'
  }
  return titleCase(question).slice(0, 60)
}

function mapConfidenceTier(
  tier: GovernorOutput['confidence_tier']
): DecisionCard['meta']['confidence_tier'] {
  if (tier === 'supported') return 'good'
  return tier as DecisionCard['meta']['confidence_tier']
}

export function confidenceLine(
  tier: GovernorOutput['confidence_tier'],
  internal: SynthesiserCardBits
): string {
  const mapped = mapConfidenceTier(tier)
  const score = internal.recommended_call.confidence_score
  const label = internal.recommended_call.confidence_label
  const reason = sentenceSanitize(internal.confidence_reason || '')
  const scorePart = score ? ` (score: ${score.toFixed(2)})` : ''
  return `${titleCase(mapped)} (${label})${scorePart}${reason ? ` — ${reason}` : ''}`
}

function computeWasContested(lensOutputs: LensOutput[], governor: GovernorOutput): boolean {
  const stances = lensOutputs.map((l) => l.stance)
  const hasOppose = stances.includes('oppose')
  const hasSupport = stances.includes('support')
  const hasUnclear = stances.includes('unclear')
  return (hasOppose && hasSupport) || hasUnclear || governor.trigger_round_2
}

function patternBullets(
  items: PatternMatcherOutput['where_worked'] | PatternMatcherOutput['where_failed']
): string[] {
  if (!items?.length) return []
  return items.map((i) =>
    sentenceSanitize(
      [i.example, i.timeframe && i.timeframe !== 'unknown' ? `(${i.timeframe})` : '', i.lesson]
        .filter(Boolean)
        .join(' ')
    )
  )
}

function buildSuccessLooksLike(internal: SynthesiserCardBits, max: number): string[] {
  const fromExpected = internal.next_steps.map((s) => s.expected_output).filter(Boolean)
  if (fromExpected.length) return deDupeSemantics(fromExpected.map(sentenceSanitize), max)
  if (internal.escape_hatch?.condition) {
    return deDupeSemantics(
      [sentenceSanitize(`We know it's working when ${internal.escape_hatch.condition} is avoided`)],
      max
    )
  }
  return ['Clear pull from target users without forcing engagement.']
}

function buildChangeCourseIf(internal: SynthesiserCardBits, max: number): string[] {
  if (internal.escape_hatch?.condition || internal.escape_hatch?.immediate_action) {
    return deDupeSemantics(
      [
        sentenceSanitize(
          `If ${internal.escape_hatch?.condition ?? 'results deteriorate'}, then ${
            internal.escape_hatch?.immediate_action ?? 'pause and reassess'
          }`
        ),
      ],
      max
    )
  }
  const fromRisks = internal.key_risks.map((r) => sentenceSanitize(r.risk))
  if (fromRisks.length) return deDupeSemantics(fromRisks, max)
  return ['Stop if the next test shows no real user pull or strong negatives.']
}

function bulletsFromArray(texts: string[], max: number): string[] {
  return deDupeSemantics(texts.map(sentenceSanitize), max)
}

export function renderDecisionCard(input: RenderInput): DecisionCard {
  const { internal, pattern, lensOutputs, governorOutput, question, stage } = input
  const confidence_tier = mapConfidenceTier(governorOutput.confidence_tier)
  const wasContested = computeWasContested(lensOutputs, governorOutput)

  const call =
    internal.recommended_call.status === 'insufficient_information'
      ? 'Insufficient information to recommend — gather more evidence.'
      : sentenceSanitize(internal.recommended_call.choice)

  const doNext =
    internal.next_steps.length > 0
      ? sentenceSanitize(
          `${internal.next_steps[0].step}${
            internal.next_steps[0].expected_output ? ` → ${internal.next_steps[0].expected_output}` : ''
          }`
        )
      : 'Run a small test with 10–20 target users.'

  const summary = {
    title: titleFromQuestion(question),
    call,
    confidence: confidenceLine(governorOutput.confidence_tier, internal),
    do_next: doNext,
    success_looks_like: buildSuccessLooksLike(internal, 3),
    change_course_if: buildChangeCourseIf(internal, 3),
  }

  const details = {
    assumptions: bulletsFromArray(
      internal.assumptions.map((a) =>
        `${a.assumption}${a.why_it_matters ? ` — ${a.why_it_matters}` : ''}${
          a.confidence ? ` (${a.confidence})` : ''
        }`
      ),
      5
    ),
    tradeoffs: bulletsFromArray(
      internal.tradeoffs.map((t) => `${t.tradeoff}: gain ${t.what_you_gain}; risk ${t.what_you_risk}`),
      6
    ),
    risks: bulletsFromArray(
      internal.key_risks.map((r) => `${r.risk}${r.why_it_matters ? ` — ${r.why_it_matters}` : ''}`),
      6
    ),
    watch_for: buildChangeCourseIf(internal, 5),
    approach: wasContested ? sentenceSanitize('Use this call, but keep testing dissenting signals.') : undefined,
  }

  const patternBlock = {
    principle: sentenceSanitize(pattern.principle),
    where_worked: deDupeSemantics(patternBullets(pattern.where_worked), 3),
    where_failed: deDupeSemantics(patternBullets(pattern.where_failed), 3),
    mechanism: sentenceSanitize(pattern.mechanism),
  }

  const card: DecisionCard = {
    meta: {
      confidence_tier,
      stage:
        stage && ['discovery', 'build', 'launch', 'growth'].includes(stage)
          ? (stage as DecisionCard['meta']['stage'])
          : undefined,
    },
    summary,
    details,
    pattern: patternBlock,
  }

  return polishDecisionCard(DecisionCardSchema.parse(card))
}

