export const QUESTION_MAX = 500
export const PER_DECISION_CONTEXT_MAX = 500
export const DEFAULT_CONTEXT_MAX_FREE = 800
export const DEFAULT_CONTEXT_MAX_PAID = 2000
export const ASSUMPTION_CORRECTION_MAX = 500
export const FREE_COMPLETED_DECISION_LIMIT = 3

export type LimitErrorCode =
  | 'LIMIT_PAYWALL'
  | 'LIMIT_QUESTION_TOO_LONG'
  | 'LIMIT_CONTEXT_TOO_LONG'
  | 'LIMIT_DEFAULT_CONTEXT_TOO_LONG'
  | 'VALIDATION_INVALID_QUESTION'

export const ERROR_MESSAGES: Record<LimitErrorCode, string> = {
  LIMIT_PAYWALL: "You’ve used your 3 free decisions. Upgrade to keep deciding.",
  LIMIT_QUESTION_TOO_LONG: 'Question exceeds the maximum length.',
  LIMIT_CONTEXT_TOO_LONG: 'Context exceeds the maximum length.',
  LIMIT_DEFAULT_CONTEXT_TOO_LONG: 'Saved context exceeds the maximum length.',
  VALIDATION_INVALID_QUESTION: 'Question must include letters and be at least 10 characters.',
}

