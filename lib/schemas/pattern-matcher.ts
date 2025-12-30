import { z } from 'zod'

export const PatternMatcherOutputSchema = z.object({
  principle: z.string(), // ≤35 words, stated plainly
  where_worked: z.array(
    z.object({
      example: z.string(),
      timeframe: z.string(),
      lesson: z.string(),
      atom_id: z.string(), // singular, not atom_ids
    })
  ).max(3),
  where_failed: z.array(
    z.object({
      example: z.string(),
      timeframe: z.string(),
      lesson: z.string(),
      atom_id: z.string(),
    })
  ).max(3),
  mechanism: z.string(), // ≤40 words explaining why it works or breaks
})

export type PatternMatcherOutput = z.infer<typeof PatternMatcherOutputSchema>

export const PatternMatcherJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['principle', 'where_worked', 'where_failed', 'mechanism'],
  properties: {
    principle: { type: 'string', maxLength: 280 },
    where_worked: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['example', 'timeframe', 'lesson', 'atom_id'],
        properties: {
          example: { type: 'string', maxLength: 260 },
          timeframe: { type: 'string', maxLength: 120 },
          lesson: { type: 'string', maxLength: 220 },
          atom_id: { type: 'string', maxLength: 120 },
        },
      },
    },
    where_failed: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['example', 'timeframe', 'lesson', 'atom_id'],
        properties: {
          example: { type: 'string', maxLength: 260 },
          timeframe: { type: 'string', maxLength: 120 },
          lesson: { type: 'string', maxLength: 220 },
          atom_id: { type: 'string', maxLength: 120 },
        },
      },
    },
    mechanism: { type: 'string', maxLength: 240 },
  },
}

