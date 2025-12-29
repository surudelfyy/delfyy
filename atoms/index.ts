import { loadAtoms } from '@/lib/atoms/loader'
import sampleAtoms from './sample.json'

// Load and validate all atoms from JSON files
// Add additional JSON imports here as the corpus grows
export const atoms = loadAtoms([...sampleAtoms])

