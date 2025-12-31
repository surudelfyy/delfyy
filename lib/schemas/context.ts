import { z } from 'zod'

export const contextSchema = z
  .object({
    stage: z.enum(['discovery', 'build', 'launch', 'growth']).optional(),
    traction: z.string().optional(),
    goal: z.string().optional(),
    constraints: z
      .array(z.string().max(50))
      .max(10)
      .optional(),
    risk_tolerance: z.string().optional(),
    what_tried: z.string().max(500).optional(),
    deadline: z.string().max(100).optional(),
    bad_decision_signal: z.string().max(200).optional(),
    freeform: z.string().max(500).optional(),
  })
  .strict()
  .default({})

export type Context = z.infer<typeof contextSchema>

