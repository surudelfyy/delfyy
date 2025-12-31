// CLASSIFIER
export type ClassifierLevel = 'Strategy' | 'Product' | 'Feature' | 'Operating'
export type DecisionMode = 'choose' | 'diagnose' | 'plan'

export interface ClassifierOutput {
  level: ClassifierLevel
  dimension: string
  secondary_dimensions: string[]
  related_dimensions?: { level: ClassifierLevel; dimension: string }[]
  decision_mode: DecisionMode
  context_tags: string[]
  risk_flags: string[]
  confidence: number
  follow_up_questions: { question: string; why_it_matters: string }[]
}

// LENS EVALUATOR
export type LensName = 'Customer' | 'Business' | 'Feasibility'
export type Stance = 'support' | 'oppose' | 'mixed' | 'unclear'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface LensOutput {
  lens: LensName
  stance: Stance
  summary: string
  supporting_points: { point: string; atom_ids: string[] }[]
  counterpoints: { point: string; atom_ids: string[] }[]
  assumptions: { assumption: string; why_it_matters: string }[]
  disconfirming_tests: { test: string; pass_signal: string; fail_signal: string }[]
  open_questions: { question: string; why_it_matters: string }[]
  examples_in_pack: { example: string; lesson: string; atom_ids: string[] }[]
  confidence: ConfidenceLevel
}

// EVIDENCE GOVERNOR
export type ConfidenceTier = 'exploratory' | 'directional' | 'moderate' | 'good' | 'high'
export type CommitmentPosture =
  | 'explore'
  | 'test'
  | 'proceed_cautiously'
  | 'proceed'
  | 'hold'

export interface GovernorOutput {
  confidence_tier: ConfidenceTier
  commitment_posture: CommitmentPosture
  confidence_score: number
  trigger_round_2: boolean
  reasons: string[]
}

// SYNTHESISER OUTPUT (Internal, structured)
export interface SynthesiserCardBits {
  version: 1
  recommended_call: {
    status: 'recommendation' | 'insufficient_information'
    choice: string
    confidence_label: ConfidenceLevel
    confidence_score: number
  }
  confidence_reason: string
  tradeoffs: { tradeoff: string; what_you_gain: string; what_you_risk: string }[]
  key_risks: { risk: string; why_it_matters: string }[]
  assumptions: { assumption: string; why_it_matters: string; confidence: ConfidenceLevel }[]
  escape_hatch: { condition: string; immediate_action: string }
  next_steps: { step: string; expected_output: string }[]
}

// PATTERN MATCHER
export interface PatternMatcherInput {
  classifier_output: ClassifierOutput
  recommended_choice: string
  top_reasons: { reason: string; because: string }[]
}

export interface PatternMatcherOutput {
  principle: string
  where_worked: { example: string; timeframe: string; lesson: string; atom_id: string }[]
  where_failed: { example: string; timeframe: string; lesson: string; atom_id: string }[]
  mechanism: string
}

// DECISION CARD (Display schema, premium memo)
export interface DecisionCard {
  meta: {
    confidence_tier: 'high' | 'good' | 'moderate' | 'directional' | 'exploratory'
    stage?: 'discovery' | 'build' | 'launch' | 'growth'
  }
  summary: {
    title: string
    call: string
    confidence: string
    do_next: string
    success_looks_like: string[]
    change_course_if: string[]
  }
  details: {
    assumptions: string[]
    tradeoffs: string[]
    risks: string[]
    watch_for: string[]
    approach?: string
  }
  pattern: {
    principle: string
    where_worked: string[]
    where_failed: string[]
    mechanism: string
  }
}

// CONCEPT ATOM
export type AtomType = 'Signal' | 'Heuristic' | 'FailureMode' | 'Pattern' | 'Example' | 'Quote'
export type AtomPurpose = 'Detect' | 'Evaluate' | 'Warn' | 'Illustrate'
export type AtomStrength = 'High' | 'Medium' | 'Low'
export type EvidenceGrade = 'Primary' | 'Secondary'
export type AtomOutcome = 'Worked' | 'Failed' | 'Mixed'

export interface ConceptAtom {
  id: string
  source: string
  version?: number
  type: AtomType
  purpose: AtomPurpose
  claim: string
  rationale?: string
  lens: LensName[]
  level: 'Strategy' | 'Product' | 'Feature' | 'Operating'
  dimension: string | null // null = global
  applies_when?: string[]
  breaks_when?: string[]
  strength?: AtomStrength
  evidence_grade?: EvidenceGrade
  timeframe?: { start_year: number; end_year: number }
  outcome?: AtomOutcome
  context?: string[]
}

export interface ScoredAtom extends ConceptAtom {
  relevance_score: number
}

export interface LensPack {
  lens: LensName
  atoms: ScoredAtom[]
}

// DATABASE TYPES
export type DecisionStatus = 'running' | 'complete' | 'partial' | 'failed'

export interface Decision {
  id: string
  user_id: string
  question: string
  input_context: InputContext
  status: DecisionStatus
  classifier_output: ClassifierOutput | null
  lens_outputs: LensOutput[] | null
  governor_output: GovernorOutput | null
  confidence_tier: ConfidenceTier | null
  decision_card_internal: SynthesiserCardBits | null
  decision_card: DecisionCard | null
  decision_card_text: string | null
  created_at: string
  updated_at: string
}

// INPUT CONTEXT
export interface InputContext {
  stage?: 'discovery' | 'build' | 'launch' | 'growth'
  traction?: string
  goal?: string
  constraints?: string[]
  risk_tolerance?: string
  what_tried?: string
  deadline?: string
  bad_decision_signal?: string
  freeform?: string
}

