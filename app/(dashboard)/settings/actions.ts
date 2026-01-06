'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserTier } from '@/lib/billing/getUserTier'
import { FREE_CONTEXT_LIMIT, PAID_CONTEXT_LIMIT } from '@/lib/subscription'

export async function saveDefaultContext(
  context: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check tier and apply correct limit
  const { tier } = await getUserTier(user.id)
  const limit = tier === 'paid' ? PAID_CONTEXT_LIMIT : FREE_CONTEXT_LIMIT

  if (context.length > limit)
    return { error: `Context exceeds ${limit} character limit` }

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      default_context: context,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'id',
    },
  )

  if (error) {
    console.error('Failed to save default_context:', error)
    return { error: 'Failed to save' }
  }

  revalidatePath('/settings')
  return { success: true }
}
