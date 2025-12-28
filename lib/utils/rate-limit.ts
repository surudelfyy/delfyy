const requestsByUser = new Map<string, number[]>()

type RateLimitResult = {
  success: boolean
  remaining: number
}

export function rateLimit(
  userId: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  const timestamps = requestsByUser.get(userId) ?? []

  // Remove timestamps outside the window to keep memory bounded
  const recent = timestamps.filter((ts) => ts > windowStart)

  if (recent.length >= limit) {
    requestsByUser.set(userId, recent) // keep cleaned array
    return { success: false, remaining: 0 }
  }

  recent.push(now)
  requestsByUser.set(userId, recent)

  return { success: true, remaining: limit - recent.length }
}


