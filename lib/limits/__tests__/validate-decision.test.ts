import { describe, it, expect } from 'vitest'
import { enforceDecisionLimits, LimitError } from '../validate-decision'
import { FREE_COMPLETED_DECISION_LIMIT } from '../decisionLimits'

const base = {
  tier: 'free' as const,
  completedDecisions: 0,
  question: 'Is this a valid question with letters?',
}

describe('enforceDecisionLimits', () => {
  it('blocks free users after limit', () => {
    expect(() =>
      enforceDecisionLimits({
        ...base,
        completedDecisions: FREE_COMPLETED_DECISION_LIMIT,
      })
    ).toThrowError(LimitError)
  })

  it('does not count failed decisions (completed count below limit)', () => {
    expect(() =>
      enforceDecisionLimits({
        ...base,
        completedDecisions: FREE_COMPLETED_DECISION_LIMIT - 1,
      })
    ).not.toThrow()
  })

  it('rejects too-long question', () => {
    const q = 'a'.repeat(501)
    expect(() =>
      enforceDecisionLimits({
        ...base,
        question: q,
      })
    ).toThrowError(LimitError)
  })

  it('rejects per-decision context over 500', () => {
    const ctx = 'b'.repeat(501)
    expect(() =>
      enforceDecisionLimits({
        ...base,
        contextFreeform: ctx,
      })
    ).toThrowError(LimitError)
  })

  it('rejects free default context over 800', () => {
    const def = 'c'.repeat(801)
    expect(() =>
      enforceDecisionLimits({
        ...base,
        defaultContext: def,
      })
    ).toThrowError(LimitError)
  })

  it('rejects paid default context over 2000', () => {
    const def = 'd'.repeat(2001)
    expect(() =>
      enforceDecisionLimits({
        ...base,
        tier: 'paid',
        defaultContext: def,
      })
    ).toThrowError(LimitError)
  })

  it('rejects emoji-only question (must contain letters)', () => {
    expect(() =>
      enforceDecisionLimits({
        ...base,
        question: '🔥🔥🔥🔥🔥🔥🔥🔥🔥',
      })
    ).toThrowError(LimitError)
  })
})

