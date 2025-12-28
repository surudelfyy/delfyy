declare module '@upstash/ratelimit' {
  export class Ratelimit {
    constructor(config: { redis: unknown; limiter: unknown })
    limit(identifier: string): Promise<{ success: boolean; remaining: number }>
    static slidingWindow(limit: number, interval: string): unknown
  }
}

