import { createClient } from '@/lib/supabase/server'

// Limits
export const FREE_CONTEXT_LIMIT = 800
export const PAID_CONTEXT_LIMIT = 2000
export const FREE_DECISION_LIMIT = 3

// Types
export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'

export interface UserSubscription {
  isPaid: boolean
  status: SubscriptionStatus
  expiresAt: string | null
}

/**
 * Get user's subscription status
 * SINGLE SOURCE OF TRUTH for "is this user paid?"
 */
export async function getUserSubscription(
  userId: string,
): Promise<UserSubscription> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (error || !data) {
    return { isPaid: false, status: 'free', expiresAt: null }
  }

  return {
    isPaid: true,
    status: data.status as SubscriptionStatus,
    expiresAt: data.current_period_end,
  }
}

/**
 * Get count of completed decisions
 */
export async function getDecisionCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'complete')

  if (error) return 0
  return count || 0
}

/**
 * Check if user can make a new decision
 */
export function canMakeDecision(
  isPaid: boolean,
  decisionCount: number,
): boolean {
  if (isPaid) return true
  return decisionCount < FREE_DECISION_LIMIT
}

/**
 * Get context character limit
 */
export function getContextLimit(isPaid: boolean): number {
  return isPaid ? PAID_CONTEXT_LIMIT : FREE_CONTEXT_LIMIT
}
