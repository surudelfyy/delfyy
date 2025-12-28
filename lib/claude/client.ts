import Anthropic from '@anthropic-ai/sdk'
import { type ZodSchema } from 'zod'

export class ClaudeTimeoutError extends Error {
  constructor() {
    super('Claude request timed out')
    this.name = 'ClaudeTimeoutError'
  }
}

export class ClaudeParseError extends Error {
  constructor(message = 'Failed to parse Claude response') {
    super(message)
    this.name = 'ClaudeParseError'
  }
}

export class ClaudeValidationError extends Error {
  constructor(message = 'Response failed schema validation') {
    super(message)
    this.name = 'ClaudeValidationError'
  }
}

export class ClaudeApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ClaudeApiError'
    this.status = status
  }
}

export const CLAUDE_TIMEOUT_MS = 60_000
export const CLAUDE_MODEL_HAIKU =
  process.env.CLAUDE_MODEL_HAIKU || 'claude-3-haiku-20240307'
export const CLAUDE_MODEL_SONNET =
  process.env.CLAUDE_MODEL_SONNET || 'claude-3-5-sonnet-20241022'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DEFAULT_MAX_TOKENS = 2048

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

function extractJSON(text: string): string | null {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const withoutFences = fencedMatch ? fencedMatch[1].trim() : text.trim()

  const objectStart = withoutFences.indexOf('{')
  const objectEnd = withoutFences.lastIndexOf('}')
  if (objectStart !== -1 && objectEnd !== -1 && objectEnd > objectStart) {
    return withoutFences.slice(objectStart, objectEnd + 1)
  }

  const arrayStart = withoutFences.indexOf('[')
  const arrayEnd = withoutFences.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return withoutFences.slice(arrayStart, arrayEnd + 1)
  }

  return null
}

function parseWithFallback(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const extracted = extractJSON(text)
    if (extracted) {
      try {
        return JSON.parse(extracted)
      } catch {
        throw new ClaudeParseError()
      }
    }
    throw new ClaudeParseError()
  }
}

async function backoff(attempt: number): Promise<void> {
  const delay = Math.min(1000 * 2 ** attempt, 10_000) + Math.random() * 200
  return new Promise((resolve) => setTimeout(resolve, delay))
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
    rejectTimeout?.(new ClaudeTimeoutError())
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
      throw new ClaudeParseError()
    }

    const parsed = params.schema.safeParse(parseWithFallback(textContent))
    if (!parsed.success) {
      throw new ClaudeValidationError()
    }

    return parsed.data
  } catch (error) {
    if (error instanceof ClaudeTimeoutError) {
      throw error
    }

    if (error instanceof ClaudeParseError || error instanceof ClaudeValidationError) {
      throw error
    }

    const isAbortError = error instanceof Error && error.name === 'AbortError'
    if (isAbortError) {
      throw new ClaudeTimeoutError()
    }

    const status =
      typeof (error as { status?: number }).status === 'number'
        ? (error as { status?: number }).status
        : undefined
    const message = error instanceof Error ? error.message : 'Claude API error'

    throw new ClaudeApiError(message, status)
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function callClaudeWithRetry<T>(
  params: ClaudeCallParams<T>,
  maxRetries: number = 1
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await callClaude(params)
    } catch (error) {
      console.error({
        model: params.model,
        attempt,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        timestamp: new Date().toISOString(),
      })

      const isTimeout = error instanceof ClaudeTimeoutError
      const isParse = error instanceof ClaudeParseError
      const isValidation = error instanceof ClaudeValidationError
      const isApiError = error instanceof ClaudeApiError

      const retryableApiStatus =
        isApiError &&
        typeof error.status === 'number' &&
        [429, 500, 502, 503, 504].includes(error.status)

      const shouldRetry = isTimeout || isParse || isValidation || retryableApiStatus

      if (!shouldRetry || attempt === maxRetries) {
        throw error
      }

      await backoff(attempt)
    }
  }
  throw new ClaudeApiError('Failed to call Claude')
}

