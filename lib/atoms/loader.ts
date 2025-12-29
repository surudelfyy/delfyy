import { ConceptAtomSchema, type ConceptAtom } from '@/lib/schemas/atoms'

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

export function loadAtoms(rawAtoms: unknown[]): ConceptAtom[] {
  const validAtoms: ConceptAtom[] = []
  const errors: { index: number; id?: string; error: string }[] = []

  for (let i = 0; i < rawAtoms.length; i++) {
    const raw = rawAtoms[i]
    const result = ConceptAtomSchema.safeParse(raw)

    if (result.success) {
      validAtoms.push(result.data)
    } else {
      const atomId =
        typeof raw === 'object' && raw !== null && 'id' in raw
          ? String((raw as { id: unknown }).id)
          : `index-${i}`
      errors.push({
        index: i,
        id: atomId,
        error: result.error.message,
      })
    }
  }

  if (errors.length > 0) {
    const errorMsg = `Invalid atoms: ${errors.map((e) => e.id).join(', ')}`

    if (isDev) {
      // FAIL FAST in dev/test — don't silently ship broken corpus
      throw new Error(errorMsg + '\n' + JSON.stringify(errors, null, 2))
    } else {
      // Warn and skip in production
      console.warn('[atoms] ' + errorMsg)
    }
  }

  return validAtoms
}

