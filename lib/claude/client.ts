import Anthropic from '@anthropic-ai/sdk'
import { type ZodSchema } from 'zod'

export const CLAUDE_TIMEOUT_MS = 60_000
export const CLAUDE_MODEL_HAIKU =
  process.env.CLAUDE_MODEL_HAIKU || 'claude-3-haiku-20240307'
export const CLAUDE_MODEL_SONNET =
  process.env.CLAUDE_MODEL_SONNET || 'claude-3-5-sonnet-20241022'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PARSE_ERROR_MESSAGE = 'Failed to parse Claude response'
const DEFAULT_MAX_TOKENS = 1024

type ClaudeMessage = { role: 'user' | 'assistant'; content: string }

type ClaudeCallParams<T> = {
  model: string
  system: string
  messages: ClaudeMessage[]
  schema: ZodSchema<T>
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

export async function callClaude<T>(params: ClaudeCallParams<T>): Promise<T> {
  const controller = new AbortController()
  const timeoutMs = params.timeoutMs ?? CLAUDE_TIMEOUT_MS
  let rejectTimeout: ((reason?: unknown) => void) | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    rejectTimeout = reject
  })
  const timeoutId = setTimeout(() => {
    controller.abort()
    const timeoutError = new Error('Claude request timed out')
    timeoutError.name = 'AbortError'
    rejectTimeout?.(timeoutError)
  }, timeoutMs)

  try {
    const responsePromise = anthropic.messages.create(
      {
        model: params.model,
        system: params.system,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens ?? DEFAULT_MAX_TOKENS,
      },
      { signal: controller.signal }
    )
    const response = (await Promise.race([
      responsePromise,
      timeoutPromise,
    ])) as Awaited<ReturnType<typeof anthropic.messages.create>>

    const textContent = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim()

    if (!textContent) {
      throw new Error(PARSE_ERROR_MESSAGE)
    }

    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(textContent)
    } catch {
      throw new Error(PARSE_ERROR_MESSAGE)
    }

    const parsed = params.schema.safeParse(parsedContent)
    if (!parsed.success) {
      throw new Error(PARSE_ERROR_MESSAGE)
    }

    return parsed.data
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function callClaudeWithRetry<T>(
  params: ClaudeCallParams<T>,
  maxRetries: number = 1
): Promise<T> {
  let attempt = 0
  let lastError: unknown

  while (attempt <= maxRetries) {
    try {
      return await callClaude(params)
    } catch (error) {
      lastError = error
      const isAbortError = error instanceof Error && error.name === 'AbortError'
      const isParseError = error instanceof Error && error.message === PARSE_ERROR_MESSAGE

      if (!(isAbortError || isParseError) || attempt === maxRetries) {
        throw error
      }
    }

    attempt += 1
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to call Claude')
}

