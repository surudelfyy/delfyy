import { z } from 'zod'
import { ClassifierOutputSchema } from '@/lib/schemas/classifier'
import { LensOutputSchema } from '@/lib/schemas/lens'
import { GovernorOutputSchema } from '@/lib/schemas/governor'
import { SynthesiserOutputSchema } from '@/lib/schemas/synthesiser'
import { DecisionMemoSchema } from '@/lib/schemas/decision-memo'

export const DecisionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.enum(['running', 'complete', 'partial', 'failed']),
  question: z.string(),
  input_context: z.record(z.string(), z.any()).default({}),
  classifier_output: ClassifierOutputSchema.nullable().optional(),
  lens_outputs: z.array(LensOutputSchema).nullable().optional(),
  governor_output: GovernorOutputSchema.nullable().optional(),
  confidence_tier: z.string().nullable().optional(),
  decision_card_internal: SynthesiserOutputSchema.nullable().optional(),
  decision_card: z.any().nullable().optional(),
  decision_card_text: z.string().nullable().optional(),
  decision_memo: DecisionMemoSchema.nullable().optional(),
  idempotency_key: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),

  // ============================================
  // CHECK-IN LOOP FIELDS (Day 7)
  // ============================================
  winning_outcome: z.string().max(500).nullish(),
  check_in_date: z.string().datetime().nullish(),
  check_in_outcome: z.enum(['pending', 'held', 'pivoted', 'too_early']).default('pending'),
  check_in_note: z.string().max(1000).nullish(),
  check_in_completed_at: z.string().datetime().nullish(),
  check_in_email_sent_at: z.string().datetime().nullish(),
  validation_steps: z.array(z.string()).default([]),
})

export type Decision = z.infer<typeof DecisionSchema>

/**
 * Schema for check-in page form submission
 * Used by: POST /api/decisions/[id]/check-in
 */
export const checkInSubmissionSchema = z.object({
  outcome: z.enum(['held', 'pivoted', 'too_early']),
  note: z.string().max(1000).optional(),
})

export type CheckInSubmission = z.infer<typeof checkInSubmissionSchema>

/**
 * Schema for the new intake form fields
 * Used by: Decision submission form
 */
export const checkInIntakeSchema = z.object({
  winning_outcome: z.string().max(500).optional(),
  check_in_date: z.string().datetime().optional(),
})

export type CheckInIntake = z.infer<typeof checkInIntakeSchema>

