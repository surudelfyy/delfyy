import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyRequestSchema } from '@/lib/schemas/classify'
import {
  validationError,
  unauthorizedError,
  payloadTooLargeError,
  badRequestError,
} from '@/lib/utils/api-error'

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

  let body: unknown
  try {
    body = await request.json()
  } catch (err) {
    return badRequestError('Invalid JSON')
  }

  const parsed = classifyRequestSchema.safeParse(body)
  if (!parsed.success) {
    return validationError(parsed.error)
  }

  const { question, context } = parsed.data

  return NextResponse.json(
    { message: 'Not implemented yet', user_id: user.id, question },
    { status: 501 }
  )
}

