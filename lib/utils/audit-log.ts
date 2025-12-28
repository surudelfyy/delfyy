import { NextRequest } from 'next/server'

type AuditEvent = {
  event:
    | 'auth_success'
    | 'auth_failure'
    | 'rate_limit_hit'
    | 'validation_failure'
    | 'decision_started'
    | 'decision_completed'
    | 'decision_failed'
  userId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  timestamp: string
}

// MVP: Console logging. Replace with proper logging service (Axiom, Datadog, etc.) before scale.
export function auditLog(event: AuditEvent): void {
  console.log('[AUDIT]', JSON.stringify(event))
}

type RequestInfo = { ip?: string; userAgent?: string; path?: string }

type Metadata = Record<string, unknown>

function getRequestInfo(request: NextRequest): RequestInfo {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor
    ? forwardedFor.split(',')[0]?.trim()
    : realIp ?? undefined

  const userAgent = request.headers.get('user-agent') ?? undefined
  const path = request.nextUrl.pathname

  return { ip, userAgent, path }
}

export function logAuthSuccess(userId: string, request: NextRequest, metadata?: Metadata): void {
  const info = getRequestInfo(request)
  auditLog({
    event: 'auth_success',
    userId,
    ...info,
    metadata,
    timestamp: new Date().toISOString(),
  })
}

export function logAuthFailure(request: NextRequest, reason: string, metadata?: Metadata): void {
  const info = getRequestInfo(request)
  auditLog({
    event: 'auth_failure',
    ...info,
    metadata: { reason, ...(metadata ?? {}) },
    timestamp: new Date().toISOString(),
  })
}

export function logRateLimitHit(
  userId: string,
  request: NextRequest,
  metadata?: Metadata
): void {
  const info = getRequestInfo(request)
  auditLog({
    event: 'rate_limit_hit',
    userId,
    ...info,
    metadata,
    timestamp: new Date().toISOString(),
  })
}

export function logValidationFailure(
  request: NextRequest,
  errors: unknown,
  metadata?: Metadata
): void {
  const info = getRequestInfo(request)
  auditLog({
    event: 'validation_failure',
    ...info,
    metadata: { errors, ...(metadata ?? {}) },
    timestamp: new Date().toISOString(),
  })
}

export function logDecisionStarted(
  userId: string,
  decisionId: string,
  metadata?: Metadata
): void {
  auditLog({
    event: 'decision_started',
    userId,
    metadata: { decisionId, ...(metadata ?? {}) },
    timestamp: new Date().toISOString(),
  })
}

export function logDecisionCompleted(userId: string, decisionId: string): void {
  auditLog({
    event: 'decision_completed',
    userId,
    metadata: { decisionId },
    timestamp: new Date().toISOString(),
  })
}

export function logDecisionFailed(userId: string, decisionId: string, error: string): void {
  auditLog({
    event: 'decision_failed',
    userId,
    metadata: { decisionId, error },
    timestamp: new Date().toISOString(),
  })
}

