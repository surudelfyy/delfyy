import { z } from 'zod'

// Level-scoped dimensions (v2.2 Section 5 — 23 total)
export const DIMENSIONS_BY_LEVEL = {
  Strategy: ['Audience', 'Problem', 'Positioning', 'Differentiation', 'Channel', 'Model'],
  Product: ['Scope', 'Sequencing', 'Architecture', 'Experience', 'Packaging', 'Quality', 'Integration'],
  Feature: ['Defaults', 'Friction', 'Copy', 'Layout', 'EdgeCases'],
  Operating: ['Hiring', 'Capital', 'Process', 'Prioritisation', 'Partnerships'],
} as const

export const ClassifierOutputSchema = z
  .object({
    level: z.enum(['Strategy', 'Product', 'Feature', 'Operating']),
    dimension: z.string(),
    secondary_dimensions: z.array(z.string()).max(2),
    related_dimensions: z
      .array(
        z.object({
          level: z.enum(['Strategy', 'Product', 'Feature', 'Operating']),
          dimension: z.string(),
        })
      )
      .optional()
      .default([]),
    decision_mode: z.enum(['choose', 'diagnose', 'plan']),
    context_tags: z.array(z.string()),
    risk_flags: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    follow_up_questions: z
      .array(
        z.object({
          question: z.string(),
          why_it_matters: z.string(),
        })
      )
      .min(3)
      .max(6),
  })
  .refine(
    (data) => {
      const allowedDimensions = DIMENSIONS_BY_LEVEL[data.level]
      return (allowedDimensions as readonly string[]).includes(data.dimension)
    },
    { message: 'dimension must be valid for the selected level (23 level-scoped dimensions)' }
  )
  .refine(
    (data) => {
      const allowedDimensions = DIMENSIONS_BY_LEVEL[data.level]
      return data.secondary_dimensions.every((d) =>
        (allowedDimensions as readonly string[]).includes(d)
      )
    },
    { message: 'secondary_dimensions must be valid for the selected level' }
  )

export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>

