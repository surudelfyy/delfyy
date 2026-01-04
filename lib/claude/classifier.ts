import { callClaude, CLAUDE_MODEL_HAIKU } from '@/lib/claude/client'
import {
  ClassifierOutputSchema,
  type ClassifierOutput,
} from '@/lib/schemas/classifier'
import { CLASSIFIER_SYSTEM_PROMPT } from '@/prompts/classifier'

export type ClassifyInput = {
  question: string
  context: {
    stage?: string
    traction?: string
    goal?: string
    constraints?: string[]
    risk_tolerance?: string
    what_tried?: string
    deadline?: string
    bad_decision_signal?: string
  }
  user_level_hint?: 'strategy' | 'product' | 'design_ux' | 'operations' | null
}

export async function classify(
  input: ClassifyInput,
): Promise<ClassifierOutput> {
  const levelHintContext = input.user_level_hint
    ? `
USER LEVEL HINT:
The user indicated this is a "${input.user_level_hint}" decision.
- Weight this heavily when determining the LEVEL.
- Map user hint → backend level:
  - strategy → Strategy
  - product → Product
  - design_ux → Feature
  - operations → Operating
- Override ONLY if the question clearly contradicts the hint.
- If hint is design_ux, the correct backend level name is Feature (do not output "Design").
`
    : `
USER LEVEL HINT:
No hint provided. Determine level from the question alone.
`

  const userPayload = {
    question: input.question,
    context: input.context ?? {},
    level_hint_context: levelHintContext,
  }

  return callClaude<ClassifierOutput>({
    model: CLAUDE_MODEL_HAIKU,
    system: CLASSIFIER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
    schema: ClassifierOutputSchema,
    temperature: 0,
    maxTokens: 800,
    maxRetries: 1,
  })
}
