import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { decideRequestSchema } from '@/lib/schemas/decide'
import {
  validationError,
  unauthorizedError,
  payloadTooLargeError,
  badRequestError,
  rateLimitError,
  csrfError,
  idempotencyInProgressError,
  internalServerError,
} from '@/lib/utils/api-error'
import { rateLimit } from '@/lib/utils/rate-limit'
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  failIdempotentRequest,
} from '@/lib/utils/idempotency'
import {
  logRateLimitHit,
  logValidationFailure,
  logDecisionStarted,
} from '@/lib/utils/audit-log'
import { verifyOrigin } from '@/lib/utils/csrf'

const MAX_PAYLOAD_SIZE = 20_000
const uuidSchema = z.string().uuid()

export async function POST(request: NextRequest) {
  // 1. Size check
  const contentLength = request.headers.get('content-length')
  const size = Number(contentLength)

  if (Number.isFinite(size) && size > MAX_PAYLOAD_SIZE) {
    return payloadTooLargeError()
  }

  const requestId = randomUUID()

  // 2. Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthorizedError()
  }

  // 3. Rate limit
  const { success } = rateLimit(user.id, 10, 60_000)
  if (!success) {
    logRateLimitHit(user.id, request, { requestId })
    const response = rateLimitError()
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  // 4. CSRF check
  const originCheck = verifyOrigin(request)
  if (!originCheck.ok) {
    const response = csrfError()
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  // 4. Parse JSON
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestError('Invalid JSON')
  }

  // 5. Zod validation
  const parsed = decideRequestSchema.safeParse(body)
  if (!parsed.success) {
    logValidationFailure(request, parsed.error, { requestId })
    const response = validationError(parsed.error)
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  const { question, context } = parsed.data

  // 6. Idempotency check
  // Header takes precedence over body field
  const headerKey = request.headers.get('idempotency-key')
  let idempotencyKey: string | undefined

  if (headerKey) {
    const uuidParsed = uuidSchema.safeParse(headerKey)
    if (!uuidParsed.success) {
      return badRequestError('Invalid Idempotency-Key')
    }
    idempotencyKey = uuidParsed.data
  } else if (parsed.data.idempotency_key) {
    idempotencyKey = parsed.data.idempotency_key
  }

  if (idempotencyKey) {
    const result = await beginIdempotentRequest(supabase, user.id, idempotencyKey)

    if (result.action === 'return') {
      const response = NextResponse.json(result.response, { status: 200 })
      response.headers.set('X-Request-Id', requestId)
      return response
    }

    if (result.action === 'in_progress') {
      const response = idempotencyInProgressError()
      response.headers.set('X-Request-Id', requestId)
      return response
    }

    if (result.action === 'error') {
      const response = internalServerError(result.message)
      response.headers.set('X-Request-Id', requestId)
      return response
    }

    // result.action === 'retry' or 'process': continue to business logic
  }

  const decisionId = idempotencyKey ?? 'unknown'
  logDecisionStarted(user.id, decisionId, { requestId })

  // 7. Business logic (TODO: implement decision pipeline)
  try {
    const responseData = {
      message: 'Not implemented yet',
      user_id: user.id,
      question,
    }

    // Complete idempotency record on success
    if (idempotencyKey) {
      await completeIdempotentRequest(supabase, user.id, idempotencyKey, responseData)
    }

    const response = NextResponse.json(responseData, { status: 501 })
    response.headers.set('X-Request-Id', requestId)
    return response
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    // Mark idempotency record as failed
    if (idempotencyKey) {
      await failIdempotentRequest(supabase, user.id, idempotencyKey, errorMessage)
    }

    const response = internalServerError(errorMessage)
    response.headers.set('X-Request-Id', requestId)
    return response
  }
}
