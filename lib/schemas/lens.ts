import { z } from 'zod'

const string = (max: number) => z.string().max(max)

export const LensOutputSchema = z.object({
  lens: z.enum(['Customer', 'Business', 'Feasibility']),
  stance: z.enum(['support', 'oppose', 'mixed', 'unclear']),
  summary: string(600),
  supporting_points: z
    .array(
      z.object({
        point: string(240),
        atom_ids: z.array(z.string()).max(6),
      })
    )
    .max(3),
  counterpoints: z
    .array(
      z.object({
        point: string(240),
        atom_ids: z.array(z.string()).max(6),
      })
    )
    .max(3),
  assumptions: z
    .array(
      z.object({
        assumption: string(200),
        why_it_matters: string(240),
      })
    )
    .max(3),
  disconfirming_tests: z
    .array(
      z.object({
        test: string(240),
        pass_signal: string(180),
        fail_signal: string(180),
      })
    )
    .min(1)
    .max(2),
  open_questions: z
    .array(
      z.object({
        question: string(180),
        why_it_matters: string(220),
      })
    )
    .max(3),
  examples_in_pack: z
    .array(
      z.object({
        example: string(260),
        lesson: string(220),
        atom_ids: z.array(z.string()).max(6),
      })
    )
    .max(2),
  confidence: z.enum(['high', 'medium', 'low']),
})

export type LensOutput = z.infer<typeof LensOutputSchema>

// JSON Schema for structured outputs (kept in sync with LensOutputSchema)
export const LensOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'lens',
    'stance',
    'summary',
    'supporting_points',
    'counterpoints',
    'assumptions',
    'disconfirming_tests',
    'open_questions',
    'examples_in_pack',
    'confidence',
  ],
  properties: {
    lens: { enum: ['Customer', 'Business', 'Feasibility'] },
    stance: { enum: ['support', 'oppose', 'mixed', 'unclear'] },
    summary: { type: 'string' },
    supporting_points: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['point', 'atom_ids'],
        properties: {
          point: { type: 'string' },
          atom_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    counterpoints: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['point', 'atom_ids'],
        properties: {
          point: { type: 'string' },
          atom_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    assumptions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['assumption', 'why_it_matters'],
        properties: {
          assumption: { type: 'string' },
          why_it_matters: { type: 'string' },
        },
      },
    },
    disconfirming_tests: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['test', 'pass_signal', 'fail_signal'],
        properties: {
          test: { type: 'string' },
          pass_signal: { type: 'string' },
          fail_signal: { type: 'string' },
        },
      },
    },
    open_questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['question', 'why_it_matters'],
        properties: {
          question: { type: 'string' },
          why_it_matters: { type: 'string' },
        },
      },
    },
    examples_in_pack: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['example', 'lesson', 'atom_ids'],
        properties: {
          example: { type: 'string' },
          lesson: { type: 'string' },
          atom_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    confidence: { enum: ['high', 'medium', 'low'] },
  },
}

