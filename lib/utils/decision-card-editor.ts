/**
 * Deterministic editorial normaliser for DecisionCard text.
 * - Splits multiline strings into arrays
 * - Cleans punctuation and casing
 * - Removes duplicated ideas (light heuristic)
 * - Enforces one idea per line
 * - Drops weak/filler lines
 */

const MIN_LINE_LENGTH = 20

export function cleanLine(s: string): string {
  if (!s) return ''
  return s
    .replace(/\s+/g, ' ')
    .replace(/\.\s*\./g, '.')
    .replace(/,\s*\./g, '.')
    .replace(/^[-•—]\s*/, '')
    .replace(/\s*:\s*/g, ' — ')
    .replace(/if if/gi, 'If')
    .replace(/,\s*then/gi, '. Then')
    .replace(/\.\s*then/gi, '. Then')
    .trim()
}

export function toBullets(s?: string): string[] {
  if (!s) return []
  return s
    .split('\n')
    .map(cleanLine)
    .filter((l) => l.length >= MIN_LINE_LENGTH)
}

export function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const line of lines) {
    const norm = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    if (!norm) continue
    if (seen.has(norm)) continue
    seen.add(norm)
    out.push(line)
  }
  return out
}

export function normaliseField(value?: string | string[]): string[] {
  const raw = Array.isArray(value) ? value : value ? [value] : []
  const split = raw.flatMap((r) => r.split('\n'))
  const cleaned = split.map(cleanLine).filter((l) => l.length >= MIN_LINE_LENGTH)
  return dedupeLines(cleaned)
}

