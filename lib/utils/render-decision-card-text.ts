import type { DecisionCard } from '@/lib/schemas/decision-card'

export function renderDecisionCardText(card: DecisionCard): string {
  const parts: string[] = []

  // Layer 1
  if (card.decision) parts.push(card.decision)
  if (card.confidence) parts.push(card.confidence)
  if (card.assumptions) parts.push(card.assumptions)
  if (card.trade_offs) parts.push(card.trade_offs)
  if (card.risks) parts.push(card.risks)
  if (card.next_step) parts.push(card.next_step)
  if (card.review_trigger) parts.push(card.review_trigger)
  if (card.escape_hatch) parts.push(card.escape_hatch)
  if (card.approach) parts.push(card.approach)

  // Layer 2
  if (card.principle) parts.push(card.principle)
  if (card.where_worked) parts.push(card.where_worked)
  if (card.where_failed) parts.push(card.where_failed)
  if (card.mechanism) parts.push(card.mechanism)

  return parts.filter(Boolean).join(' ')
}

