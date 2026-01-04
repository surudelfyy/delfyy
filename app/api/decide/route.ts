import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { runPipeline } from '@/lib/delphi/orchestrator'
import { sendProgress, startHeartbeat } from '@/lib/utils/sse'
import { rateLimit } from '@/lib/utils/rate-limit'
import { getUserTier } from '@/lib/billing/getUserTier'
import {
  enforceDecisionLimits,
  LimitError,
} from '@/lib/limits/validate-decision'
import {
  QUESTION_MAX,
  PER_DECISION_CONTEXT_MAX,
  ERROR_MESSAGES,
} from '@/lib/limits/decisionLimits'

const RequestSchema = z.object({
  question: z.string().min(10).max(QUESTION_MAX),
  context: z
    .object({
      stage: z.enum(['discovery', 'build', 'launch', 'growth']).optional(),
      traction: z.string().optional(),
      goal: z.string().optional(),
      constraints: z.array(z.string()).optional(),
      risk_tolerance: z.string().optional(),
      what_tried: z.string().optional(),
      deadline: z.string().optional(),
      bad_decision_signal: z.string().optional(),
      freeform: z.string().max(PER_DECISION_CONTEXT_MAX).optional(),
    })
    .optional(),
  user_level_hint: z
    .enum(['strategy', 'product', 'design_ux', 'operations'])
    .nullable()
    .optional(),
  winning_outcome: z.string().max(500).nullish(),
  check_in_date: z.string().datetime().nullish(),
  idempotency_key: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // 1. Size check
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 50_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  // 2. Auth
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2b. Resolve tier
  const tierResult = await getUserTier(user.id)

  // 3. Rate limit
  const rate = await rateLimit(user.id, 10, 60_000)
  if (!rate.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // 4. Parse + validate
  let body: z.infer<typeof RequestSchema>
  try {
    body = RequestSchema.parse(await request.json())
  } catch {
    return NextResponse.json(
      { error: { message: 'Invalid request body' } },
      { status: 400 },
    )
  }

  // 4b. Validate question contains letters
  if (!/[A-Za-z]/.test(body.question || '')) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_INVALID_QUESTION',
          message: ERROR_MESSAGES.VALIDATION_INVALID_QUESTION,
        },
      },
      { status: 400 },
    )
  }

  // 4c. Count completed decisions
  const { count: completedCount, error: countError } = await supabase
    .from('decisions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['complete', 'completed'])

  if (countError) {
    return NextResponse.json(
      { error: { message: 'Failed to check usage' } },
      { status: 500 },
    )
  }

  // 4d. Optional default context from profiles if present (best-effort)
  let defaultContext: string | null = null
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_context')
      .maybeSingle()
    if (profile && typeof profile.default_context === 'string') {
      defaultContext = profile.default_context
    }
  } catch (err) {
    console.error('profile default_context fetch failed', err)
  }

  // 4e. Enforce limits
  try {
    enforceDecisionLimits({
      tier: tierResult.tier,
      completedDecisions: completedCount || 0,
      question: body.question,
      contextFreeform: body.context?.freeform,
      defaultContext,
    })
  } catch (err) {
    if (err instanceof LimitError) {
      const status = err.code === 'LIMIT_PAYWALL' ? 402 : 400
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status },
      )
    }
    return NextResponse.json(
      { error: { message: 'Validation failed' } },
      { status: 400 },
    )
  }

  // 5. Idempotency check
  if (body.idempotency_key) {
    const { data: existing } = await supabase
      .from('decisions')
      .select('id, status, decision_card, confidence_tier')
      .eq('user_id', user.id)
      .eq('idempotency_key', body.idempotency_key)
      .single()

    if (existing) {
      if (existing.status === 'running') {
        return NextResponse.json(
          { error: 'Decision already in progress', decision_id: existing.id },
          { status: 409 },
        )
      }
      if (existing.status === 'complete') {
        return NextResponse.json({
          decision_id: existing.id,
          decision_card: existing.decision_card,
          confidence_tier: existing.confidence_tier,
          cached: true,
        })
      }
      // failed → allow retry
    }
  }

  // 6. Combine contexts
  const combinedFreeform =
    [defaultContext, body.context?.freeform].filter(Boolean).join('\n\n') ||
    null

  // 7. Create decision row (RLS)
  const { data: decision, error: insertError } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      status: 'running',
      question: body.question,
      input_context: {
        ...(body.context || {}),
        freeform: combinedFreeform,
      },
      user_level_hint: body.user_level_hint ?? null,
      winning_outcome: body.winning_outcome ?? null,
      idempotency_key: body.idempotency_key || null,
    })
    .select('id')
    .single()

  if (insertError || !decision) {
    return NextResponse.json(
      { error: 'Failed to create decision' },
      { status: 500 },
    )
  }

  // 8. Service client for background writes
  const serviceClient = createServiceClient()

  // 9. SSE stream
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const heartbeat = startHeartbeat(writer)
  let closed = false
  const closeWriter = () => {
    if (closed) return
    closed = true
    try {
      writer.close()
    } catch {
      // ignore
    }
  }
  request.signal.addEventListener('abort', () => {
    clearInterval(heartbeat)
    closeWriter()
  })
  const encoder = new TextEncoder()
  const safeWrite = async (chunk: string) => {
    if (request.signal.aborted) return
    try {
      await writer.write(encoder.encode(chunk))
    } catch {
      // ignore
    }
  }

  // 9. Run pipeline background
  ;(async () => {
    try {
      const result = await runPipeline(
        decision.id,
        serviceClient,
        (step, message) => {
          void sendProgress(writer, step, message)
        },
      )

      await safeWrite(
        `event: result\ndata: ${JSON.stringify({ decision_id: result.id })}\n\n`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pipeline failed'
      await safeWrite(
        `event: error\ndata: ${JSON.stringify({ code: 'PIPELINE_FAILED', message })}\n\n`,
      )
    } finally {
      clearInterval(heartbeat)
      closeWriter()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Content-Encoding': 'none',
      'X-Accel-Buffering': 'no',
    },
  })
}
