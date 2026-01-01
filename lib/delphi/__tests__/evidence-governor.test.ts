import { describe, it, expect } from 'vitest'
import { runEvidenceGovernor, type GovernorInput } from '../evidence-governor'
import type { LensOutput } from '@/lib/schemas/lens'
import type { ClassifierOutput } from '@/lib/schemas/classifier'

function makeLens(overrides: Partial<LensOutput> & { lens?: LensOutput['lens'] }): LensOutput {
  return {
    lens: overrides.lens ?? 'Customer',
    stance: overrides.stance ?? 'mixed',
    summary: overrides.summary ?? 'summary',
    supporting_points:
      overrides.supporting_points ??
      [
        {
          point: 'p',
          atom_ids: ['a1'],
        },
      ],
    counterpoints:
      overrides.counterpoints ??
      [
        {
          point: 'c',
          atom_ids: ['a2'],
        },
      ],
    assumptions:
      overrides.assumptions ??
      [
        {
          assumption: 'assumption',
          why_it_matters: 'because',
        },
      ],
    disconfirming_tests:
      overrides.disconfirming_tests ??
      [
        {
          test: 'test',
          pass_signal: 'pass',
          fail_signal: 'fail',
        },
      ],
    open_questions:
      overrides.open_questions ??
      [
        {
          question: 'q',
          why_it_matters: 'reason',
        },
      ],
    examples_in_pack:
      overrides.examples_in_pack ??
      [
        {
          example: 'ex',
          lesson: 'lesson',
          atom_ids: ['a3'],
        },
      ],
    confidence: overrides.confidence ?? 'medium',
  }
}

function makeClassifier(overrides: Partial<ClassifierOutput> = {}): ClassifierOutput {
  return {
    level: overrides.level ?? 'Product',
    dimension: overrides.dimension ?? 'Scope',
    secondary_dimensions: overrides.secondary_dimensions ?? [],
    related_dimensions: overrides.related_dimensions ?? [],
    decision_mode: overrides.decision_mode ?? 'choose',
    context_tags: overrides.context_tags ?? [],
    risk_flags: overrides.risk_flags ?? [],
    confidence: overrides.confidence ?? 0.6,
    follow_up_questions:
      overrides.follow_up_questions ??
      [
        { question: 'q1', why_it_matters: 'm1' },
        { question: 'q2', why_it_matters: 'm2' },
        { question: 'q3', why_it_matters: 'm3' },
      ],
  }
}

function runGovernor(input: Partial<GovernorInput>): ReturnType<typeof runEvidenceGovernor> {
  return runEvidenceGovernor({
    lensOutputs: input.lensOutputs ?? [makeLens({})],
    classifierOutput: input.classifierOutput ?? makeClassifier(),
  })
}

describe('Evidence Governor', () => {
  it('base score 0.5, no adjustments, choose → directional + test posture', () => {
    const out = runGovernor({})
    expect(out.confidence_score).toBe(0.5)
    expect(out.confidence_tier).toBe('directional')
    expect(out.commitment_posture).toBe('test')
  })

  it('unclear stance applies -0.15', () => {
    const out = runGovernor({ lensOutputs: [makeLens({ stance: 'unclear' })] })
    expect(out.confidence_score).toBe(0.35)
    expect(out.reasons).toContain("-0.15: at least one lens stance is 'unclear'")
  })

  it('conflict (support + oppose) applies -0.20 and triggers round 2', () => {
    const out = runGovernor({
      lensOutputs: [makeLens({ stance: 'support' }), makeLens({ stance: 'oppose', lens: 'Business' })],
    })
    expect(out.confidence_score).toBe(0.3) // 0.5 - 0.2
    expect(out.trigger_round_2).toBe(true)
    expect(out.reasons).toContain("-0.20: conflict present (support + oppose)")
  })

  it('risk_flags downgrade -0.10', () => {
    const out = runGovernor({ classifierOutput: makeClassifier({ risk_flags: ['r1', 'r2'] }) })
    expect(out.confidence_score).toBe(0.4)
    expect(out.reasons).toContain('-0.10: classifier risk_flags present (2)')
  })

  it('missing disconfirming_tests downgrade -0.10', () => {
    const out = runGovernor({
      lensOutputs: [
        makeLens({
          disconfirming_tests: [],
        }),
      ],
    })
    expect(out.confidence_score).toBe(0.4)
    expect(out.reasons).toContain('-0.10: missing disconfirming_tests in at least one lens')
  })

  it('total assumptions > 6 downgrade -0.05 (sum across lenses)', () => {
    const out = runGovernor({
      lensOutputs: [
        makeLens({
          assumptions: Array.from({ length: 4 }, (_, i) => ({
            assumption: `a${i}`,
            why_it_matters: 'because',
          })),
        }),
        makeLens({
          lens: 'Business',
          assumptions: Array.from({ length: 3 }, (_, i) => ({
            assumption: `b${i}`,
            why_it_matters: 'because',
          })),
        }),
      ],
    })
    expect(out.confidence_score).toBe(0.45)
    expect(out.reasons).toContain('-0.05: total assumptions 7 (>6)')
  })

  it('all support upgrade +0.15', () => {
    const out = runGovernor({
      lensOutputs: [
        makeLens({ stance: 'support' }),
        makeLens({ lens: 'Business', stance: 'support' }),
        makeLens({ lens: 'Feasibility', stance: 'support' }),
      ],
    })
    expect(out.confidence_score).toBe(0.65)
    expect(out.reasons).toContain('+0.15: all lenses stance support')
  })

  it('clamp prevents negative scores', () => {
    const out = runGovernor({
      lensOutputs: [
        makeLens({ stance: 'unclear', disconfirming_tests: [] }), // -0.15, -0.10
        makeLens({ lens: 'Business', stance: 'oppose', disconfirming_tests: [], assumptions: [] }), // missing tests -0.10
        makeLens({ lens: 'Feasibility', stance: 'support' }), // introduces conflict with oppose
      ],
      classifierOutput: makeClassifier({ risk_flags: ['r1'] }), // -0.10
    })
    expect(out.confidence_score).toBe(0) // would be <0 without clamp
    expect(out.confidence_tier).toBe('exploratory')
  })

  it('diagnose mode always posture test', () => {
    const out = runGovernor({
      classifierOutput: makeClassifier({ decision_mode: 'diagnose' }),
    })
    expect(out.commitment_posture).toBe('test')
  })

  it('plan mode uses same tier mapping as choose', () => {
    // Build score to 0.55 (0.5 +0.15 -0.10) with 3 support lenses and one risk flag
    const out = runGovernor({
      lensOutputs: [
        makeLens({ stance: 'support' }),
        makeLens({ lens: 'Business', stance: 'support' }),
        makeLens({ lens: 'Feasibility', stance: 'support' }),
      ],
      classifierOutput: makeClassifier({ decision_mode: 'plan', risk_flags: ['r1'] }),
    })
    expect(out.confidence_score).toBe(0.55)
    expect(out.confidence_tier).toBe('supported')
    expect(out.commitment_posture).toBe('proceed_cautiously')
  })

  it('tier mapping boundaries (reachable: 0.55, 0.35)', () => {
    // 0.55 scenario already above; ensure mapping is correct for exact thresholds
    const directional = runGovernor({
      lensOutputs: [makeLens({ stance: 'unclear' })], // 0.35
    })
    expect(directional.confidence_score).toBe(0.35)
    expect(directional.confidence_tier).toBe('directional')

    const supported = runGovernor({
      lensOutputs: [
        makeLens({ stance: 'support' }),
        makeLens({ lens: 'Business', stance: 'support' }),
        makeLens({ lens: 'Feasibility', stance: 'support' }),
      ],
      classifierOutput: makeClassifier({ risk_flags: ['r1'] }), // 0.55
    })
    expect(supported.confidence_score).toBe(0.55)
    expect(supported.confidence_tier).toBe('supported')
    // High tier currently unreachable under v2.2 adjustments; documented for clarity.
  })

  it('trigger_round_2 true when confidence_score < 0.4', () => {
    const out = runGovernor({
      lensOutputs: [makeLens({ stance: 'unclear' })], // 0.35
    })
    expect(out.confidence_score).toBeLessThan(0.4)
    expect(out.trigger_round_2).toBe(true)
  })

  it('mixed is not conflict (support + mixed + mixed)', () => {
    const out = runGovernor({
      lensOutputs: [
        makeLens({ stance: 'support', lens: 'Customer' }),
        makeLens({ stance: 'mixed', lens: 'Business' }),
        makeLens({ stance: 'mixed', lens: 'Feasibility' }),
      ],
    })
    expect(out.confidence_score).toBe(0.5) // no adjustments
    expect(out.reasons.some((r) => r.includes('conflict'))).toBe(false)
    expect(out.trigger_round_2).toBe(false) // score 0.5 >= 0.4 and no conflict
  })

  it('missing disconfirming_tests when undefined counts as missing', () => {
    const out = runGovernor({
      lensOutputs: [
        {
          ...makeLens({}),
          disconfirming_tests: undefined as any,
        },
      ],
    })
    expect(out.confidence_score).toBe(0.4)
    expect(out.reasons).toContain('-0.10: missing disconfirming_tests in at least one lens')
  })

  it('assumptions exactly 6 does NOT downgrade', () => {
    const out = runGovernor({
      lensOutputs: [
        makeLens({
          assumptions: Array.from({ length: 3 }, (_, i) => ({
            assumption: `a${i}`,
            why_it_matters: 'because',
          })),
        }),
        makeLens({
          lens: 'Business',
          assumptions: Array.from({ length: 3 }, (_, i) => ({
            assumption: `b${i}`,
            why_it_matters: 'because',
          })),
        }),
      ],
    })
    expect(out.confidence_score).toBe(0.5)
    expect(out.reasons.some((r) => r.includes('assumptions'))).toBe(false)
  })
})

