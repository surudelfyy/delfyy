import type { ConceptAtom } from '@/lib/schemas/atoms'
import type { ClassifierOutput } from '@/lib/schemas/classifier'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoredAtom extends ConceptAtom {
  relevance_score: number
}

export interface LensPack {
  lens: 'Customer' | 'Business' | 'Feasibility'
  atoms: ScoredAtom[]
}

export interface LensPackCompilerInput {
  classifierOutput: ClassifierOutput
  atoms: ConceptAtom[]
}

export type LensPackCompilerOutput = [LensPack, LensPack, LensPack]

type AtomType = ConceptAtom['type']
type Lens = 'Customer' | 'Business' | 'Feasibility'

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreAtom(atom: ConceptAtom, classifier: ClassifierOutput): number {
  let score = 100 // Base score for level match (already filtered)

  // Primary dimension match
  if (atom.dimension === classifier.dimension) {
    score += 35
  }

  // Secondary dimension match
  if (atom.dimension && classifier.secondary_dimensions.includes(atom.dimension)) {
    score += 20
  }

  // Global atom (dimension === null)
  if (atom.dimension === null) {
    score += 10
  }

  // applies_when matches context_tags (+15 each)
  if (atom.applies_when) {
    for (const tag of atom.applies_when) {
      if (classifier.context_tags.includes(tag)) {
        score += 15
      }
    }
  }

  // breaks_when matches context_tags (-25 each)
  if (atom.breaks_when) {
    for (const tag of atom.breaks_when) {
      if (classifier.context_tags.includes(tag)) {
        score -= 25
      }
    }
  }

  // Strength bonus
  if (atom.strength === 'High') {
    score += 10
  } else if (atom.strength === 'Medium') {
    score += 5
  }

  return score
}

// ---------------------------------------------------------------------------
// Sorting helper (stable: score DESC, id ASC)
// ---------------------------------------------------------------------------

function sortByScoreDesc(atoms: ScoredAtom[]): ScoredAtom[] {
  return [...atoms].sort((a, b) => {
    if (b.relevance_score !== a.relevance_score) {
      return b.relevance_score - a.relevance_score
    }
    return a.id.localeCompare(b.id)
  })
}

// ---------------------------------------------------------------------------
// Pack building with quotas
// ---------------------------------------------------------------------------

interface TypeQuota {
  type: AtomType
  min: number
  max: number
}

const BASE_QUOTAS: TypeQuota[] = [
  { type: 'Signal', min: 2, max: 3 },
  { type: 'Heuristic', min: 5, max: 8 },
  { type: 'FailureMode', min: 3, max: 5 },
  { type: 'Example', min: 1, max: 2 },
]

const MIN_PACK_SIZE = 8
const MAX_PACK_SIZE = 12

function buildPackForLens(
  lens: Lens,
  allScoredAtoms: ScoredAtom[]
): ScoredAtom[] {
  // Filter atoms eligible for this lens
  const eligible = allScoredAtoms.filter((a) => a.lens.includes(lens))
  const sorted = sortByScoreDesc(eligible)

  // Group by type
  const byType: Record<AtomType, ScoredAtom[]> = {
    Signal: [],
    Heuristic: [],
    FailureMode: [],
    Pattern: [],
    Example: [],
    Quote: [],
  }
  for (const atom of sorted) {
    byType[atom.type].push(atom)
  }

  const selected: ScoredAtom[] = []
  const selectedIds = new Set<string>()

  function addAtom(atom: ScoredAtom): boolean {
    if (selectedIds.has(atom.id)) return false
    if (selected.length >= MAX_PACK_SIZE) return false
    selected.push(atom)
    selectedIds.add(atom.id)
    return true
  }

  // A) Fill minimums in order: Signal(2), Heuristic(5), FailureMode(3), Example(1)
  for (const quota of BASE_QUOTAS) {
    const available = byType[quota.type]
    let added = 0
    for (const atom of available) {
      if (added >= quota.min) break
      if (addAtom(atom)) added++
    }
  }

  // B) Top up to max per type, by score, until we hit 12
  for (const quota of BASE_QUOTAS) {
    const available = byType[quota.type]
    let countInPack = selected.filter((a) => a.type === quota.type).length
    for (const atom of available) {
      if (countInPack >= quota.max) break
      if (selected.length >= MAX_PACK_SIZE) break
      if (addAtom(atom)) countInPack++
    }
  }

  // C) If still <8, use Pattern/Quote as fillers
  if (selected.length < MIN_PACK_SIZE) {
    const fillers = [...byType.Pattern, ...byType.Quote]
    const sortedFillers = sortByScoreDesc(fillers)
    for (const atom of sortedFillers) {
      if (selected.length >= MIN_PACK_SIZE) break
      if (selected.length >= MAX_PACK_SIZE) break
      addAtom(atom)
    }
  }

  return selected
}

// ---------------------------------------------------------------------------
// Challenger logic
// ---------------------------------------------------------------------------

function applyChallengerLogic(
  pack: ScoredAtom[],
  lens: Lens,
  allScoredAtoms: ScoredAtom[]
): ScoredAtom[] {
  // Don't replace if pack has <8 items
  if (pack.length < MIN_PACK_SIZE) {
    return pack
  }

  const packIds = new Set(pack.map((a) => a.id))

  // Challengers: atoms NOT in this lens but still level-matching (already filtered)
  const challengers = allScoredAtoms
    .filter((a) => !a.lens.includes(lens))
    .filter((a) => !packIds.has(a.id))

  const sortedChallengers = sortByScoreDesc(challengers)
  const topChallengers = sortedChallengers.slice(0, 2)

  if (topChallengers.length === 0) {
    return pack
  }

  // Sort pack by score ASC (lowest first for replacement)
  const packSortedAsc = [...pack].sort((a, b) => {
    if (a.relevance_score !== b.relevance_score) {
      return a.relevance_score - b.relevance_score
    }
    return a.id.localeCompare(b.id)
  })

  // Count examples in pack
  const exampleCount = pack.filter((a) => a.type === 'Example').length

  const result = [...pack]
  let replacementsLeft = Math.min(topChallengers.length, 2)

  for (const candidate of packSortedAsc) {
    if (replacementsLeft <= 0) break
    if (result.length <= MIN_PACK_SIZE) break

    // Don't replace the only Example
    if (candidate.type === 'Example' && exampleCount === 1) {
      continue
    }

    // Find challenger to swap in
    const challenger = topChallengers.shift()
    if (!challenger) break

    // Remove candidate, add challenger
    const idx = result.findIndex((a) => a.id === candidate.id)
    if (idx !== -1) {
      result.splice(idx, 1, challenger)
      replacementsLeft--
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Main compiler function
// ---------------------------------------------------------------------------

export function compileLensPacks(input: LensPackCompilerInput): LensPackCompilerOutput {
  const { classifierOutput, atoms } = input

  // Hard filter: only atoms matching the level
  const levelFiltered = atoms.filter((a) => a.level === classifierOutput.level)

  // Score all remaining atoms
  const scoredAtoms: ScoredAtom[] = levelFiltered.map((atom) => ({
    ...atom,
    relevance_score: scoreAtom(atom, classifierOutput),
  }))

  const lenses: Lens[] = ['Customer', 'Business', 'Feasibility']

  const packs = lenses.map((lens): LensPack => {
    const basePack = buildPackForLens(lens, scoredAtoms)
    const finalPack = applyChallengerLogic(basePack, lens, scoredAtoms)
    const sortedFinal = sortByScoreDesc(finalPack)

    return {
      lens,
      atoms: sortedFinal,
    }
  })

  return packs as LensPackCompilerOutput
}

