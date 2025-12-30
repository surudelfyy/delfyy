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
  ),
  where_failed: z.array(
    z.object({
      example: z.string(),
      timeframe: z.string(),
      lesson: z.string(),
      atom_id: z.string(),
    })
  ),
  mechanism: z.string(), // ≤40 words explaining why it works or breaks
})

export type PatternMatcherOutput = z.infer<typeof PatternMatcherOutputSchema>

