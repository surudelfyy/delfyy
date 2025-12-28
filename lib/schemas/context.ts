import { z } from 'zod'

export const contextSchema = z
  .object({
    stage: z.enum(['idea', 'mvp', 'early-revenue', 'scaling']).optional(),
    traction: z.enum(['none', 'few-users', 'paying', 'growing']).optional(),
    goal: z.enum(['speed', 'quality', 'revenue', 'learning']).optional(),
    constraints: z
      .array(z.string().max(50))
      .max(10)
      .optional(),
    risk_tolerance: z.enum(['low', 'medium', 'high']).optional(),
    what_tried: z.string().max(500).optional(),
    deadline: z.string().max(100).optional(),
  })
  .strict()
  .default({})

export type Context = z.infer<typeof contextSchema>

