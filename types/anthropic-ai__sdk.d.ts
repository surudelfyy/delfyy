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
      _params: ClaudeMessageCreateParams,
      _options?: { signal?: AbortSignal },
    ) => Promise<{ content: ClaudeMessageContentBlock[] }>
  }

  export default class Anthropic {
    constructor(_config: { apiKey?: string })
    messages: ClaudeMessagesClient
  }
}
