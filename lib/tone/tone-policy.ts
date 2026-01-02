'use client'

export type Tone = 'calm-founder' | 'direct' | 'clinical'
export type Channel = 'app' | 'email' | 'markdown'

export type LabelKey =
  | 'the-call'
  | 'do-next'
  | 'why-this-call'
  | 'decision-guardrails'
  | 'the-pattern'
  | 'meta'
  | 'confidence-tier-directional'
  | 'confidence-tier-supported'
  | 'confidence-tier-high'
  | 'confidence-tier-default'

const LABEL_MAP: Record<LabelKey, string> = {
  'the-call': 'Decision',
  'do-next': 'Next steps',
  'why-this-call': 'Reasoning',
  'decision-guardrails': 'When to revisit',
  'the-pattern': 'The principle',
  meta: '',
  'confidence-tier-directional': 'Medium confidence',
  'confidence-tier-supported': 'Good confidence',
  'confidence-tier-high': 'High confidence',
  'confidence-tier-default': 'Early signal',
}

export function getLabel(key: LabelKey, _tone: Tone = 'calm-founder', _channel: Channel = 'app'): string {
  return LABEL_MAP[key]
}

