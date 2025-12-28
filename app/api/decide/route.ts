import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decideRequestSchema } from '@/lib/schemas/decide'
import {
  validationError,
  unauthorizedError,
  payloadTooLargeError,
  badRequestError,
  rateLimitError,
} from '@/lib/utils/api-error'
import { rateLimit } from '@/lib/utils/rate-limit'

const MAX_PAYLOAD_SIZE = 20_000

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length')
  const size = Number(contentLength)

  if (Number.isFinite(size) && size > MAX_PAYLOAD_SIZE) {
    return payloadTooLargeError()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return unauthorizedError()
  }

  const { success } = rateLimit(user.id, 10, 60_000)
  if (!success) {
    return rateLimitError()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    return badRequestError('Invalid JSON')
  }

  const parsed = decideRequestSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error)
  }

  const { question, context } = parsed.data

  return NextResponse.json(
    { message: 'Not implemented yet', user_id: user.id, question },
    { status: 501 }
  )
}

