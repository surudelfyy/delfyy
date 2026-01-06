import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/utils/api-auth'

const outcomeSchema = z.object({
  outcome: z.enum(['in_progress', 'successful', 'failed']),
})

type RouteContext = { params: Promise<{ id: string }> }

export const PATCH = withAuth<RouteContext>(async (request, ctx, user) => {
  const { id: decisionId } = await ctx.params

  const idSchema = z.string().uuid()
  const idResult = idSchema.safeParse(decisionId)
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

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('decisions')
    .update({
      outcome: parseResult.data.outcome,
      outcome_marked_at: new Date().toISOString(),
    })
    .eq('id', decisionId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

  return NextResponse.json({ success: true, decision: data })
})
