import { z } from 'zod'

export const ConceptAtomSchema = z.object({
  id: z.string(),
  source: z.string(),
  version: z.number().optional(),
  type: z.enum(['Signal', 'Heuristic', 'FailureMode', 'Pattern', 'Example', 'Quote']),
  purpose: z.enum(['Detect', 'Evaluate', 'Warn', 'Illustrate']),
  claim: z.string(),
  rationale: z.string().optional(),
  lens: z.array(z.enum(['Customer', 'Business', 'Feasibility'])),
  level: z.enum(['Strategy', 'Product', 'Feature', 'Operating']),
  dimension: z.string().nullable(), // null = global (applies to all dimensions at this level)
  applies_when: z.array(z.string()).optional(),
  breaks_when: z.array(z.string()).optional(),
  strength: z.enum(['High', 'Medium', 'Low']).optional(),
  evidence_grade: z.enum(['Primary', 'Secondary']).optional(),
  timeframe: z
    .object({
      start_year: z.number(),
      end_year: z.number(),
    })
    .optional(),
  outcome: z.enum(['Worked', 'Failed', 'Mixed']).optional(),
  context: z.array(z.string()).optional(),
})

export type ConceptAtom = z.infer<typeof ConceptAtomSchema>

