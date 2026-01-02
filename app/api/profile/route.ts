import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/billing/getUserTier'
import { DEFAULT_CONTEXT_MAX_FREE, DEFAULT_CONTEXT_MAX_PAID, ERROR_MESSAGES } from '@/lib/limits/decisionLimits'

const PatchSchema = z.object({
  default_context: z.string().max(DEFAULT_CONTEXT_MAX_PAID).nullable().optional(),
})

export async function GET() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  }

  const tier = await getUserTier(user.id)

  const { data: profile } = await supabase.from('profiles').select('default_context').eq('id', user.id).maybeSingle()

  return NextResponse.json({
    default_context: profile?.default_context ?? null,
    tier: tier.tier,
    limits: {
      default_context_max: tier.tier === 'paid' ? DEFAULT_CONTEXT_MAX_PAID : DEFAULT_CONTEXT_MAX_FREE,
    },
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  }

  let body: z.infer<typeof PatchSchema>
  try {
    body = PatchSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: { message: 'Invalid body' } }, { status: 400 })
  }

  const tier = await getUserTier(user.id)
  const max = tier.tier === 'paid' ? DEFAULT_CONTEXT_MAX_PAID : DEFAULT_CONTEXT_MAX_FREE

  if (body.default_context && body.default_context.length > max) {
    return NextResponse.json(
      { error: { code: 'LIMIT_DEFAULT_CONTEXT_TOO_LONG', message: ERROR_MESSAGES.LIMIT_DEFAULT_CONTEXT_TOO_LONG } },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({ default_context: body.default_context || null })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: { message: 'Failed to update profile' } }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

