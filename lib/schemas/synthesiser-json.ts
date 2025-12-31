export const SynthesiserOutputJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'version',
    'recommended_call',
    'confidence_reason',
    'top_reasons',
    'tradeoffs',
    'assumptions',
    'key_risks',
    'revisit_signals',
    'escape_hatch',
    'next_steps',
    'four_views_summary',
    'real_world_examples',
    'safety_notes',
  ],
  properties: {
    version: { type: 'number' },
    recommended_call: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'choice', 'confidence_label', 'confidence_score'],
      properties: {
        status: { enum: ['recommendation', 'insufficient_information'] },
        choice: { type: 'string' },
        confidence_label: { enum: ['low', 'medium', 'high'] },
        confidence_score: { type: 'number' },
      },
    },
    confidence_reason: { type: 'string' },
    top_reasons: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['reason', 'because'],
        properties: {
          reason: { type: 'string' },
          because: { type: 'string' },
        },
      },
    },
    tradeoffs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tradeoff', 'what_you_gain', 'what_you_risk'],
        properties: {
          tradeoff: { type: 'string' },
          what_you_gain: { type: 'string' },
          what_you_risk: { type: 'string' },
        },
      },
    },
    assumptions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['assumption', 'why_it_matters', 'confidence'],
        properties: {
          assumption: { type: 'string' },
          why_it_matters: { type: 'string' },
          confidence: { enum: ['high', 'medium', 'low'] },
        },
      },
    },
    key_risks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['risk', 'why_it_matters'],
        properties: {
          risk: { type: 'string' },
          why_it_matters: { type: 'string' },
        },
      },
    },
    revisit_signals: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['signal', 'why_it_matters'],
        properties: {
          signal: { type: 'string' },
          why_it_matters: { type: 'string' },
        },
      },
    },
    escape_hatch: {
      type: 'object',
      additionalProperties: false,
      required: ['condition', 'immediate_action'],
      properties: {
        condition: { type: 'string' },
        immediate_action: { type: 'string' },
      },
    },
    next_steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['step', 'expected_output'],
        properties: {
          step: { type: 'string' },
          expected_output: { type: 'string' },
        },
      },
    },
    four_views_summary: {
      type: 'object',
      additionalProperties: false,
      required: ['customer_view', 'business_view', 'build_view', 'evidence_view'],
      properties: {
        customer_view: {
          type: 'object',
          additionalProperties: false,
          required: ['summary', 'key_points'],
          properties: {
            summary: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
          },
        },
        business_view: {
          type: 'object',
          additionalProperties: false,
          required: ['summary', 'key_points'],
          properties: {
            summary: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
          },
        },
        build_view: {
          type: 'object',
          additionalProperties: false,
          required: ['summary', 'key_points'],
          properties: {
            summary: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
          },
        },
        evidence_view: {
          type: 'object',
          additionalProperties: false,
          required: ['summary', 'key_points'],
          properties: {
            summary: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    real_world_examples: {
      type: 'object',
      additionalProperties: false,
      required: ['included', 'items'],
      properties: {
        included: { type: 'boolean' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['type', 'example', 'lesson'],
            properties: {
              type: { enum: ['worked', 'failed'] },
              example: { type: 'string' },
              lesson: { type: 'string' },
            },
          },
        },
      },
    },
    safety_notes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['flag', 'note'],
        properties: {
          flag: { type: 'string' },
          note: { type: 'string' },
        },
      },
    },
    contest_summary: { type: 'string' },
  },
} as const

export const SynthesiserCardBitsJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'version',
    'recommended_call',
    'confidence_reason',
    'tradeoffs',
    'key_risks',
    'assumptions',
    'escape_hatch',
    'next_steps',
  ],
  properties: {
    version: { type: 'number' },
    recommended_call: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'choice', 'confidence_label', 'confidence_score'],
      properties: {
        status: { enum: ['recommendation', 'insufficient_information'] },
        choice: { type: 'string' },
        confidence_label: { enum: ['low', 'medium', 'high'] },
        confidence_score: { type: 'number' },
      },
    },
    confidence_reason: { type: 'string' },
    tradeoffs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tradeoff', 'what_you_gain', 'what_you_risk'],
        properties: {
          tradeoff: { type: 'string' },
          what_you_gain: { type: 'string' },
          what_you_risk: { type: 'string' },
        },
      },
    },
    key_risks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['risk', 'why_it_matters'],
        properties: {
          risk: { type: 'string' },
          why_it_matters: { type: 'string' },
        },
      },
    },
    assumptions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['assumption', 'why_it_matters', 'confidence'],
        properties: {
          assumption: { type: 'string' },
          why_it_matters: { type: 'string' },
          confidence: { enum: ['high', 'medium', 'low'] },
        },
      },
    },
    escape_hatch: {
      type: 'object',
      additionalProperties: false,
      required: ['condition', 'immediate_action'],
      properties: {
        condition: { type: 'string' },
        immediate_action: { type: 'string' },
      },
    },
    next_steps: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['step', 'expected_output'],
        properties: {
          step: { type: 'string' },
          expected_output: { type: 'string' },
        },
      },
    },
  },
} as const

