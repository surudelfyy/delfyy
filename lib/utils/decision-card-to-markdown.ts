import type { DecisionCard } from '@/lib/schemas/decision-card'

type Meta = { stage?: string; date?: string; confidenceTier?: string }

function cleanText(s: string): string {
  if (!s) return ''
  let out = s.trim()
  out = out.replace(/^#+\s.*$/gm, '')
  out = out.replace(/\(score[^)]*\)/gi, '')
  out = out.replace(/all three views.*$/gi, '')
  out = out.replace(/(\d)\.\s+(\d)/g, '$1.$2')
  out = out.replace(/([A-Za-z])\s*-\s*([A-Za-z])/g, '$1-$2')
  out = out.replace(/(\d)\s*-\s*(\d)/g, '$1–$2')
  out = out.replace(/([).])\s*-\s*/g, '$1 — ')
  out = out.replace(/\s+/g, ' ')
  out = out.replace(/\.\s*\./g, '.')
  out = out.replace(/,\s*\./g, '.')
  out = out.replace(/\s+([.,;!?])/g, '$1')
  out = out.replace(/idea , then/gi, 'idea, then')
  out = out.replace(/if if/gi, 'If')
  out = out.replace(/Don'T/gi, "don't").replace(/I'M/gi, "I'm")
  return out.trim()
}

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text.trim()
  return words.slice(0, maxWords).join(' ').trim()
}

function toBullets(text?: string): string[] {
  if (!text) return []
  const cleaned = cleanText(text)
  if (!cleaned) return []

  // If already has list markers, keep them
  const lines = cleaned.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (lines.some((l) => /^[-*•]/.test(l))) {
    return lines
      .map((l) => l.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
  }

  // Otherwise split heuristically on semicolons or sentence-ish breaks
  const candidates: string[] = []
  cleaned.split(/;\s+|\.\s+/).forEach((part) => {
    const p = part.trim()
    if (p) candidates.push(p)
  })
  return candidates.filter(Boolean)
}

function formatBullets(text?: string, maxWords?: number): string {
  const bullets = toBullets(text)
  if (!bullets.length) return ''
  return bullets
    .slice(0, 4)
    .map((b) => `- ${maxWords ? clampWords(cleanText(b), maxWords) : cleanText(b)}`)
    .join('\n')
}

function formatParagraph(text?: string, maxWords?: number): string {
  if (!text) return ''
  const cleaned = cleanText(text)
  if (!cleaned) return ''
  return maxWords ? clampWords(cleaned, maxWords) : cleaned
}

function formatExample(text?: string): string {
  if (!text) return ''
  const parts = text.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const bullets = parts.length > 1 ? parts : toBullets(text)
  const cleaned = (bullets.length ? bullets : [text])
    .map((b) => {
      const words = cleanText(b).split(' ')
      if (!words.length) return ''
      const [first, ...rest] = words
      if (/^[A-Z][a-z]/.test(first)) {
        return `**${first}** ${rest.join(' ')}`
      }
      return cleanText(b)
    })
    .filter(Boolean)
    .slice(0, 2)
  if (!cleaned.length) return ''
  if (cleaned.length === 1) return `- ${cleaned[0]}`
  return cleaned.map((c) => `- ${c}`).join('\n')
}

export function decisionCardToMarkdown(
  question: string,
  card: DecisionCard,
  meta?: Meta
): string {
  const out: string[] = []

  out.push('# Decision Memo')
  out.push('')
  out.push('**Question**')
  out.push(cleanText(question))
  out.push('')

  const call = formatParagraph(card.summary.call, 60)
  if (call) {
    out.push('## The Call')
    out.push(call)
    out.push('')
  }

  const confidence = formatParagraph(card.summary.confidence || meta?.confidenceTier, 30)
  if (confidence) {
    out.push('## Confidence')
    out.push(confidence)
    out.push('')
  }

  const doNext = formatParagraph(card.summary.do_next, 80)
  if (doNext) {
    out.push('## Do next')
    out.push(doNext)
    out.push('')
  }

  const assumptions = formatBullets(card.details.assumptions.join('\n'), 30)
  const tradeoffs = formatBullets(card.details.tradeoffs.join('\n'), 30)
  const risks = formatBullets(card.details.risks.join('\n'), 25)

  if (assumptions || tradeoffs || risks) {
    out.push('## Why this call')
    if (assumptions) out.push(assumptions)
    if (tradeoffs) out.push(tradeoffs)
    out.push('')
  }

  if (risks) {
    out.push('## Risks')
    out.push(risks)
    out.push('')
  }

  const principle = formatParagraph(card.pattern.principle, 50)
  if (principle) {
    out.push('## The Pattern')
    out.push('**Principle**')
    out.push(principle)
    out.push('')
  }

  const mechanism = formatParagraph(card.pattern.mechanism, 50)
  if (mechanism) {
    out.push('**Why it works**')
    out.push(mechanism)
    out.push('')
  }

  const worked = formatExample(card.pattern.where_worked.join('\n'))
  if (worked) {
    out.push('**Where it worked**')
    out.push(worked)
    out.push('')
  }

  const failed = formatExample(card.pattern.where_failed.join('\n'))
  if (failed) {
    out.push('**Where it failed**')
    out.push(failed)
    out.push('')
  }

  const footerParts: string[] = []
  if (meta?.stage) footerParts.push(`Stage: ${meta.stage}`)
  if (meta?.date) footerParts.push(meta.date)
  if (footerParts.length) {
    out.push('---')
    out.push(footerParts.join(' • '))
    out.push('')
  }

  return out.join('\n')
}
