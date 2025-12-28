import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type RateLimitResult = {
  success: boolean
  remaining: number
}

const redis = Redis.fromEnv()
const limiterCache = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`
  const cached = limiterCache.get(key)
  if (cached) return cached

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
  })

  limiterCache.set(key, limiter)
  return limiter
}

export async function rateLimit(
  userId: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs)
  const result = await limiter.limit(userId)

  return { success: result.success, remaining: result.remaining }
}

