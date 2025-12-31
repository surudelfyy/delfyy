export interface DecisionCard {
  decision?: string
  confidence?: string
  assumptions?: string
  trade_offs?: string
  risks?: string
  next_step?: string
  review_trigger?: string
  escape_hatch?: string
  approach?: string
  principle?: string
  where_worked?: string
  where_failed?: string
  mechanism?: string
}

export function decisionCardToMarkdown(
  question: string,
  card: DecisionCard,
  confidenceTier?: string
): string {
  const lines: string[] = []

  lines.push(`# Decision: ${question}`)
  lines.push('')

  if (card.decision) {
    lines.push('## The Call')
    lines.push(card.decision)
    lines.push('')
  }

  if (card.confidence || confidenceTier) {
    if (card.confidence) lines.push(`**Confidence:** ${card.confidence}`)
    if (confidenceTier) lines.push(`**Confidence tier:** ${confidenceTier}`)
    lines.push('')
  }

  if (card.assumptions) {
    lines.push('## Assumptions')
    lines.push(card.assumptions)
    lines.push('')
  }

  if (card.trade_offs) {
    lines.push('## Trade-offs')
    lines.push(card.trade_offs)
    lines.push('')
  }

  if (card.risks) {
    lines.push('## Risks')
    lines.push(card.risks)
    lines.push('')
  }

  if (card.next_step) {
    lines.push('## Next Step')
    lines.push(card.next_step)
    lines.push('')
  }

  if (card.review_trigger) {
    lines.push('## What to Watch For')
    lines.push(card.review_trigger)
    lines.push('')
  }

  if (card.escape_hatch) {
    lines.push('## What Would Force a Change')
    lines.push(card.escape_hatch)
    lines.push('')
  }

  if (card.approach) {
    lines.push('## Approach')
    lines.push(card.approach)
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push('# The Pattern')
  lines.push('')

  if (card.principle) {
    lines.push('## The Pattern')
    lines.push(card.principle)
    lines.push('')
  }

  if (card.where_worked) {
    lines.push('## Where It Worked')
    lines.push(card.where_worked)
    lines.push('')
  }

  if (card.where_failed) {
    lines.push('## Where It Failed')
    lines.push(card.where_failed)
    lines.push('')
  }

  if (card.mechanism) {
    lines.push('## Why It Works')
    lines.push(card.mechanism)
    lines.push('')
  }

  return lines.join('\n')
}

export function decisionCardToPlainText(
  question: string,
  card: DecisionCard,
  confidenceTier?: string
): string {
  const lines: string[] = []

  lines.push(`DECISION: ${question}`)
  lines.push('')

  if (card.decision) {
    lines.push('THE CALL')
    lines.push(card.decision)
    lines.push('')
  }

  if (card.confidence) {
    lines.push(`Confidence: ${card.confidence}`)
  }
  if (confidenceTier) {
    lines.push(`Confidence tier: ${confidenceTier}`)
  }
  if (card.confidence || confidenceTier) lines.push('')

  if (card.assumptions) {
    lines.push('ASSUMPTIONS')
    lines.push(card.assumptions)
    lines.push('')
  }

  if (card.trade_offs) {
    lines.push('TRADE-OFFS')
    lines.push(card.trade_offs)
    lines.push('')
  }

  if (card.risks) {
    lines.push('RISKS')
    lines.push(card.risks)
    lines.push('')
  }

  if (card.next_step) {
    lines.push('NEXT STEP')
    lines.push(card.next_step)
    lines.push('')
  }

  if (card.review_trigger) {
    lines.push('WHAT TO WATCH FOR')
    lines.push(card.review_trigger)
    lines.push('')
  }

  if (card.escape_hatch) {
    lines.push('WHAT WOULD FORCE A CHANGE')
    lines.push(card.escape_hatch)
    lines.push('')
  }

  if (card.approach) {
    lines.push('APPROACH')
    lines.push(card.approach)
    lines.push('')
  }

  lines.push('────────────────────')
  lines.push('')
  lines.push('THE PATTERN')
  lines.push('')

  if (card.principle) {
    lines.push('Pattern')
    lines.push(card.principle)
    lines.push('')
  }

  if (card.where_worked) {
    lines.push('Where It Worked')
    lines.push(card.where_worked)
    lines.push('')
  }

  if (card.where_failed) {
    lines.push('Where It Failed')
    lines.push(card.where_failed)
    lines.push('')
  }

  if (card.mechanism) {
    lines.push('Why It Works')
    lines.push(card.mechanism)
    lines.push('')
  }

  return lines.join('\n')
}


