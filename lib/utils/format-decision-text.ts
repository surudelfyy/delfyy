/**
 * Pure text formatting utilities for decision card display and export.
 * No network, no LLM — deterministic transforms only.
 */

// Fix broken contractions: "Don'T" -> "Don't", "I'M" -> "I'm"
export function fixContractions(text: string): string {
  if (!text) return ''
  return text
    .replace(/(\w)'([A-Z])(\w)/g, (_, before: string, cap: string, after: string) => {
      return `${before}'${cap.toLowerCase()}${after}`
    })
    .replace(/['’]/g, "'") // normalize quotes
    .trim()
}

// Collapse whitespace, fix double punctuation, trim (and remove score cruft)
export function cleanText(text: string): string {
  if (!text) return ''
  let result = text

  // 1. Score/confidence cruft
  result = result.replace(/\(score:\s*[\d.,]+\)/gi, '')
  result = result.replace(/\(medium\)/gi, '')
  result = result.replace(/\(high\)/gi, '')
  result = result.replace(/\(low\)/gi, '')
  result = result.replace(/Directional\s*\(medium\)/gi, '')

  // 2. Arrows
  result = result.replace(/→/g, '.')
  result = result.replace(/->/g, '.')

  // 3. Dashes
  result = result.replace(/(\d)–(\d)/g, '$1-$2')
  result = result.replace(/(\d)—(\d)/g, '$1-$2')
  result = result.replace(/\s*[—–]\s*/g, ' - ')

  // 4. Grammar fixes
  result = result.replace(/\.\s*,\s*/g, '. ')
  result = result.replace(/,\s*then\s+/gi, '. Then ')
  result = result.replace(/\.\s*Then\s+\./g, '. Then ')

  // 5. Whitespace/punctuation
  result = result.replace(/\s+/g, ' ')
  result = result.replace(/\s+([.,;!?])/g, '$1')
  result = result.replace(/If If/gi, 'If')
  result = result.replace(/\.{2,}/g, '.')
  result = result.replace(/\.\s*;/g, '.')
  result = result.replace(/,\s*\./g, '.')

  return result.trim()
}

// Split text into bullet items
export function splitBullets(text: string): string[] {
  if (!text) return []

  const byMarker = text
    .split(/\n|(?:^|\s)[-•]/)
    .map((s) => cleanText(fixContractions(s)))
    .filter((s) => s.length > 0)
  if (byMarker.length > 1) return byMarker

  const bySemicolon = text
    .split(/;\s*/)
    .map((s) => cleanText(fixContractions(s)))
    .filter((s) => s.length > 10)
  if (bySemicolon.length > 1) return bySemicolon

  return [cleanText(fixContractions(text))]
}

// Extract first example only (for success/failure cards)
export function firstExample(text: string): string {
  if (!text) return ''
  const bullets = splitBullets(text)
  if (!bullets.length) return ''
  const first = bullets[0]
  if (first.length > 200) {
    const sentences = first.split(/(?<=[.!?])\s+/)
    return sentences.slice(0, 2).join(' ')
  }
  return first
}

// Split into lead sentence + rest (for hero treatment)
export function splitLead(text: string): { lead: string; rest: string } {
  if (!text) return { lead: '', rest: '' }
  const cleaned = cleanText(fixContractions(text))
  const match = cleaned.match(/^(.+?[.!?])\s+(.+)$/)
  if (match) return { lead: match[1], rest: match[2] }
  return { lead: cleaned, rest: '' }
}

