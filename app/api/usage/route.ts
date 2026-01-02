import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserTier } from '@/lib/billing/getUserTier'

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

  const { count: completedCount } = await supabase
    .from('decisions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['complete', 'completed'])

  return NextResponse.json({
    tier: tier.tier,
    completedDecisions: completedCount || 0,
    limit: 3,
  })
}

