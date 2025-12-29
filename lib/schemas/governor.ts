import { z } from 'zod'

// Evidence Governor output (per v2.2 Section 8.2 — NOT an LLM output, internal use)
export const GovernorOutputSchema = z.object({
  confidence_tier: z.enum(['exploratory', 'directional', 'supported', 'high']),
  commitment_posture: z.enum(['explore', 'test', 'proceed_cautiously', 'proceed', 'hold']),
  confidence_score: z.number().min(0).max(1),
  trigger_round_2: z.boolean(),
  reasons: z.array(z.string()),
})

export type GovernorOutput = z.infer<typeof GovernorOutputSchema>

