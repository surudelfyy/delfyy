import type { ZodSchema } from 'zod'

/**
 * Extract the first balanced JSON substring from arbitrary text.
 * - Finds first `{` or `[`.
 * - Walks character-by-character tracking depth for both `{}` and `[]`.
 * - Correctly handles quoted strings and escaped quotes (`\"`).
 * - Returns the first fully balanced JSON substring or null.
 */
export function extractFirstBalancedJSON(text: string): string | null {
  const startObj = text.indexOf('{')
  const startArr = text.indexOf('[')

  let start = -1
  if (startObj === -1 && startArr === -1) return null
  if (startObj === -1) start = startArr
  else if (startArr === -1) start = startObj
  else start = Math.min(startObj, startArr)

  const openChar = text[start]
  const closeChar = openChar === '{' ? '}' : ']'

  let depthBrace = 0
  let depthBracket = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escape) {
        escape = false
        continue
      }
      if (ch === '\\') {
        escape = true
        continue
      }
      if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') depthBrace++
    if (ch === '}') depthBrace--
    if (ch === '[') depthBracket++
    if (ch === ']') depthBracket--

    // Check if we've closed the initial structure
    if (openChar === '{' && ch === closeChar && depthBrace === 0) {
      return text.slice(start, i + 1)
    }
    if (openChar === '[' && ch === closeChar && depthBracket === 0) {
      return text.slice(start, i + 1)
    }
  }

  return null
}

/**
 * Try to extract JSON from text and validate with a Zod schema.
 *
 * Strategy (in order):
 * 1) Direct JSON.parse on the whole string
 * 2) Extract from markdown fenced block (```json ... ``` or ``` ... ```)
 * 3) Extract first balanced { ... } or [ ... ] substring
 *
 * For each attempt: parse, validate with schema, return if valid.
 * Returns null if all strategies fail. Does not throw.
 */
export function extractJSON<T>(text: string, schema: ZodSchema<T>): T | null {
  // Strategy 1: Direct parse
  try {
    const direct = JSON.parse(text)
    const parsed = schema.safeParse(direct)
    if (parsed.success) return parsed.data
  } catch {
    // Continue to next strategy
  }

  // Strategy 2: Markdown fenced block extraction
  const fenced = extractFromCodeFence(text)
  if (fenced) {
    try {
      const obj = JSON.parse(fenced)
      const parsed = schema.safeParse(obj)
      if (parsed.success) return parsed.data
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Balanced JSON extraction
  const balanced = extractFirstBalancedJSON(text)
  if (balanced) {
    try {
      const obj = JSON.parse(balanced)
      const parsed = schema.safeParse(obj)
      if (parsed.success) return parsed.data
    } catch {
      // All strategies exhausted
    }
  }

  return null
}

/**
 * Extract JSON content from markdown code fences.
 * Handles ```json ... ``` and ``` ... ``` formats.
 */
function extractFromCodeFence(text: string): string | null {
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
  const match = text.match(fenceRegex)
  if (!match) return null

  const inner = match[1]?.trim()
  if (!inner) return null

  // Models sometimes include prose inside fences.
  // Try balanced extraction from within the fence content.
  const balanced = extractFirstBalancedJSON(inner)
  return balanced ?? inner
}
