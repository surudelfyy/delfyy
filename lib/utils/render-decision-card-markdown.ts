import type { DecisionCard } from '@/lib/schemas/decision-card'

const tierLabel: Record<DecisionCard['meta']['confidence_tier'], string> = {
  high: 'Very high confidence',
  good: 'High confidence',
  moderate: 'Medium confidence',
  directional: 'Directional confidence',
  exploratory: 'Early signal',
}

export function renderDecisionCardMarkdown(card: DecisionCard): string {
  const lines: string[] = []

  lines.push(`# ${card.summary.title}`)
  lines.push('')

  const metaParts: string[] = []
  metaParts.push(
    tierLabel[card.meta.confidence_tier] || card.summary.confidence,
  )
  if (card.meta.stage) metaParts.push(card.meta.stage)
  if (metaParts.length) lines.push(`**${metaParts.join(' · ')}**`)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Decision')
  lines.push(card.summary.call)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Reasoning')
  if (card.details.approach) lines.push(`- ${card.details.approach}`)
  lines.push('')
  lines.push(
    '**Confidence:** ' +
      (tierLabel[card.meta.confidence_tier] || card.summary.confidence),
  )
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Assumptions')
  card.details.assumptions.forEach((assumption) => {
    lines.push('')
    lines.push(`**${assumption.toUpperCase()}**`)
  })
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Trade-offs')
  card.details.tradeoffs.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Risks')
  card.details.risks.forEach((b) => lines.push(`- ${b}`))
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## When to revisit')
  if (card.details.watch_for.length) {
    lines.push(...card.details.watch_for.map((b) => `- ${b}`))
    lines.push('')
  }
  if (card.summary.change_course_if.length) {
    lines.push('**Escape hatch:**')
    card.summary.change_course_if.forEach((b) => lines.push(`- ${b}`))
    lines.push('')
  }
  lines.push('---')
  lines.push('')

  lines.push('## Real-world case studies')
  lines.push(card.pattern.principle)
  lines.push('')

  lines.push('**WHAT WORKED**')
  card.pattern.where_worked.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push('**WHAT FAILED**')
  card.pattern.where_failed.forEach((b) => lines.push(`- ${b}`))
  lines.push('')

  lines.push(`*${card.pattern.mechanism}*`)
  lines.push('')
  lines.push('---')
  lines.push('')

  lines.push('## Next steps')
  const nextSteps: string[] = card.summary.do_next ? [card.summary.do_next] : []
  lines.push(
    '✓ Committed on — · 0 of ' + (nextSteps.length || 1) + ' completed',
  )
  lines.push('')
  if (nextSteps.length) {
    nextSteps.forEach((step) => lines.push(`- [ ] ${step}`))
  } else {
    lines.push('- [ ] ')
  }
  lines.push('')

  lines.push('## Outcome')
  lines.push('**Status:** Not yet recorded')
  lines.push('')
  lines.push(`*Exported from Delfyy*`)

  return lines.join('\n')
}
