export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

export function fixTitleCase(input: string): string {
  if (!input) return ''
  // Normalize weird apostrophe caps like "Don'T" → "Don't"
  const fixedApostrophes = input.replace(/([A-Za-z])'([A-Za-z]+)/g, (_, a: string, b: string) => {
    return `${a}'${b.toLowerCase()}`
  })
  return normalizeWhitespace(fixedApostrophes)
}

export function fixDoubleIf(input: string): string {
  if (!input) return ''
  return input.replace(/\bIf\s+If\b/gi, 'If').replace(/\bIf\s+After\b/gi, 'If')
}

export function ensureSentenceEnd(input: string): string {
  if (!input) return ''
  const trimmed = normalizeWhitespace(input)
  if (!trimmed) return ''
  if (/[.!?]$/.test(trimmed)) return trimmed
  return `${trimmed}.`
}

export function splitSentences(input: string): string[] {
  if (!input) return []
  return input
    .split(/([.!?])/)
    .reduce<string[]>((acc, cur, idx, arr) => {
      if (!cur.trim()) return acc
      if (/[.!?]/.test(cur) && acc.length) {
        acc[acc.length - 1] = `${acc[acc.length - 1]}${cur}`
      } else if (idx + 1 < arr.length && /[.!?]/.test(arr[idx + 1])) {
        acc.push(cur + arr[idx + 1])
        arr[idx + 1] = ''
      } else {
        acc.push(cur)
      }
      return acc
    }, [])
    .map((s) => normalizeWhitespace(s))
    .filter(Boolean)
}

export function dedupeNearExact(a: string, b: string): boolean {
  const norm = (s: string) => normalizeWhitespace(s).toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na === nb) return true
  const tokensA = new Set(na.split(' '))
  const tokensB = nb.split(' ')
  const overlap = tokensB.filter((t) => tokensA.has(t)).length
  const maxLen = Math.max(tokensA.size, tokensB.length)
  return maxLen ? overlap / maxLen >= 0.9 : false
}

