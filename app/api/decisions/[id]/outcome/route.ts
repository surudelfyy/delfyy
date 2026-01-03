import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const outcomeSchema = z.object({
  outcome: z.enum(['pending', 'worked', 'didnt_work']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const idSchema = z.string().uuid()
  const idResult = idSchema.safeParse(params.id)
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid decision ID' }, { status: 400 })
  }

  const body = await request.json()
  const parseResult = outcomeSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid outcome value' },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from('decisions')
    .update({
      outcome: parseResult.data.outcome,
      outcome_marked_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true, decision: data })
}
