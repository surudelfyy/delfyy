import { z } from 'zod'

const bulletArray = (min: number, max: number) => z.array(z.string().trim().min(1)).min(min).max(max)

export const DecisionMemoSchema = z
  .object({
    question: z.string().trim().min(1),
    call: z.string().trim().min(1),
    confidence: z
      .object({
        tier: z.enum(['high', 'supported', 'directional', 'exploratory']),
        score: z.number().min(0).max(1),
        rationale: z.string().trim().min(1),
      })
      .strict(),
    next_steps: bulletArray(1, 4),
    why_this_call: bulletArray(2, 5),
    risks: bulletArray(1, 5),
    pattern: z
      .object({
        principle: z.string().trim().min(1),
        why_it_works: z.string().trim().min(1),
      })
      .strict(),
    examples: z
      .object({
        worked: z
          .array(
            z
              .object({
                company: z.string().trim().min(1),
                story: z.string().trim().min(1),
                year: z.string().trim().min(1).optional(),
              })
              .strict()
          )
          .max(2),
        failed: z
          .array(
            z
              .object({
                company: z.string().trim().min(1),
                story: z.string().trim().min(1),
                year: z.string().trim().min(1).optional(),
              })
              .strict()
          )
          .max(2),
      })
      .strict(),
    meta: z
      .object({
        stage: z.enum(['discovery', 'build', 'launch', 'growth']).optional(),
        date_iso: z.string().trim().min(1),
      })
      .strict(),
  })
  .strict()

export type DecisionMemo = z.infer<typeof DecisionMemoSchema>

