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

export const DecisionMemoJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'question',
    'call',
    'confidence',
    'next_steps',
    'why_this_call',
    'risks',
    'pattern',
    'examples',
    'meta',
  ],
  properties: {
    question: { type: 'string' },
    call: { type: 'string' },
    confidence: {
      type: 'object',
      additionalProperties: false,
      required: ['tier', 'score', 'rationale'],
      properties: {
        tier: { type: 'string', enum: ['high', 'supported', 'directional', 'exploratory'] },
        score: { type: 'number' },
        rationale: { type: 'string' },
      },
    },
    next_steps: { type: 'array', items: { type: 'string' } },
    why_this_call: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    pattern: {
      type: 'object',
      additionalProperties: false,
      required: ['principle', 'why_it_works'],
      properties: {
        principle: { type: 'string' },
        why_it_works: { type: 'string' },
      },
    },
    examples: {
      type: 'object',
      additionalProperties: false,
      required: ['worked', 'failed'],
      properties: {
        worked: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['company', 'story'],
            properties: {
              company: { type: 'string' },
              story: { type: 'string' },
              year: { type: 'string' },
            },
          },
        },
        failed: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['company', 'story'],
            properties: {
              company: { type: 'string' },
              story: { type: 'string' },
              year: { type: 'string' },
            },
          },
        },
      },
    },
    meta: {
      type: 'object',
      additionalProperties: false,
      required: ['date_iso'],
      properties: {
        stage: { type: 'string', enum: ['discovery', 'build', 'launch', 'growth'] },
        date_iso: { type: 'string' },
      },
    },
  },
} as const

