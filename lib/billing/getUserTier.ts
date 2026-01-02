'use server'

import { createServiceClient } from '@/lib/supabase/service'

export type UserTier = 'free' | 'paid'

type TierResult = { tier: UserTier; reason: string }

const PAID_STATUSES = ['active', 'trialing', 'past_due']

export async function getUserTier(userId: string): Promise<TierResult> {
  const supabase = createServiceClient()

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', userId)
      .in('status', PAID_STATUSES)
      .maybeSingle()

    if (error) {
      return { tier: 'free', reason: `subscriptions_error:${error.code || 'unknown'}` }
    }

    if (data?.status && PAID_STATUSES.includes(data.status)) {
      return { tier: 'paid', reason: `subscription:${data.status}` }
    }

    return { tier: 'free', reason: 'no_active_subscription' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    return { tier: 'free', reason: `subscriptions_exception:${message}` }
  }
}

