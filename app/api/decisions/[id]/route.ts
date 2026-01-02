import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Next.js 16 RouteContext signature
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, status, question, decision_memo, confidence_tier, input_context, created_at, assumption_corrections')
    .eq('id', id)
    .single()

  if (error || !decision) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(decision)
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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

const CorrectionSchema = z.object({
  index: z.number().int().nonnegative(),
  correction: z.string().min(1).max(500),
  original: z.string().min(1).max(500),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: decisionId } = await ctx.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof CorrectionSchema>
  try {
    body = CorrectionSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { index, correction, original } = body

  // Fetch current corrections
  const { data: existing } = await supabase
    .from('decisions')
    .select('assumption_corrections')
    .eq('id', decisionId)
    .eq('user_id', user.id)
    .maybeSingle()

  const current = (existing?.assumption_corrections as Record<string, any>) || {}
  const updated = {
    ...current,
    [index]: {
      original,
      correction,
      corrected_at: new Date().toISOString(),
    },
  }

  const { error } = await supabase
    .from('decisions')
    .update({ assumption_corrections: updated })
    .eq('id', decisionId)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to save correction' }, { status: 500 })
  }

  return NextResponse.json({ success: true, assumption_corrections: updated })
}

