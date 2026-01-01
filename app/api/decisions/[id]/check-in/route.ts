import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const decisionIdSchema = z.string().uuid()

const checkInSchema = z.object({
  outcome: z.enum(['held', 'pivoted', 'too_early']),
  note: z.string().max(1000).optional(),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: rawId } = await params
  const idParsed = decisionIdSchema.safeParse(rawId)
  if (!idParsed.success) {
    return Response.json({ error: 'Invalid decision ID' }, { status: 400 })
  }
  const decisionId = idParsed.data

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data: decision, error: fetchError } = await supabase
    .from('decisions')
    .select('id, user_id, check_in_outcome, check_in_date')
    .eq('id', decisionId)
    .single()

  if (fetchError || !decision) {
    return Response.json({ error: 'Decision not found' }, { status: 404 })
  }

  if (decision.user_id !== user.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (decision.check_in_outcome !== 'pending') {
    return Response.json({ error: 'Check-in already completed' }, { status: 409 })
  }

  const now = new Date().toISOString()
  let updateData: Record<string, unknown>

  if (parsed.data.outcome === 'too_early') {
    const newCheckInDate = new Date()
    newCheckInDate.setDate(newCheckInDate.getDate() + 7)

    updateData = {
      check_in_date: newCheckInDate.toISOString(),
      check_in_note: parsed.data.note || null,
      check_in_email_sent_at: null,
    }
  } else {
    updateData = {
      check_in_outcome: parsed.data.outcome,
      check_in_note: parsed.data.note || null,
      check_in_completed_at: now,
    }
  }

  const { error: updateError } = await supabase
    .from('decisions')
    .update(updateData)
    .eq('id', decisionId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Check-in update failed:', updateError.message)
    return Response.json({ error: 'Failed to save check-in' }, { status: 500 })
  }

  return Response.json({
    success: true,
    outcome: parsed.data.outcome,
    extended: parsed.data.outcome === 'too_early',
    newCheckInDate: parsed.data.outcome === 'too_early' ? (updateData.check_in_date as string) : null,
  })
}

