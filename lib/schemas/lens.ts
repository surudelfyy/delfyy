import { z } from 'zod'

export const LensOutputSchema = z.object({
  lens: z.enum(['Customer', 'Business', 'Feasibility']),
  stance: z.enum(['support', 'oppose', 'mixed', 'unclear']),
  summary: z.string(),
  supporting_points: z.array(
    z.object({
      point: z.string(),
      atom_ids: z.array(z.string()),
    })
  ),
  counterpoints: z.array(
    z.object({
      point: z.string(),
      atom_ids: z.array(z.string()),
    })
  ),
  assumptions: z.array(
    z.object({
      assumption: z.string(),
      why_it_matters: z.string(),
    })
  ),
  disconfirming_tests: z
    .array(
      z.object({
        test: z.string(),
        pass_signal: z.string(),
        fail_signal: z.string(),
      })
    )
    .min(1), // Required, Evidence Governor checks presence
  open_questions: z.array(
    z.object({
      question: z.string(),
      why_it_matters: z.string(),
    })
  ),
  examples_in_pack: z.array(
    z.object({
      example: z.string(),
      lesson: z.string(),
      atom_ids: z.array(z.string()),
    })
  ),
  confidence: z.enum(['high', 'medium', 'low']),
})

export type LensOutput = z.infer<typeof LensOutputSchema>

