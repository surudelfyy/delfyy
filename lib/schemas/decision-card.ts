// Zod schema for Decision Card (display schema). Validates renderer output.
import { z } from 'zod'

const nonEmpty = z.string().min(1)

export const decisionCardSchema = z.object({
  // Layer 1
  decision: nonEmpty,
  confidence: nonEmpty,
  assumptions: nonEmpty,
  trade_offs: nonEmpty,
  risks: nonEmpty,
  next_step: nonEmpty,
  review_trigger: nonEmpty,
  escape_hatch: nonEmpty,
  approach: nonEmpty.optional(),
  // Layer 2
  principle: nonEmpty,
  where_worked: nonEmpty,
  where_failed: nonEmpty,
  mechanism: nonEmpty,
})

export type DecisionCardSchema = z.infer<typeof decisionCardSchema>

