import Anthropic from '@anthropic-ai/sdk'
import { type ZodSchema } from 'zod'
import { extractJSON } from '@/lib/utils/json-parser'

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
  process.env.CLAUDE_MODEL_HAIKU || 'claude-haiku-4-5'
export const CLAUDE_MODEL_SONNET =
  process.env.CLAUDE_MODEL_SONNET || 'claude-sonnet-4-5'

let anthropicClient: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is missing. Add it to .env.local')
    }
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

export function getAnthropicClient(): Anthropic {
  return getAnthropic()
}

const DEFAULT_MAX_TOKENS = 2048

type ClaudeMessage = { role: 'user' | 'assistant'; content: string }

type ClaudeCallParams<T> = {
  model: string
  system: string
  messages: ClaudeMessage[]
  schema: ZodSchema<T>
  temperature?: number
  maxTokens?: number
  maxRetries?: number
  timeoutMs?: number
}

function stripCodeFences(s: string): string {
  const t = s.trim()
  if (t.startsWith('```')) {
    return t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim()
  }
  return t
}

async function backoff(attempt: number): Promise<void> {
  const delay = Math.min(1000 * 2 ** attempt, 10_000) + Math.random() * 200
  return new Promise((resolve) => setTimeout(resolve, delay))
}

async function callClaudeOnce<T>(
  model: string,
  system: string,
  messages: ClaudeMessage[],
  schema: ZodSchema<T>,
  temperature: number | undefined,
  maxTokens: number,
  timeoutMs: number
): Promise<{ data: T } | { error: 'parse' | 'validation' | 'timeout' | 'api'; rawText?: string; message?: string; status?: number }> {
  const controller = new AbortController()
  let rejectTimeout: ((reason?: unknown) => void) | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    rejectTimeout = reject
  })
  const timeoutId = setTimeout(() => {
    controller.abort()
    rejectTimeout?.(new ClaudeTimeoutError())
  }, timeoutMs)

  try {
    if (!model) {
      throw new Error('Claude model is not configured')
    }
    const responsePromise = getAnthropic().messages.create(
      {
        model,
        system,
        messages,
        temperature,
        max_tokens: maxTokens,
      },
      { signal: controller.signal }
    )
    const response = (await Promise.race([
      responsePromise,
      timeoutPromise,
    ])) as Awaited<ReturnType<ReturnType<typeof getAnthropic>['messages']['create']>>

    const textContent = response.content
      .map((block: { type: string; text?: string }) => (block.type === 'text' ? block.text ?? '' : ''))
      .join('')
      .trim()

    if (!textContent) {
      return { error: 'parse', rawText: '' }
    }

    const cleanedText = textContent
      .replace(/^```json\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
    const cleaned = stripCodeFences(cleanedText)
    try {
      const json = JSON.parse(cleaned)
      const parsedDirect = schema.safeParse(json)
      if (parsedDirect.success) {
        return { data: parsedDirect.data }
      }
    } catch {
      // fall through to extractor
    }

    const parsed = extractJSON(cleaned, schema)
    if (parsed === null) {
      return { error: 'validation', rawText: textContent }
    }

    return { data: parsed }
  } catch (error) {
    if (error instanceof ClaudeTimeoutError) {
      return { error: 'timeout' }
    }

    const isAbortError = error instanceof Error && error.name === 'AbortError'
    if (isAbortError) {
      return { error: 'timeout' }
    }

    const status =
      typeof (error as { status?: number }).status === 'number'
        ? (error as { status?: number }).status
        : undefined
    const message = error instanceof Error ? error.message : 'Claude API error'

    return { error: 'api', message, status }
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Call Claude with automatic retry and repair message on parse/validation failure.
 * On failure, appends a repair message asking the model to fix its output.
 */
export async function callClaude<T>(params: ClaudeCallParams<T>): Promise<T> {
  const {
    model,
    system,
    messages,
    schema,
    temperature,
    maxTokens = DEFAULT_MAX_TOKENS,
    maxRetries = 1,
    timeoutMs = CLAUDE_TIMEOUT_MS,
  } = params

  let currentMessages = [...messages]
  let lastRawText: string | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const result = await callClaudeOnce(
      model,
      system,
      currentMessages,
      schema,
      temperature,
      maxTokens,
      timeoutMs
    )

    if ('data' in result) {
      return result.data
    }

    console.error({
      model,
      attempt,
      errorType: result.error,
      timestamp: new Date().toISOString(),
    })

    // On parse/validation failure, try repair by appending the bad output + repair instruction
    if ((result.error === 'parse' || result.error === 'validation') && result.rawText) {
      lastRawText = result.rawText

      if (result.error === 'validation') {
        // eslint-disable-next-line no-console
        console.log('Raw response:', result.rawText)
      }

      if (attempt < maxRetries) {
        // Append assistant's bad response and a user repair message
        currentMessages = [
          ...currentMessages,
          { role: 'assistant' as const, content: result.rawText },
          {
            role: 'user' as const,
            content:
              'Your previous response was not valid JSON matching the required schema. Please output ONLY valid JSON with no additional text, markdown, or explanation. Fix any issues and try again.',
          },
        ]
        await backoff(attempt)
        continue
      }
    }

    // On timeout or API error, retry with backoff
    if (result.error === 'timeout' || result.error === 'api') {
      const retryableStatus =
        result.status !== undefined && [429, 500, 502, 503, 504].includes(result.status)

      if (result.error === 'timeout' || retryableStatus) {
        if (attempt < maxRetries) {
          await backoff(attempt)
          continue
        }
      }

      if (result.error === 'api') {
        throw new ClaudeApiError(result.message ?? 'Claude API error', result.status)
      }
      throw new ClaudeTimeoutError()
    }

    // If we get here on last attempt, throw appropriate error
    if (attempt === maxRetries) {
      if (result.error === 'parse') {
        throw new ClaudeParseError()
      }
      if (result.error === 'validation') {
        throw new ClaudeValidationError(
          lastRawText ? `Validation failed. Raw: ${lastRawText.slice(0, 200)}...` : undefined
        )
      }
    }
  }

  throw new ClaudeApiError('Failed to call Claude after retries')
}

// Re-export for backwards compatibility
export { callClaude as callClaudeWithRetry }

// Structured outputs helper (beta)
export async function callClaudeJSON<T>(args: {
  model: string
  max_tokens: number
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  schema: any
}): Promise<T> {
  if (!args.model) throw new Error('Claude model is not configured')
  const client = getAnthropic() as any
  const res = await client.beta.messages.create({
    model: args.model,
    max_tokens: args.max_tokens,
    betas: ['structured-outputs-2025-11-13'],
    system: args.system,
    messages: args.messages,
    output_format: {
      type: 'json_schema',
      schema: args.schema,
    },
  })

  const text = res.content?.[0]?.type === 'text' ? res.content[0].text : ''
  if (!text) {
    throw new Error('Empty response from Claude structured output')
  }
  return JSON.parse(text) as T
}
