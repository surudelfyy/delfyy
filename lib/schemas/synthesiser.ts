// Zod schema for Synthesiser output. Array caps prevent LLM bloat.
import { z } from 'zod'

const confidenceLabel = z.enum(['high', 'medium', 'low'])
const callStatus = z.enum(['recommendation', 'insufficient_information'])
const exampleType = z.enum(['worked', 'failed'])

const reasonSchema = z.object({
  reason: z.string(),
  because: z.string(),
})

const tradeoffSchema = z.object({
  tradeoff: z.string(),
  what_you_gain: z.string(),
  what_you_risk: z.string(),
})

const assumptionSchema = z.object({
  assumption: z.string(),
  why_it_matters: z.string(),
  confidence: confidenceLabel,
})

const riskSchema = z.object({
  risk: z.string(),
  why_it_matters: z.string(),
})

const revisitSignalSchema = z.object({
  signal: z.string(),
  why_it_matters: z.string(),
})

const escapeHatchSchema = z.object({
  condition: z.string(),
  immediate_action: z.string(),
})

const nextStepSchema = z.object({
  step: z.string(),
  expected_output: z.string(),
})

const viewSchema = z.object({
  summary: z.string(),
  key_points: z.array(z.string()).max(4),
})

const realWorldExampleSchema = z.object({
  type: exampleType,
  example: z.string(),
  lesson: z.string(),
})

const safetyNoteSchema = z.object({
  flag: z.string(),
  note: z.string(),
})

export const synthesiserOutputSchema = z.object({
  version: z.literal(1),
  recommended_call: z.object({
    status: callStatus,
    choice: z.string(),
    confidence_label: confidenceLabel,
    confidence_score: z.number(),
  }),
  confidence_reason: z.string().max(100),
  top_reasons: z.array(reasonSchema).min(2).max(4),
  tradeoffs: z.array(tradeoffSchema).min(1).max(3),
  assumptions: z.array(assumptionSchema).min(1).max(6),
  key_risks: z.array(riskSchema).max(4),
  revisit_signals: z.array(revisitSignalSchema).min(1).max(4),
  escape_hatch: escapeHatchSchema.nullable(),
  next_steps: z.array(nextStepSchema).min(1).max(5),
  four_views_summary: z.object({
    customer_view: viewSchema,
    business_view: viewSchema,
    build_view: viewSchema,
    evidence_view: viewSchema,
  }),
  real_world_examples: z.object({
    included: z.boolean(),
    items: z.array(realWorldExampleSchema).max(3),
  }),
  safety_notes: z.array(safetyNoteSchema).max(3),
  contest_summary: z.string().max(150).optional(),
})

export type SynthesiserOutputSchema = z.infer<typeof synthesiserOutputSchema>

