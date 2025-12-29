import { callClaude, CLAUDE_MODEL_HAIKU } from '@/lib/claude/client'
import { ClassifierOutputSchema, type ClassifierOutput } from '@/lib/schemas/classifier'
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
}

export async function classify(input: ClassifyInput): Promise<ClassifierOutput> {
  const userPayload = {
    question: input.question,
    context: input.context ?? {},
  }

  return callClaude<ClassifierOutput>({
    model: CLAUDE_MODEL_HAIKU,
    system: CLASSIFIER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(userPayload) }],
    schema: ClassifierOutputSchema,
    temperature: 0,
    maxTokens: 1000,
    maxRetries: 1,
  })
}
