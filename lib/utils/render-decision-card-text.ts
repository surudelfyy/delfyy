import type { DecisionCard } from '@/lib/schemas/decision-card'

export function renderDecisionCardText(card: DecisionCard): string {
  const parts: string[] = []

  parts.push(card.summary.title, card.summary.call, card.summary.confidence, card.summary.do_next)
  parts.push(...card.summary.success_looks_like, ...card.summary.change_course_if)

  parts.push(
    ...card.details.assumptions,
    ...card.details.tradeoffs,
    ...card.details.risks,
    ...card.details.watch_for
  )
  if (card.details.approach) parts.push(card.details.approach)

  parts.push(
    card.pattern.principle,
    ...card.pattern.where_worked,
    ...card.pattern.where_failed,
    card.pattern.mechanism
  )

  return parts.filter(Boolean).join(' ')
}

