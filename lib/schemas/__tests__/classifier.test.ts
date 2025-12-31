import { describe, it, expect } from 'vitest'
import { ClassifierOutputSchema, DIMENSIONS_BY_LEVEL } from '../classifier'

describe('ClassifierOutputSchema', () => {
  it('accepts Feature level with empty secondary_dimensions and optional related_dimensions', () => {
    const parsed = ClassifierOutputSchema.parse({
      level: 'Feature',
      dimension: 'Copy',
      secondary_dimensions: [],
      related_dimensions: [{ level: 'Product', dimension: 'Experience' }],
      decision_mode: 'choose',
      context_tags: [],
      risk_flags: [],
      confidence: 0.5,
      follow_up_questions: [
        { question: 'q1', why_it_matters: 'because' },
        { question: 'q2', why_it_matters: 'because' },
        { question: 'q3', why_it_matters: 'because' },
      ],
    })
    expect(parsed.dimension).toBe('Copy')
    expect(parsed.secondary_dimensions).toEqual([])
    expect(parsed.related_dimensions?.length).toBe(1)
  })

  it('rejects secondary_dimensions that are cross-level', () => {
    const result = ClassifierOutputSchema.safeParse({
      level: 'Feature',
      dimension: 'Copy',
      secondary_dimensions: ['Experience'], // Product-level dim -> should fail
      decision_mode: 'choose',
      context_tags: [],
      risk_flags: [],
      confidence: 0.5,
      follow_up_questions: [
        { question: 'q1', why_it_matters: 'because' },
        { question: 'q2', why_it_matters: 'because' },
        { question: 'q3', why_it_matters: 'because' },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid same-level secondary_dimensions for Strategy/Product/Operating', () => {
    const strategySecondary = DIMENSIONS_BY_LEVEL.Strategy[1]
    const parsed = ClassifierOutputSchema.parse({
      level: 'Strategy',
      dimension: DIMENSIONS_BY_LEVEL.Strategy[0],
      secondary_dimensions: [strategySecondary],
      decision_mode: 'diagnose',
      context_tags: [],
      risk_flags: [],
      confidence: 0.5,
      follow_up_questions: [
        { question: 'q1', why_it_matters: 'because' },
        { question: 'q2', why_it_matters: 'because' },
        { question: 'q3', why_it_matters: 'because' },
      ],
    })
    expect(parsed.secondary_dimensions).toEqual([strategySecondary])
  })
})

