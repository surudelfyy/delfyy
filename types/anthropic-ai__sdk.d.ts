declare module '@anthropic-ai/sdk' {
  export type ClaudeMessageRole = 'user' | 'assistant'

  export type ClaudeMessageContentBlock =
    | { type: 'text'; text: string }
    | { type: string; [key: string]: unknown }

  export type ClaudeMessageCreateParams = {
    model: string
    system: string
    messages: Array<{ role: ClaudeMessageRole; content: string }>
    temperature?: number
    max_tokens?: number
  }

  export interface ClaudeMessagesClient {
    create: (
      params: ClaudeMessageCreateParams,
      options?: { signal?: AbortSignal }
    ) => Promise<{ content: ClaudeMessageContentBlock[] }>
  }

  export default class Anthropic {
    constructor(config: { apiKey?: string })
    messages: ClaudeMessagesClient
  }
}

