import { createClient } from '@/lib/supabase/server'

const FREE_DECISION_LIMIT = 3

export async function checkAccess(): Promise<{
  canCreateDecision: boolean
  hasLifetimeAccess: boolean
  decisionsUsed: number
  decisionsRemaining: number
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      canCreateDecision: false,
      hasLifetimeAccess: false,
      decisionsUsed: 0,
      decisionsRemaining: 0,
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('has_lifetime_access')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.has_lifetime_access) {
    return {
      canCreateDecision: true,
      hasLifetimeAccess: true,
      decisionsUsed: 0,
      decisionsRemaining: Infinity,
    }
  }

  const { count } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'complete')

  const decisionsUsed = count || 0
  const decisionsRemaining = Math.max(0, FREE_DECISION_LIMIT - decisionsUsed)

  return {
    canCreateDecision: decisionsUsed < FREE_DECISION_LIMIT,
    hasLifetimeAccess: false,
    decisionsUsed,
    decisionsRemaining,
  }
}
