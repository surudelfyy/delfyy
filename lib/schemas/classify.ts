import { z } from 'zod'
import { contextSchema } from './context'

export const classifyRequestSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters')
    .max(1000, 'Question must be at most 1000 characters'),
  context: contextSchema,
})

export type ClassifyRequest = z.infer<typeof classifyRequestSchema>

