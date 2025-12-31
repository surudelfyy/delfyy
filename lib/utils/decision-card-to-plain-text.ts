import type { DecisionCard } from '@/lib/schemas/decision-card'
import { cleanText, fixContractions, splitBullets } from './format-decision-text'

function formatBullets(content: string | string[] | undefined): string {
  if (!content) return ''
  const items = Array.isArray(content)
    ? content
    : splitBullets(
        content
          .replace(/^\s*•\s+/gm, '- ')
          .replace(/^\s*\*\s+/gm, '- ')
          .replace(/^\s*-\s+/gm, '- ')
      )
  const cleaned = items.map((i) => cleanText(fixContractions(i))).filter(Boolean)
  if (!cleaned.length) return ''
  return cleaned.join('\n')
}

function formatParagraph(text?: string): string {
  if (!text) return ''
  return cleanText(fixContractions(text))
}

export function decisionCardToPlainText(question: string, card: DecisionCard, confidenceTier?: string): string {
  const out: string[] = []
  out.push(`Decision: ${cleanText(fixContractions(question))}`)
  out.push('')
  out.push(`Confidence tier: ${confidenceTier || card.meta.confidence_tier || 'Unknown'}`)
  out.push('')
  out.push('The call')
  out.push(formatParagraph(card.summary.call))
  out.push('')
  out.push('Confidence')
  out.push(formatParagraph(card.summary.confidence))
  out.push('')
  out.push('Do next')
  out.push(formatParagraph(card.summary.do_next))
  out.push('')
  out.push('Why this call')
  out.push('Assumptions')
  out.push(formatBullets(card.details.assumptions))
  out.push('')
  out.push('Trade-offs')
  out.push(formatBullets(card.details.tradeoffs))
  out.push('')
  out.push('Risks')
  out.push(formatBullets(card.details.risks))
  out.push('')
  if (card.details.approach) {
    out.push('Approach')
    out.push(formatParagraph(card.details.approach))
    out.push('')
  }
  out.push('Pattern')
  out.push('Principle')
  out.push(formatParagraph(card.pattern.principle))
  out.push('')
  out.push('Why it works')
  out.push(formatParagraph(card.pattern.mechanism))
  out.push('')
  out.push('Where it worked')
  out.push(formatBullets(card.pattern.where_worked))
  out.push('')
  out.push('Where it failed')
  out.push(formatBullets(card.pattern.where_failed))
  out.push('')
  out.push('Notes')
  out.push(`Watch for: ${formatParagraph(card.details.watch_for.join('\n')) || '—'}`)
  out.push(`Change course if: ${formatParagraph(card.summary.change_course_if.join('\n')) || '—'}`)
  return out.join('\n')
}

