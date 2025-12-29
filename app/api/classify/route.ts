import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  validationError,
  unauthorizedError,
  payloadTooLargeError,
  badRequestError,
  rateLimitError,
  csrfError,
  internalServerError,
} from '@/lib/utils/api-error'
import { rateLimit } from '@/lib/utils/rate-limit'
import { verifyOrigin } from '@/lib/utils/csrf'
import { logRateLimitHit, logValidationFailure } from '@/lib/utils/audit-log'
import { classify } from '@/lib/claude/classifier'

const MAX_PAYLOAD_SIZE = 20_000

const BodySchema = z.object({
  question: z.string().min(1),
  context: z
    .object({
      stage: z.string().optional(),
      traction: z.string().optional(),
      goal: z.string().optional(),
      constraints: z.array(z.string()).optional(),
      risk_tolerance: z.string().optional(),
      what_tried: z.string().optional(),
      deadline: z.string().optional(),
      bad_decision_signal: z.string().optional(),
    })
    .optional()
    .default({}),
})

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

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

  // 3. Rate limit (before JSON parse)
  const { success } = await rateLimit(user.id, 10, 60_000)
  if (!success) {
    logRateLimitHit(user.id, request, { requestId })
    return rateLimitError()
  }

  // 4. CSRF/origin validation
  const originCheck = verifyOrigin(request)
  if (!originCheck.ok) {
    return csrfError()
  }

  // 5. Parse JSON
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestError('Invalid JSON')
  }

  // 6. Zod validation
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    logValidationFailure(request, parsed.error, { requestId })
    return validationError(parsed.error)
  }

  // 7. Call classifier (NO idempotency needed for classify)
  try {
    const result = await classify({
      question: parsed.data.question,
      context: parsed.data.context,
    })

    return NextResponse.json(result, {
      status: 200,
      headers: { 'X-Request-Id': requestId },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Classification failed'
    return internalServerError(errorMessage)
  }
}
