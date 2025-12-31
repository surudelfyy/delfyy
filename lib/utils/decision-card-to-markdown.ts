import type { DecisionCard } from '@/lib/schemas/decision-card'

export function decisionCardToMarkdown(
  question: string,
  card: DecisionCard,
  confidenceTier?: string
): string {
  const lines: string[] = []

  lines.push(`# Decision: ${card.summary.title || question}`)
  lines.push('')

  lines.push('## The Call')
  lines.push(card.summary.call)
  lines.push('')

  lines.push('**Confidence**')
  lines.push(card.summary.confidence + (confidenceTier ? ` (${confidenceTier})` : ''))
  lines.push('')

  lines.push('**Do next**')
  lines.push(card.summary.do_next)
  lines.push('')

  lines.push('**Success looks like**')
  card.summary.success_looks_like.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('**Change course if**')
  card.summary.change_course_if.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('## Assumptions')
  card.details.assumptions.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('## Trade-offs')
  card.details.tradeoffs.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('## Risks')
  card.details.risks.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('## What to watch for')
  card.details.watch_for.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  if (card.details.approach) {
    lines.push('## Approach')
    lines.push(card.details.approach)
    lines.push('')
  }

  lines.push('## Pattern')
  lines.push('**Principle**')
  lines.push(card.pattern.principle)
  lines.push('')

  lines.push('**Where it worked**')
  card.pattern.where_worked.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('**Where it failed**')
  card.pattern.where_failed.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('**Why it works**')
  lines.push(card.pattern.mechanism)
  lines.push('')

  return lines.join('\n')
}

export function decisionCardToPlainText(
  question: string,
  card: DecisionCard,
  confidenceTier?: string
): string {
  const lines: string[] = []
  lines.push(`DECISION: ${card.summary.title || question}`)
  lines.push('')
  lines.push('THE CALL')
  lines.push(card.summary.call)
  lines.push('')
  lines.push(`Confidence: ${card.summary.confidence}${confidenceTier ? ` (${confidenceTier})` : ''}`)
  lines.push('')
  lines.push('DO NEXT')
  lines.push(card.summary.do_next)
  lines.push('')
  lines.push('SUCCESS LOOKS LIKE')
  card.summary.success_looks_like.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  lines.push('CHANGE COURSE IF')
  card.summary.change_course_if.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  lines.push('ASSUMPTIONS')
  card.details.assumptions.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  lines.push('TRADE-OFFS')
  card.details.tradeoffs.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  lines.push('RISKS')
  card.details.risks.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  lines.push('WHAT TO WATCH FOR')
  card.details.watch_for.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  if (card.details.approach) {
    lines.push('APPROACH')
    lines.push(card.details.approach)
    lines.push('')
  }
  lines.push('PATTERN')
  lines.push('Principle')
  lines.push(card.pattern.principle)
  lines.push('Where it worked')
  card.pattern.where_worked.forEach((b) => lines.push(`- ${b}`))
  lines.push('Where it failed')
  card.pattern.where_failed.forEach((b) => lines.push(`- ${b}`))
  lines.push('Why it works')
  lines.push(card.pattern.mechanism)
  lines.push('')
  return lines.join('\n')
}
