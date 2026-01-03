import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Next.js 16 RouteContext signature
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: decision, error } = await supabase
    .from('decisions')
    .select(
      'id, status, question, decision_memo, confidence_tier, input_context, created_at',
    )
    .eq('id', id)
    .single()

  if (error || !decision) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(decision)
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: decisionId } = await ctx.params

  const parsed = z.string().uuid().safeParse(decisionId)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid decision ID' }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('id', decisionId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[delete-decision] Error:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id: decisionId } = await ctx.params

    const parsed = z.string().uuid().safeParse(decisionId)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid decision ID format' },
        { status: 400 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const accepted_steps = (body as { accepted_steps?: unknown }).accepted_steps

    if (!Array.isArray(accepted_steps)) {
      return NextResponse.json(
        { error: 'accepted_steps must be an array' },
        { status: 400 },
      )
    }

    if (!accepted_steps.every((step) => typeof step === 'string')) {
      return NextResponse.json(
        { error: 'accepted_steps must contain only strings' },
        { status: 400 },
      )
    }

    if (accepted_steps.length > 20) {
      return NextResponse.json(
        { error: 'accepted_steps cannot exceed 20 items' },
        { status: 400 },
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const committed_at = new Date().toISOString()

    const { data, error: updateError } = await supabase
      .from('decisions')
      .update({ committed_at, accepted_steps })
      .eq('id', decisionId)
      .eq('user_id', user.id)
      .select('id, committed_at, accepted_steps')
      .single()

    if (updateError) {
      console.error('[PATCH /api/decisions] Update failed:', updateError)
      return NextResponse.json(
        { error: 'Failed to update decision' },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Decision not found or access denied' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      decision: {
        id: data.id,
        committed_at: data.committed_at,
        accepted_steps: data.accepted_steps,
      },
    })
  } catch (error) {
    console.error('[PATCH /api/decisions] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
