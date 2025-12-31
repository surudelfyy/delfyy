import { ClassifierOutput } from '@/lib/schemas/classifier'
import { LensOutput } from '@/lib/schemas/lens'
import { GovernorOutput } from '@/lib/schemas/governor'
import { SynthesiserCardBits } from '@/lib/schemas/synthesiser'
import { DecisionCard } from '@/lib/schemas/decision-card'

export interface DecisionRow {
  id: string
  user_id: string
  status: 'running' | 'complete' | 'partial' | 'failed'
  question: string
  input_context: Record<string, unknown>
  classifier_output: ClassifierOutput | null
  lens_outputs: LensOutput[] | null
  governor_output: GovernorOutput | null
  decision_card_internal: SynthesiserCardBits | null
  decision_card: DecisionCard | null
  decision_card_text: string | null
  confidence_tier: string | null
  idempotency_key: string | null
  created_at: string
}

export interface DecisionContext {
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

