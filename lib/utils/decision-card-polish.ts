import type { DecisionCard } from '@/lib/schemas/decision-card'
import {
  dedupeNearExact,
  ensureSentenceEnd,
  fixDoubleIf,
  fixTitleCase,
  normalizeWhitespace,
  splitSentences,
} from './text-clean'

function cleanLine(text: string): string {
  return ensureSentenceEnd(fixDoubleIf(fixTitleCase(normalizeWhitespace(text || ''))))
}

function cleanArray(values: string[], maxSentences = Infinity): string[] {
  const out: string[] = []
  for (const v of values) {
    if (!v) continue
    const sentences = splitSentences(cleanLine(v))
    const toUse = maxSentences === Infinity ? sentences : sentences.slice(0, maxSentences)
    out.push(...toUse.map((s) => cleanLine(s)))
  }
  return out.filter(Boolean)
}

function limitSentences(text: string, max: number): string {
  const sentences = splitSentences(text)
  const limited = sentences.slice(0, max).join(' ')
  return cleanLine(limited)
}

function dedupeList(list: string[]): string[] {
  const result: string[] = []
  for (const item of list) {
    const duplicate = result.find((r) => dedupeNearExact(r, item))
    if (!duplicate) result.push(item)
  }
  return result
}

export function polishDecisionCard(card: DecisionCard): DecisionCard {
  const polished: DecisionCard = JSON.parse(JSON.stringify(card))

  // Summary
  polished.summary.title = fixTitleCase(polished.summary.title)
  polished.summary.call = limitSentences(polished.summary.call, 2)
  polished.summary.confidence = limitSentences(polished.summary.confidence, 2)
  polished.summary.do_next = cleanLine(polished.summary.do_next)
  polished.summary.change_course_if = dedupeList(cleanArray(polished.summary.change_course_if, 2)).slice(0, 3)

  // Details
  polished.details.assumptions = dedupeList(cleanArray(polished.details.assumptions, 2)).slice(0, 5)
  polished.details.tradeoffs = dedupeList(cleanArray(polished.details.tradeoffs, 2)).slice(0, 6)
  polished.details.risks = dedupeList(cleanArray(polished.details.risks, 2)).slice(0, 6)
  polished.details.watch_for = dedupeList(cleanArray(polished.details.watch_for, 2)).slice(0, 5)
  if (polished.details.approach) {
    polished.details.approach = limitSentences(polished.details.approach, 2)
  }

  // Pattern
  polished.pattern.principle = limitSentences(polished.pattern.principle, 2)
  polished.pattern.mechanism = limitSentences(polished.pattern.mechanism, 2)
  polished.pattern.where_worked = dedupeList(cleanArray(polished.pattern.where_worked, 2)).slice(0, 3)
  polished.pattern.where_failed = dedupeList(cleanArray(polished.pattern.where_failed, 2)).slice(0, 3)

  // De-duplicate overlapping change_course_if and watch_for
  if (polished.summary.change_course_if.length && polished.details.watch_for.length) {
    const overlap = polished.details.watch_for.some((w) =>
      polished.summary.change_course_if.some((c) => dedupeNearExact(c, w))
    )
    if (overlap) {
      polished.details.watch_for = ['Revisit if key assumptions change or new evidence emerges.']
    }
  }

  return polished
}

