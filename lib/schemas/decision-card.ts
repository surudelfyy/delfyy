import { z } from 'zod'

// This is the DISPLAY schema stored in decision_card JSONB
// Word limits enforced by renderer, not Zod
export const DecisionCardSchema = z.object({
  // Layer 1: The Decision
  decision: z.string(), // 30 words
  confidence: z.string(), // 20 words
  assumptions: z.string(), // 60 words
  trade_offs: z.string(), // 50 words
  risks: z.string(), // 40 words
  next_step: z.string(), // 35 words
  review_trigger: z.string(), // 35 words
  escape_hatch: z.string(), // 35 words
  approach: z.string().optional(), // 30 words (only if contested)

  // Layer 2: The Learning
  principle: z.string(), // 35 words
  where_worked: z.string(), // 50 words
  where_failed: z.string(), // 50 words
  mechanism: z.string(), // 40 words
})

export type DecisionCard = z.infer<typeof DecisionCardSchema>