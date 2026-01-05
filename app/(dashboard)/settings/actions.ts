'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PAID_CONTEXT_LIMIT } from '@/lib/subscription'

export async function saveDefaultContext(
  context: string,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }
  if (context.length > PAID_CONTEXT_LIMIT)
    return { error: `Max ${PAID_CONTEXT_LIMIT} characters` }

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
