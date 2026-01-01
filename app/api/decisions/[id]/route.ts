import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
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

