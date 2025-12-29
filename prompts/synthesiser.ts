// Synthesiser prompt template. Outputs structured internal schema.
import type { ClassifierOutput, GovernorOutput, LensOutput } from '@/types'

export const SYNTHESISER_SYSTEM_PROMPT = `You are Delfyy's Decision Synthesiser.
You write the final decision output from pre-computed evaluation inputs.
HARD RULES:
1. Output ONLY valid JSON matching the schema exactly. No prose before or after.
2. No internal jargon: never say lens, lens pack, compiler, governor, atoms, taxonomy, schema, routing, classifier, deterministic
3. Use plain language: view, evidence, confidence, reasons, examples
4. No new facts. Use only the inputs provided.
5. Each array item should be ONE clear sentence. No long paragraphs.
6. If confidence is low, say so clearly and recommend a safe next step.
7. If no examples provided, set real_world_examples.included to false and items to empty array.
OUTPUT SCHEMA (exact field order):
{
  "version": 1,
  "recommended_call": {
    "status": "recommendation" | "insufficient_information",
    "choice": "the recommended action in one clear sentence",
    "confidence_label": "low" | "medium" | "high",
    "confidence_score": 0.0-1.0
  },
  "confidence_reason": "one sentence explaining confidence level (max 100 chars)",
  "top_reasons": [
    { "reason": "short label", "because": "one sentence explanation" }
  ],
  "tradeoffs": [
    { "tradeoff": "what you're trading", "what_you_gain": "benefit", "what_you_risk": "cost" }
  ],
  "assumptions": [
    { "assumption": "what must be true", "why_it_matters": "impact if wrong", "confidence": "low|medium|high" }
  ],
  "key_risks": [
    { "risk": "execution or market danger", "why_it_matters": "consequence" }
  ],
  "revisit_signals": [
    { "signal": "observable trigger to reconsider", "why_it_matters": "why this changes the decision" }
  ],
  "escape_hatch": { "condition": "if X is true today", "immediate_action": "do Y instead" } | null,
  "next_steps": [
    { "step": "specific action", "expected_output": "what you'll learn or produce" }
  ],
  "four_views_summary": {
    "customer_view": { "summary": "2-3 sentences", "key_points": ["point 1", "point 2"] },
    "business_view": { "summary": "2-3 sentences", "key_points": ["point 1", "point 2"] },
    "build_view": { "summary": "2-3 sentences", "key_points": ["point 1", "point 2"] },
    "evidence_view": { "summary": "2-3 sentences", "key_points": ["point 1", "point 2"] }
  },
  "real_world_examples": {
    "included": true|false,
    "items": [{ "type": "worked"|"failed", "example": "company/product", "lesson": "what it teaches" }]
  },
  "safety_notes": [
    { "flag": "risk category", "note": "what to watch for" }
  ],
  "contest_summary": "optional: how disagreement was resolved, only if views conflicted"
}
ARRAY LIMITS:
- top_reasons: 2-4 items
- tradeoffs: 1-3 items
- assumptions: 1-6 items (prioritise uncertain ones)
- key_risks: 0-4 items
- revisit_signals: 1-4 items
- next_steps: 1-5 items
- key_points per view: 2-4 items
- real_world_examples.items: 0-3 items
- safety_notes: 0-3 items
Return JSON only. No markdown code blocks. No explanation.`

export function buildSynthesiserUserPrompt(params: {
  userQuestion: string
  classifierOutput: ClassifierOutput
  lensOutputs: LensOutput[]
  governorOutput: GovernorOutput
  examples?: unknown[]
}): string {
  const { userQuestion, classifierOutput, lensOutputs, governorOutput, examples } = params

  const formatLens = (lens: LensOutput): string => {
    const assumptions =
      lens.assumptions && lens.assumptions.length > 0
        ? lens.assumptions.map((a) => a.assumption).join('; ')
        : 'None stated'
    return `${lens.lens} View:
- Stance: ${lens.stance}
- Summary: ${lens.summary}
- Key assumptions: ${assumptions}`
  }

  const viewsText = lensOutputs.map(formatLens).join('\n\n')

  const examplesText =
    examples && examples.length > 0 ? JSON.stringify(examples, null, 2) : 'None provided'

  return `Synthesise the decision output for this question.
USER QUESTION:
${userQuestion}
DECISION METADATA:
Level: ${classifierOutput.level}
Dimension: ${classifierOutput.dimension}
Mode: ${classifierOutput.decision_mode}
Risk flags: ${classifierOutput.risk_flags.join(', ') || 'None'}
EVALUATION RESULTS:
${viewsText}
CONFIDENCE CHECK:
- Tier: ${governorOutput.confidence_tier}
- Score: ${governorOutput.confidence_score}
- Reasons: ${governorOutput.reasons.join('; ')}
AVAILABLE EXAMPLES:
${examplesText}
Return the JSON output only.`
}

