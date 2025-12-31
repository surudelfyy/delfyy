import { z } from 'zod'

export const DecisionCardSchema = z.object({
  meta: z.object({
    confidence_tier: z.enum(['high', 'good', 'moderate', 'directional', 'exploratory']),
    stage: z.enum(['discovery', 'build', 'launch', 'growth']).optional(),
  }),

  summary: z.object({
    title: z.string(),
    call: z.string(),
    confidence: z.string(),
    do_next: z.string(),
    change_course_if: z.array(z.string()).max(3),
  }),

  details: z.object({
    assumptions: z.array(z.string()).max(5),
    tradeoffs: z.array(z.string()).max(6),
    risks: z.array(z.string()).max(6),
    watch_for: z.array(z.string()).max(5),
    approach: z.string().optional(),
  }),

  pattern: z.object({
    principle: z.string(),
    where_worked: z.array(z.string()).max(3),
    where_failed: z.array(z.string()).max(3),
    mechanism: z.string(),
  }),
})

export type DecisionCard = z.infer<typeof DecisionCardSchema>