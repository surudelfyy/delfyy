import {
  QUESTION_MAX,
  PER_DECISION_CONTEXT_MAX,
  DEFAULT_CONTEXT_MAX_FREE,
  DEFAULT_CONTEXT_MAX_PAID,
  FREE_COMPLETED_DECISION_LIMIT,
  ERROR_MESSAGES,
  type LimitErrorCode,
} from './decisionLimits'

export type Tier = 'free' | 'paid'

export type EnforceInput = {
  tier: Tier
  completedDecisions: number
  question: string
  contextFreeform?: string | null
  defaultContext?: string | null
}

export class LimitError extends Error {
  code: LimitErrorCode
  constructor(code: LimitErrorCode, message?: string) {
    super(message ?? ERROR_MESSAGES[code])
    this.code = code
  }
}

const hasLetters = (value: string) => /[A-Za-z]/.test(value)

export function enforceDecisionLimits(input: EnforceInput): void {
  const { tier, completedDecisions, question, contextFreeform, defaultContext } = input

  if (!question || question.trim().length < 10 || !hasLetters(question)) {
    throw new LimitError('VALIDATION_INVALID_QUESTION')
  }

  if (question.length > QUESTION_MAX) {
    throw new LimitError('LIMIT_QUESTION_TOO_LONG')
  }

  if (contextFreeform && contextFreeform.length > PER_DECISION_CONTEXT_MAX) {
    throw new LimitError('LIMIT_CONTEXT_TOO_LONG')
  }

  if (defaultContext) {
    const max = tier === 'paid' ? DEFAULT_CONTEXT_MAX_PAID : DEFAULT_CONTEXT_MAX_FREE
    if (defaultContext.length > max) {
      throw new LimitError('LIMIT_DEFAULT_CONTEXT_TOO_LONG')
    }
  }

  if (tier === 'free' && completedDecisions >= FREE_COMPLETED_DECISION_LIMIT) {
    throw new LimitError('LIMIT_PAYWALL')
  }
}

