import { callClaudeJSON, CLAUDE_MODEL_HAIKU, CLAUDE_MODEL_SONNET } from '@/lib/claude/client'
import type { ConceptAtom } from '@/lib/schemas/atoms'
import type { ClassifierOutput } from '@/lib/schemas/classifier'
import {
  PatternMatcherOutputSchema,
  PatternMatcherJsonSchema,
  type PatternMatcherOutput,
} from '@/lib/schemas/pattern-matcher'
import { PATTERN_MATCHER_SYSTEM_PROMPT } from '@/prompts/pattern-matcher'

type TopReason = { reason: string; because: string }

type MatchPatternsInput = {
  classifierOutput: ClassifierOutput
  recommendedChoice: string
  topReasons?: TopReason[]
  exampleAtoms: ConceptAtom[]
  decisionQuestion?: string
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export async function matchPatterns(input: MatchPatternsInput): Promise<PatternMatcherOutput | null> {
  const allExamples = input.exampleAtoms.filter((a) => a.type === 'Example')

  if (allExamples.length === 0) {
    return null
  }

  const stopwords = new Set([
    'the',
    'and',
    'for',
    'that',
    'with',
    'from',
    'this',
    'have',
    'about',
    'your',
    'they',
    'their',
    'them',
    'will',
    'would',
    'could',
    'should',
    'into',
    'over',
    'under',
    'after',
    'before',
    'because',
    'while',
    'where',
    'when',
    'what',
    'which',
    'whose',
    'been',
    'being',
    'were',
    'are',
    'was',
    'than',
    'then',
    'there',
    'here',
    'such',
    'also',
    'only',
    'very',
  ])

  const reasonsText = (input.topReasons ?? [])
    .map((r) => `${r.reason ?? ''} ${r.because ?? ''}`)
    .join(' ')
  const searchText = [
    input.decisionQuestion ?? '',
    input.recommendedChoice ?? '',
    reasonsText,
  ].join(' ')

  const keywords = Array.from(
    new Set(
      searchText
        .toLowerCase()
        .replace(/[^a-z]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !stopwords.has(w))
    )
  ).slice(0, 40)

  const classifierContext = new Set(input.classifierOutput.context_tags ?? [])

  const scored = allExamples.map((a, idx) => {
    const haystack = [
      a.claim ?? '',
      a.rationale ?? '',
      Array.isArray(a.context) ? a.context.join(' ') : '',
      a.dimension ?? '',
      a.level ?? '',
    ]
      .join(' ')
      .toLowerCase()

    let score = 0
    for (const kw of keywords) {
      if (kw && haystack.includes(kw)) {
        score += 2
      }
    }
    if (a.dimension && a.dimension === input.classifierOutput.dimension) {
      score += 5
    }
    if (a.level && a.level === input.classifierOutput.level) {
      score += 3
    }
    if (Array.isArray(a.context) && a.context.length > 0 && classifierContext.size > 0) {
      for (const c of a.context) {
        if (classifierContext.has(c)) score += 2
      }
    }

    return { atom: a, score, idx }
  })

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.idx - b.idx
  })

  const topScore = scored[0]?.score ?? 0
  const selected =
    topScore === 0 ? allExamples.slice(0, 25) : scored.slice(0, 25).map((s) => s.atom)
  const examples = selected

  console.log('[pattern-matcher] filtered', {
    total: allExamples.length,
    kept: examples.length,
    topScore,
  })

  const referenceNotes = examples.map((a) => ({
    id: a.id,
    source: a.source,
    claim: a.claim,
    lesson: a.rationale ?? '',
    rationale: a.rationale ?? '',
    dimension: a.dimension ?? '',
    level: a.level ?? '',
    timeframe:
      a.timeframe && typeof a.timeframe.start_year === 'number' && typeof a.timeframe.end_year === 'number'
        ? `${a.timeframe.start_year}–${a.timeframe.end_year}`
        : a.timeframe && typeof a.timeframe.start_year === 'number'
          ? `${a.timeframe.start_year}`
          : 'unknown',
    outcome: a.outcome ?? '',
    context: a.context ?? [],
  }))

  const userContent = [
    `Decision context: ${JSON.stringify(input.classifierOutput, null, 2)}`,
    `Recommended choice: ${input.recommendedChoice}`,
    `Top reasons: ${JSON.stringify(input.topReasons, null, 2)}`,
    'Reference notes (examples only):',
    JSON.stringify(referenceNotes, null, 2),
    'You MUST select at least 1 item from Reference notes and copy its id into atom_id. If any Reference note has outcome "Worked", put at least 1 into where_worked (max 3). If any Reference note has outcome "Failed", put at least 1 into where_failed (max 3). If you return empty strings or empty arrays, it will be rejected.',
  ].join('\n\n')

  console.log('[pattern-matcher] inputs', {
    questionLength: input.decisionQuestion ? input.decisionQuestion.length : 0,
    candidateExamples: examples.length,
    availableAtomIds: referenceNotes.length,
  })

  console.log('[MODEL] pattern matcher using', process.env.CLAUDE_MODEL_SONNET ?? CLAUDE_MODEL_SONNET)

  const baseMessages: { role: 'user' | 'assistant'; content: string }[] = [
    { role: 'user', content: userContent },
  ]

  const runOnce = async (model: string, extraUser?: string) => {
    const messages: { role: 'user' | 'assistant'; content: string }[] = extraUser
      ? [...baseMessages, { role: 'user', content: extraUser }]
      : [...baseMessages]
    const raw = await callClaudeJSON<PatternMatcherOutput>({
      model,
      max_tokens: 1400,
      system: PATTERN_MATCHER_SYSTEM_PROMPT,
      messages,
      schema: PatternMatcherJsonSchema,
    })
    console.log('[pattern-matcher] raw output', JSON.stringify(raw, null, 2))
    const normalized: PatternMatcherOutput = {
      ...raw,
      where_worked: Array.isArray(raw.where_worked) ? raw.where_worked.slice(0, 3) : [],
      where_failed: Array.isArray(raw.where_failed) ? raw.where_failed.slice(0, 3) : [],
    } as PatternMatcherOutput

    const parsed = PatternMatcherOutputSchema.safeParse(normalized)
    if (!parsed.success) return { ok: false as const, reason: 'invalid' as const }

    const value = parsed.data
    console.log('[pattern-matcher] parsed (pre-check)', {
      principle: value.principle,
      mechanism: value.mechanism,
      worked: value.where_worked?.length ?? 0,
      failed: value.where_failed?.length ?? 0,
    })
    const allEmpty =
      (value.where_worked?.length ?? 0) === 0 && (value.where_failed?.length ?? 0) === 0

    if (countWords(value.principle) > 35) {
      throw new Error('principle exceeds 35 words')
    }
    if (countWords(value.mechanism) > 40) {
      throw new Error('mechanism exceeds 40 words')
    }

    if (!value.principle || !value.mechanism || allEmpty) {
      return { ok: false as const, reason: 'empty' as const }
    }

    return { ok: true as const, value }
  }

  const first = await runOnce(process.env.CLAUDE_MODEL_SONNET ?? CLAUDE_MODEL_SONNET)
  if (first.ok) return first.value

  console.log('[pattern-matcher] sonnet empty -> retrying with stronger instruction')
  const second = await runOnce(
    process.env.CLAUDE_MODEL_SONNET ?? CLAUDE_MODEL_SONNET,
    'Your previous output was empty. You must return at least one example in where_worked or where_failed, and non-empty principle and mechanism. Return JSON only.'
  )
  if (second.ok) return second.value

  const fallbackWorked = examples.find((e) => (e.outcome ?? '').toLowerCase() === 'worked')
  const fallbackFailed = examples.find((e) => (e.outcome ?? '').toLowerCase() === 'failed')
  const toTimeframe = (a: ConceptAtom | undefined) =>
    a?.timeframe && typeof a.timeframe.start_year === 'number' && typeof a.timeframe.end_year === 'number'
      ? `${a.timeframe.start_year}–${a.timeframe.end_year}`
      : 'unknown'

  const fallback = {
    principle: `Test "${input.recommendedChoice}" against concrete precedents before committing.`,
    mechanism:
      'Specific worked/failed cases expose constraints and failure modes faster than abstract reasoning.',
    where_worked: fallbackWorked
      ? [
          {
            example: fallbackWorked.claim ?? '',
            timeframe: toTimeframe(fallbackWorked),
            lesson: fallbackWorked.rationale ?? '',
            atom_id: fallbackWorked.id,
          },
        ]
      : [],
    where_failed: fallbackFailed
      ? [
          {
            example: fallbackFailed.claim ?? '',
            timeframe: toTimeframe(fallbackFailed),
            lesson: fallbackFailed.rationale ?? '',
            atom_id: fallbackFailed.id,
          },
        ]
      : [],
  }
  console.warn('[pattern-matcher] using deterministic fallback', {
    worked: fallback.where_worked.length,
    failed: fallback.where_failed.length,
  })
  return fallback
}