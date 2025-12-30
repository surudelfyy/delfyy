import { describe, it, expect } from 'vitest'
import {
  compileLensPacks,
  type LensPackCompilerInput,
  type ScoredAtom,
} from '../lenspack-compiler'
import type { ConceptAtom } from '@/lib/schemas/atoms'
import type { ClassifierOutput } from '@/lib/schemas/classifier'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAtom(overrides: Partial<ConceptAtom> & { id: string }): ConceptAtom {
  return {
    id: overrides.id,
    source: overrides.source ?? 'test',
    type: overrides.type ?? 'Heuristic',
    purpose: overrides.purpose ?? 'Evaluate',
    claim: overrides.claim ?? `Claim for ${overrides.id}`,
    lens: overrides.lens ?? ['Customer', 'Business', 'Feasibility'],
    level: overrides.level ?? 'Product',
    dimension: overrides.dimension ?? null,
    applies_when: overrides.applies_when,
    breaks_when: overrides.breaks_when,
    strength: overrides.strength,
    rationale: overrides.rationale,
    version: overrides.version,
    evidence_grade: overrides.evidence_grade,
    timeframe: overrides.timeframe,
    outcome: overrides.outcome,
    context: overrides.context,
  }
}

function makeClassifier(overrides: Partial<ClassifierOutput> = {}): ClassifierOutput {
  return {
    level: overrides.level ?? 'Product',
    dimension: overrides.dimension ?? 'Scope',
    secondary_dimensions: overrides.secondary_dimensions ?? [],
    decision_mode: overrides.decision_mode ?? 'choose',
    context_tags: overrides.context_tags ?? [],
    risk_flags: overrides.risk_flags ?? [],
    confidence: overrides.confidence ?? 0.8,
    follow_up_questions: overrides.follow_up_questions ?? [
      { question: 'Q1', why_it_matters: 'M1' },
      { question: 'Q2', why_it_matters: 'M2' },
      { question: 'Q3', why_it_matters: 'M3' },
    ],
  }
}

// ---------------------------------------------------------------------------
// Test: Level filtering is strict
// ---------------------------------------------------------------------------

describe('Level filtering', () => {
  it('excludes atoms from other levels', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({ id: 'product-1', level: 'Product', type: 'Signal' }),
      makeAtom({ id: 'strategy-1', level: 'Strategy', type: 'Signal' }),
      makeAtom({ id: 'feature-1', level: 'Feature', type: 'Signal' }),
      makeAtom({ id: 'product-2', level: 'Product', type: 'Heuristic' }),
    ]

    const classifier = makeClassifier({ level: 'Product' })
    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    // All packs should only contain Product-level atoms
    for (const pack of result) {
      for (const atom of pack.atoms) {
        expect(atom.level).toBe('Product')
      }
    }

    // Specifically, strategy-1 and feature-1 should never appear
    const allAtomIds = result.flatMap((p) => p.atoms.map((a) => a.id))
    expect(allAtomIds).not.toContain('strategy-1')
    expect(allAtomIds).not.toContain('feature-1')
  })
})

// ---------------------------------------------------------------------------
// Test: Scoring logic
// ---------------------------------------------------------------------------

describe('Scoring', () => {
  it('computes exact expected scores with all factors', () => {
    const atoms: ConceptAtom[] = [
      // Base 100 (level match only, global)
      makeAtom({
        id: 'base-only',
        level: 'Product',
        dimension: null,
        type: 'Signal',
      }),
      // 100 + 10 (global) = 110
      // Actually: 100 + 10 = 110
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
      secondary_dimensions: [],
      context_tags: [],
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })
    const baseAtom = result[0].atoms.find((a) => a.id === 'base-only')
    // global atom = 100 + 10 = 110
    expect(baseAtom?.relevance_score).toBe(110)
  })

  it('adds +35 for primary dimension match', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({
        id: 'dim-match',
        level: 'Product',
        dimension: 'Scope',
        type: 'Signal',
      }),
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })
    const atom = result[0].atoms.find((a) => a.id === 'dim-match')
    // 100 + 35 = 135
    expect(atom?.relevance_score).toBe(135)
  })

  it('adds +20 for secondary dimension match', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({
        id: 'sec-dim',
        level: 'Product',
        dimension: 'Architecture',
        type: 'Signal',
      }),
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
      secondary_dimensions: ['Architecture'],
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })
    const atom = result[0].atoms.find((a) => a.id === 'sec-dim')
    // 100 + 20 = 120
    expect(atom?.relevance_score).toBe(120)
  })

  it('adds +15 per applies_when match and -25 per breaks_when match', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({
        id: 'applies-breaks',
        level: 'Product',
        dimension: null,
        type: 'Signal',
        applies_when: ['early-stage', 'b2b'],
        breaks_when: ['enterprise'],
      }),
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
      context_tags: ['early-stage', 'enterprise'],
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })
    const atom = result[0].atoms.find((a) => a.id === 'applies-breaks')
    // 100 (base) + 10 (global) + 15 (early-stage match) - 25 (enterprise match) = 100
    expect(atom?.relevance_score).toBe(100)
  })

  it('adds strength bonuses correctly', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({
        id: 'high-strength',
        level: 'Product',
        dimension: null,
        type: 'Signal',
        strength: 'High',
      }),
      makeAtom({
        id: 'medium-strength',
        level: 'Product',
        dimension: null,
        type: 'Heuristic',
        strength: 'Medium',
      }),
      makeAtom({
        id: 'low-strength',
        level: 'Product',
        dimension: null,
        type: 'FailureMode',
        strength: 'Low',
      }),
    ]

    const classifier = makeClassifier({ level: 'Product' })
    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    const high = result[0].atoms.find((a) => a.id === 'high-strength')
    const medium = result[0].atoms.find((a) => a.id === 'medium-strength')
    const low = result[0].atoms.find((a) => a.id === 'low-strength')

    // 100 + 10 (global) + 10 (High) = 120
    expect(high?.relevance_score).toBe(120)
    // 100 + 10 (global) + 5 (Medium) = 115
    expect(medium?.relevance_score).toBe(115)
    // 100 + 10 (global) + 0 (Low) = 110
    expect(low?.relevance_score).toBe(110)
  })
})

// ---------------------------------------------------------------------------
// Test: Quota enforcement
// ---------------------------------------------------------------------------

describe('Quota enforcement', () => {
  it('pack contains types within stated min/max when enough atoms exist', () => {
    // Create a corpus with plenty of each type
    const atoms: ConceptAtom[] = [
      // 5 Signals
      ...Array.from({ length: 5 }, (_, i) =>
        makeAtom({ id: `signal-${i}`, type: 'Signal', level: 'Product' })
      ),
      // 10 Heuristics
      ...Array.from({ length: 10 }, (_, i) =>
        makeAtom({ id: `heuristic-${i}`, type: 'Heuristic', level: 'Product' })
      ),
      // 7 FailureModes
      ...Array.from({ length: 7 }, (_, i) =>
        makeAtom({ id: `failuremode-${i}`, type: 'FailureMode', level: 'Product' })
      ),
      // 4 Examples
      ...Array.from({ length: 4 }, (_, i) =>
        makeAtom({ id: `example-${i}`, type: 'Example', level: 'Product' })
      ),
    ]

    const classifier = makeClassifier({ level: 'Product' })
    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    for (const pack of result) {
      const signals = pack.atoms.filter((a) => a.type === 'Signal').length
      const heuristics = pack.atoms.filter((a) => a.type === 'Heuristic').length
      const failureModes = pack.atoms.filter((a) => a.type === 'FailureMode').length
      const examples = pack.atoms.filter((a) => a.type === 'Example').length

      // Quotas: Signal 2-3, Heuristic 5-8, FailureMode 3-5, Example 1-2
      expect(signals).toBeGreaterThanOrEqual(2)
      expect(signals).toBeLessThanOrEqual(3)
      expect(heuristics).toBeGreaterThanOrEqual(5)
      expect(heuristics).toBeLessThanOrEqual(8)
      expect(failureModes).toBeGreaterThanOrEqual(3)
      expect(failureModes).toBeLessThanOrEqual(5)
      expect(examples).toBeGreaterThanOrEqual(1)
      expect(examples).toBeLessThanOrEqual(2)
    }
  })
})

// ---------------------------------------------------------------------------
// Test: Total count 8-12
// ---------------------------------------------------------------------------

describe('Pack size', () => {
  it('each pack is between 8 and 12 when enough atoms exist', () => {
    const atoms: ConceptAtom[] = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeAtom({ id: `signal-${i}`, type: 'Signal', level: 'Product' })
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        makeAtom({ id: `heuristic-${i}`, type: 'Heuristic', level: 'Product' })
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        makeAtom({ id: `failuremode-${i}`, type: 'FailureMode', level: 'Product' })
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        makeAtom({ id: `example-${i}`, type: 'Example', level: 'Product' })
      ),
    ]

    const classifier = makeClassifier({ level: 'Product' })
    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    for (const pack of result) {
      expect(pack.atoms.length).toBeGreaterThanOrEqual(8)
      expect(pack.atoms.length).toBeLessThanOrEqual(12)
    }
  })

  it('returns fewer than 8 if not enough eligible atoms', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({ id: 'only-1', type: 'Signal', level: 'Product' }),
      makeAtom({ id: 'only-2', type: 'Heuristic', level: 'Product' }),
    ]

    const classifier = makeClassifier({ level: 'Product' })
    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    // Should have 2 atoms, not 8
    expect(result[0].atoms.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Test: Challenger replacement
// ---------------------------------------------------------------------------

describe('Challenger logic', () => {
  it('replaces bottom-ranked atoms with challengers, count stays same', () => {
    // Create atoms: some in Customer lens only, some in Business only
    const atoms: ConceptAtom[] = [
      // Customer-only atoms (will be base pack for Customer lens)
      ...Array.from({ length: 12 }, (_, i) =>
        makeAtom({
          id: `customer-${i}`,
          type: i < 3 ? 'Signal' : i < 8 ? 'Heuristic' : i < 11 ? 'FailureMode' : 'Example',
          level: 'Product',
          lens: ['Customer'],
          dimension: null,
        })
      ),
      // Business-only atom with HIGH score (challenger)
      makeAtom({
        id: 'business-challenger',
        type: 'Heuristic',
        level: 'Product',
        lens: ['Business'],
        dimension: 'Scope', // Will get +35 for primary match
        strength: 'High', // +10
      }),
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })
    const customerPack = result.find((p) => p.lens === 'Customer')!

    // Customer pack should have the challenger swapped in
    const hasChallenger = customerPack.atoms.some((a) => a.id === 'business-challenger')
    expect(hasChallenger).toBe(true)

    // Count should still be 12 (no net addition)
    expect(customerPack.atoms.length).toBe(12)
  })

  it('swaps at most 2 challengers', () => {
    const atoms: ConceptAtom[] = [
      // Customer-only atoms
      ...Array.from({ length: 12 }, (_, i) =>
        makeAtom({
          id: `customer-${i}`,
          type: i < 3 ? 'Signal' : i < 8 ? 'Heuristic' : i < 11 ? 'FailureMode' : 'Example',
          level: 'Product',
          lens: ['Customer'],
          dimension: null,
        })
      ),
      // 4 Business-only challengers
      ...Array.from({ length: 4 }, (_, i) =>
        makeAtom({
          id: `challenger-${i}`,
          type: 'Heuristic',
          level: 'Product',
          lens: ['Business'],
          dimension: 'Scope',
          strength: 'High',
        })
      ),
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })
    const customerPack = result.find((p) => p.lens === 'Customer')!

    // Count challengers in customer pack
    const challengersInPack = customerPack.atoms.filter((a) =>
      a.id.startsWith('challenger-')
    ).length

    // At most 2 challengers should be swapped in
    expect(challengersInPack).toBeLessThanOrEqual(2)
  })

  it('does not introduce duplicates', () => {
    const atoms: ConceptAtom[] = [
      // Atoms in both Customer and Business
      ...Array.from({ length: 12 }, (_, i) =>
        makeAtom({
          id: `shared-${i}`,
          type: i < 3 ? 'Signal' : i < 8 ? 'Heuristic' : i < 11 ? 'FailureMode' : 'Example',
          level: 'Product',
          lens: ['Customer', 'Business'],
        })
      ),
    ]

    const classifier = makeClassifier({ level: 'Product' })
    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    for (const pack of result) {
      const ids = pack.atoms.map((a) => a.id)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    }
  })

  it('does not replace when pack has fewer than 8 items', () => {
    const atoms: ConceptAtom[] = [
      // Only 4 Customer atoms
      ...Array.from({ length: 4 }, (_, i) =>
        makeAtom({
          id: `customer-${i}`,
          type: 'Heuristic',
          level: 'Product',
          lens: ['Customer'],
        })
      ),
      // 1 Business challenger with high score
      makeAtom({
        id: 'business-challenger',
        type: 'Heuristic',
        level: 'Product',
        lens: ['Business'],
        dimension: 'Scope',
        strength: 'High',
      }),
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })
    const customerPack = result.find((p) => p.lens === 'Customer')!

    // Pack has only 4 atoms, should NOT have challenger
    expect(customerPack.atoms.length).toBe(4)
    expect(customerPack.atoms.some((a) => a.id === 'business-challenger')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Test: Output structure
// ---------------------------------------------------------------------------

describe('Output structure', () => {
  it('returns exactly 3 packs: Customer, Business, Feasibility', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({ id: 'a1', type: 'Signal', level: 'Product' }),
    ]

    const classifier = makeClassifier({ level: 'Product' })
    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    expect(result.length).toBe(3)
    expect(result[0].lens).toBe('Customer')
    expect(result[1].lens).toBe('Business')
    expect(result[2].lens).toBe('Feasibility')
  })

  it('atoms are sorted by score DESC within each pack', () => {
    const atoms: ConceptAtom[] = [
      makeAtom({ id: 'low', type: 'Signal', level: 'Product', dimension: null }),
      makeAtom({
        id: 'high',
        type: 'Signal',
        level: 'Product',
        dimension: 'Scope',
        strength: 'High',
      }),
      makeAtom({
        id: 'medium',
        type: 'Signal',
        level: 'Product',
        dimension: 'Scope',
      }),
    ]

    const classifier = makeClassifier({
      level: 'Product',
      dimension: 'Scope',
    })

    const result = compileLensPacks({ classifierOutput: classifier, atoms })

    for (const pack of result) {
      for (let i = 1; i < pack.atoms.length; i++) {
        expect(pack.atoms[i - 1].relevance_score).toBeGreaterThanOrEqual(
          pack.atoms[i].relevance_score
        )
      }
    }
  })
})

