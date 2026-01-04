import { z } from 'zod'
import { contextSchema } from './context'

export const decideRequestSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(500, 'Question must be at most 500 characters'),
  context: contextSchema.optional(),
  user_level_hint: z
    .enum(['strategy', 'product', 'design_ux', 'operations'])
    .nullable()
    .optional(),
  idempotency_key: z.string().uuid().optional(),
})

export type DecideRequest = z.infer<typeof decideRequestSchema>
