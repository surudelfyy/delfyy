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
    .select('id, status, question, decision_memo, confidence_tier, input_context, created_at')
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

