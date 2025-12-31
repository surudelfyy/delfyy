import { z } from 'zod'

export const PatternMatcherOutputSchema = z.object({
  principle: z.string().min(1, 'principle cannot be empty'), // ≤35 words, stated plainly
  where_worked: z
    .array(
      z.object({
        example: z.string().min(1),
        timeframe: z.string().min(1),
        lesson: z.string().min(1),
        atom_id: z.string().min(1), // singular, not atom_ids
      })
    )
    .max(3),
  where_failed: z
    .array(
      z.object({
        example: z.string().min(1),
        timeframe: z.string().min(1),
        lesson: z.string().min(1),
        atom_id: z.string().min(1),
      })
    )
    .max(3),
  mechanism: z.string().min(1, 'mechanism cannot be empty'), // ≤40 words explaining why it works or breaks
}).superRefine((val, ctx) => {
  const total = (val.where_worked?.length ?? 0) + (val.where_failed?.length ?? 0)
  if (total === 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Must return at least one example across where_worked or where_failed',
      path: ['where_worked'],
    })
  }
})

export type PatternMatcherOutput = z.infer<typeof PatternMatcherOutputSchema>

export const PatternMatcherJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['principle', 'where_worked', 'where_failed', 'mechanism'],
  properties: {
    principle: { type: 'string' },
    where_worked: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['example', 'timeframe', 'lesson', 'atom_id'],
        properties: {
          example: { type: 'string' },
          timeframe: { type: 'string' },
          lesson: { type: 'string' },
          atom_id: { type: 'string' },
        },
      },
    },
    where_failed: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['example', 'timeframe', 'lesson', 'atom_id'],
        properties: {
          example: { type: 'string' },
          timeframe: { type: 'string' },
          lesson: { type: 'string' },
          atom_id: { type: 'string' },
        },
      },
    },
    mechanism: { type: 'string' },
  },
} as const

