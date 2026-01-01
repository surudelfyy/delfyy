import { z } from 'zod'

export const SynthesiserOutputSchema = z
  .object({
    version: z.literal(1),
    recommended_call: z.object({
      status: z.enum(['recommendation', 'insufficient_information']),
      choice: z.string(),
      confidence_label: z.enum(['low', 'medium', 'high']),
      confidence_score: z.number().min(0).max(1),
    }),
    confidence_reason: z.string(), // ≤100 chars enforced via superRefine
    top_reasons: z
      .array(
        z.object({
          reason: z.string(),
          because: z.string(),
        })
      )
      .min(2)
      .max(4),
    tradeoffs: z
      .array(
        z.object({
          tradeoff: z.string(),
          what_you_gain: z.string(),
          what_you_risk: z.string(),
        })
      )
      .max(3)
      .default([]),
    assumptions: z
      .array(
        z.object({
          assumption: z.string(),
          why_it_matters: z.string(),
          confidence: z.enum(['high', 'medium', 'low']),
        })
      )
      .max(6)
      .default([]),
    key_risks: z
      .array(
        z.object({
          risk: z.string(),
          why_it_matters: z.string(),
        })
      )
      .max(4),
    revisit_signals: z
      .array(
        z.object({
          signal: z.string(),
          why_it_matters: z.string(),
        })
      )
      .max(3)
      .default([]),
    escape_hatch: z
      .object({
        condition: z.string(),
        immediate_action: z.string(),
      })
      .nullable()
      .default(null),
    next_steps: z
      .array(
        z.object({
          step: z.string(),
          expected_output: z.string(),
        })
      )
      .min(1)
      .max(5),
    four_views_summary: z.object({
      customer_view: z.object({ summary: z.string(), key_points: z.array(z.string()) }),
      business_view: z.object({ summary: z.string(), key_points: z.array(z.string()) }),
      build_view: z.object({ summary: z.string(), key_points: z.array(z.string()) }),
      evidence_view: z.object({ summary: z.string(), key_points: z.array(z.string()) }),
    }),
    real_world_examples: z.object({
      included: z.boolean(),
      items: z.array(
        z.object({
          type: z.enum(['worked', 'failed']),
          example: z.string(),
          lesson: z.string(),
        })
      ),
    }),
    safety_notes: z.array(
      z.object({
        flag: z.string(),
        note: z.string(),
      })
    ),
    contest_summary: z.string().optional(), // ≤150 chars only if views disagreed
  })
  .superRefine((val, ctx) => {
    if (val.confidence_reason.length > 160) {
      ctx.addIssue({
        code: 'custom',
        message: 'confidence_reason too long (max 160 chars)',
        path: ['confidence_reason'],
      })
    }
    if (val.contest_summary && val.contest_summary.length > 150) {
      ctx.addIssue({
        code: 'custom',
        message: 'contest_summary too long (max 150 chars)',
        path: ['contest_summary'],
      })
    }
  })

export type SynthesiserOutput = z.infer<typeof SynthesiserOutputSchema>

export const SynthesiserCardBitsSchema = z.object({
  version: z.literal(1),
  recommended_call: z.object({
    status: z.enum(['recommendation', 'insufficient_information']),
    choice: z.string(),
    confidence_label: z.enum(['low', 'medium', 'high']),
    confidence_score: z.number().min(0).max(1),
  }),
  confidence_reason: z.string(),
  tradeoffs: z
    .array(
      z.object({
        tradeoff: z.string(),
        what_you_gain: z.string(),
        what_you_risk: z.string(),
      })
    )
    .max(2),
  key_risks: z
    .array(
      z.object({
        risk: z.string(),
        why_it_matters: z.string(),
      })
    )
    .max(3),
  assumptions: z
    .array(
      z.object({
        assumption: z.string(),
        why_it_matters: z.string(),
        confidence: z.enum(['high', 'medium', 'low']),
      })
    )
    .max(2),
  escape_hatch: z.object({
    condition: z.string(),
    immediate_action: z.string(),
  }),
  next_steps: z
    .array(
      z.object({
        step: z.string(),
        expected_output: z.string(),
      })
    )
    .max(2),
})

export type SynthesiserCardBits = z.infer<typeof SynthesiserCardBitsSchema>