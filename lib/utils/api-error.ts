import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

const isDev = process.env.NODE_ENV === 'development'

export function validationError(error: ZodError) {
  const details = error.flatten()
  console.error('[Validation Error]', JSON.stringify(details))

  return NextResponse.json(
    {
      error: 'Invalid request',
      ...(isDev ? { details } : {}),
    },
    { status: 400 }
  )
}

export function unauthorizedError() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function payloadTooLargeError() {
  return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
}

export function badRequestError(message: string = 'Bad request') {
  console.error('[Bad Request]', message)

  return NextResponse.json(
    {
      error: isDev ? message : 'Bad request',
    },
    { status: 400 }
  )
}

export function rateLimitError() {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}

export function idempotencyInProgressError() {
  return NextResponse.json({ error: 'Request already in progress' }, { status: 409 })
}

export function internalServerError(message?: string) {
  if (message) {
    console.error('[Internal Server Error]', message)
  }
  return NextResponse.json(
    { error: isDev && message ? message : 'Internal server error' },
    { status: 500 }
  )
}

