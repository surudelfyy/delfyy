import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, status, question, decision_memo, confidence_tier, input_context, created_at')
    .eq('id', params.id)
    .single()

  if (error || !decision) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(decision)
}

