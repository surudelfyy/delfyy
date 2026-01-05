declare module '@upstash/ratelimit' {
  export class Ratelimit {
    constructor(_config: { redis: unknown; limiter: unknown })
    limit(_identifier: string): Promise<{ success: boolean; remaining: number }>
    static slidingWindow(_limit: number, _interval: string): unknown
  }
}
