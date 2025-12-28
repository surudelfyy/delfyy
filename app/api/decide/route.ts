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
  idempotencyInProgressError,
  internalServerError,
} from '@/lib/utils/api-error'
import { rateLimit } from '@/lib/utils/rate-limit'
import {
  beginIdempotentRequest,
  completeIdempotentRequest,
  failIdempotentRequest,
} from '@/lib/utils/idempotency'

const MAX_PAYLOAD_SIZE = 20_000
const uuidSchema = z.string().uuid()

export async function POST(request: NextRequest) {
  // 1. Size check
  const contentLength = request.headers.get('content-length')
  const size = Number(contentLength)

  if (Number.isFinite(size) && size > MAX_PAYLOAD_SIZE) {
    return payloadTooLargeError()
  }

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
    return rateLimitError()
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
    return validationError(parsed.error)
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
      return NextResponse.json(result.response, { status: 200 })
    }

    if (result.action === 'in_progress') {
      return idempotencyInProgressError()
    }

    if (result.action === 'error') {
      return internalServerError(result.message)
    }

    // result.action === 'retry' or 'process': continue to business logic
  }

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

    return NextResponse.json(responseData, { status: 501 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'

    // Mark idempotency record as failed
    if (idempotencyKey) {
      await failIdempotentRequest(supabase, user.id, idempotencyKey, errorMessage)
    }

    return internalServerError(errorMessage)
  }
}
