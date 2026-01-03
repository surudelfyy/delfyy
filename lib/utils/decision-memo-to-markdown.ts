import type { DecisionMemo } from '@/lib/schemas/decision-memo'

type MarkdownOptions = {
  checkInDays?: number
  winningOutcome?: string | null
}

const TONE_SOFTEN_REPLACEMENTS: [RegExp, string][] = [
  [/\bcollapses\b/gi, 'may struggle to stand on its own'],
  [/\binvalidates\b/gi, 'puts pressure on'],
  [/\bentire value prop\b/gi, 'core value'],
  [/\bno defensible moat\b/gi, 'harder to defend'],
  [/\bunproven\b/gi, 'still needs testing'],
  [
    /\bif false, users bounce to ([^.]+)\b/gi,
    "if this doesn't hold, users may fall back to $1",
  ],
  [/\bdominates\b/gi, 'tends to work better'],
  [/\bmust\b/gi, 'worth testing'],
  [/\bfails\b/gi, 'struggles'],
  [/\bexistential\b/gi, 'significant'],
]

function softenText(text?: string): string {
  if (!text) return ''
  let output = text
  for (const [pattern, replacement] of TONE_SOFTEN_REPLACEMENTS) {
    output = output.replace(pattern, replacement)
  }
  return output
}

function bullets(items?: string[], soften = false): string {
  if (!items || !items.length) return ''
  return items
    .map((i) => `- ${soften ? softenText(i.trim()) : i.trim()}`)
    .join('\n')
}

function bulletsAssumptions(items?: DecisionMemo['assumptions']): string {
  if (!items || !items.length) return ''
  return items
    .map((a) => {
      const why = a.why_it_matters
        ? ` — ${softenText(a.why_it_matters.trim())}`
        : ''
      const confidenceLabel = a.confidence.toLowerCase()
      return `- **${softenText(a.assumption.trim())}**${why} *(${confidenceLabel})*`
    })
    .join('\n')
}

function exampleLines(list: DecisionMemo['examples']['worked']): string {
  if (!list || !list.length) return ''
  return list
    .map((e) => {
      const yr = e.year ? ` (${e.year})` : ''
      return `- **${e.company.trim()}**${yr}: ${e.story.trim()}`
    })
    .join('\n')
}

export function decisionMemoToMarkdown(
  memo: DecisionMemo,
  options: MarkdownOptions = {},
): string {
  const { checkInDays = 7, winningOutcome } = options
  const out: string[] = []

  out.push(`# ${memo.question.trim()}`)
  out.push('')

  out.push('## Decision')
  out.push(softenText(memo.call.trim()))
  out.push('')

  out.push('## Confidence')
  const confidenceLabel =
    memo.confidence.tier === 'high'
      ? 'Very high confidence'
      : memo.confidence.tier === 'supported'
        ? 'High confidence'
        : memo.confidence.tier === 'directional'
          ? 'Medium confidence'
          : 'Early signal'
  out.push(
    `${confidenceLabel} — ${softenText(memo.confidence.rationale.trim())}`,
  )
  out.push('')

  const assumptions = bulletsAssumptions(memo.assumptions)
  if (assumptions) {
    out.push('## Assumptions')
    out.push(assumptions)
    out.push('')
  }

  const tradeOffs = bullets(memo.trade_offs, true)
  if (tradeOffs) {
    out.push('## Trade-offs')
    out.push(tradeOffs)
    out.push('')
  }

  out.push('## Next steps')
  out.push(bullets(memo.next_steps, false))
  out.push('')

  out.push('## Reasoning')
  out.push(bullets(memo.why_this_call, true))
  out.push('')

  out.push('## Risks')
  out.push(bullets(memo.risks, true))
  out.push('')

  if (memo.review_trigger || memo.escape_hatch) {
    out.push('## When to revisit')
    if (memo.review_trigger)
      out.push(`**Revisit if:** ${softenText(memo.review_trigger.trim())}`)
    if (memo.escape_hatch)
      out.push(`**Escape hatch:** ${softenText(memo.escape_hatch.trim())}`)
    out.push('')
  }

  out.push('## Real-world precedent')
  out.push(`**Principle:** ${memo.pattern.principle.trim()}`)
  out.push('')

  const worked = exampleLines(memo.examples.worked)
  if (worked) {
    out.push('**What worked:**')
    out.push(worked)
    out.push('')
  }

  const failed = exampleLines(memo.examples.failed)
  if (failed) {
    out.push('**What failed:**')
    out.push(failed)
    out.push('')
  }

  out.push(`**Why it works:** ${memo.pattern.why_it_works.trim()}`)
  out.push('')

  out.push('## Check-in')
  out.push(`In ${checkInDays} days, we'll ask: did this work?`)
  out.push('')
  out.push(`Winning looks like: "${winningOutcome?.trim() || 'Not provided'}"`)
  out.push('')

  return out.join('\n')
}
