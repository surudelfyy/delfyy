import { describe, it, expect } from 'vitest'
import { sentenceSanitize, toBulletsFromText, deDupeSemantics } from '../render-decision-card'
import { polishDecisionCard } from '../decision-card-polish'
import { renderDecisionCardMarkdown } from '../render-decision-card-markdown'
import type { DecisionCard } from '@/lib/schemas/decision-card'

describe('sentenceSanitize', () => {
  it('fixes duplicated "If" and strips double punctuation', () => {
    expect(sentenceSanitize('If If we ship;;')).toBe('If we ship;')
  })

  it('expands jargon', () => {
    const result = sentenceSanitize('Our TAM is large and we need PMF')
    expect(result).toContain('total market')
    expect(result).toContain('product-market fit')
  })
})

describe('toBulletsFromText', () => {
  it('splits on sentence boundaries and sanitizes', () => {
    const bullets = toBulletsFromText('First line. Second line; Third line', 3)
    expect(bullets.length).toBeGreaterThan(1)
    expect(bullets[0]).toBe('First line.')
  })

  it('returns fallback when empty', () => {
    const bullets = toBulletsFromText('', 2)
    expect(bullets[0]).toMatch(/Not enough evidence/)
  })
})

describe('deDupeSemantics', () => {
  it('removes near-duplicates', () => {
    const out = deDupeSemantics(['Test case', 'test case!', 'Another'], 5)
    expect(out).toEqual(['Test case', 'Another'])
  })
})

describe('renderDecisionCardMarkdown', () => {
  it('renders premium markdown structure', () => {
    const card: DecisionCard = {
      meta: { confidence_tier: 'directional', stage: 'build' },
      summary: {
        title: 'Test Decision',
        call: 'Do the thing.',
        confidence: 'Directional — score 0.3',
        do_next: 'Run a small test.',
        success_looks_like: ['Users complete the flow.'],
        change_course_if: ['Signals are negative.'],
      },
      details: {
        assumptions: ['Assumption one.'],
        tradeoffs: ['Tradeoff one.'],
        risks: ['Risk one.'],
        watch_for: ['Watch for churn.'],
        approach: 'Keep it simple.',
      },
      pattern: {
        principle: 'Test principle.',
        where_worked: ['Worked example.'],
        where_failed: ['Failed example.'],
        mechanism: 'Because it aligns incentives.',
      },
    }

    const markdown = renderDecisionCardMarkdown(card)
    expect(markdown).toContain('### Decision: Test Decision')
    expect(markdown).toContain('**Call**')
    expect(markdown).toContain('- Users complete the flow.')
    expect(markdown).toContain('## Pattern')
  })
})

describe('polishDecisionCard', () => {
  it("fixes weird apostrophe caps like Don'T", () => {
    const polished = polishDecisionCard({
      meta: { confidence_tier: 'directional' },
      summary: {
        title: "I Don'T Know",
        call: "We Don'T ship yet",
        confidence: "Directional",
        do_next: 'Test',
        success_looks_like: [],
        change_course_if: [],
      },
      details: {
        assumptions: [],
        tradeoffs: [],
        risks: [],
        watch_for: [],
      },
      pattern: {
        principle: '',
        where_worked: [],
        where_failed: [],
        mechanism: '',
      },
    })
    expect(polished.summary.title).toBe("I don't know")
    expect(polished.summary.call).toBe("We don't ship yet.")
  })

  it('dedupes change_course_if vs watch_for', () => {
    const polished = polishDecisionCard({
      meta: { confidence_tier: 'directional' },
      summary: {
        title: 'Test',
        call: 'Call',
        confidence: 'Conf',
        do_next: 'Do',
        success_looks_like: [],
        change_course_if: ['Stop if churn rises.'],
      },
      details: {
        assumptions: [],
        tradeoffs: [],
        risks: [],
        watch_for: ['stop if churn rises'],
      },
      pattern: { principle: '', where_worked: [], where_failed: [], mechanism: '' },
    })
    expect(polished.details.watch_for[0]).toMatch(/Revisit/)
  })

  it('keeps full sentences, no mid-sentence truncation', () => {
    const polished = polishDecisionCard({
      meta: { confidence_tier: 'directional' },
      summary: {
        title: 'Test',
        call: 'First sentence. Second sentence is here.',
        confidence: 'Conf',
        do_next: 'Do',
        success_looks_like: ['One long clause, still okay.'],
        change_course_if: ['Another long clause, still okay.'],
      },
      details: {
        assumptions: ['Assumption one, with more detail.'],
        tradeoffs: [],
        risks: [],
        watch_for: [],
      },
      pattern: { principle: '', where_worked: [], where_failed: [], mechanism: '' },
    })
    expect(polished.summary.call).toBe('First sentence. Second sentence is here.')
  })
})

