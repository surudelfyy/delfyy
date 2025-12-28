import type { SupabaseClient } from '@supabase/supabase-js'

type IdempotencyResult =
  | { action: 'process' }
  | { action: 'return'; response: unknown }
  | { action: 'in_progress' }
  | { action: 'retry' }
  | { action: 'error'; message: string }

interface IdempotencyRow {
  status: 'processing' | 'complete' | 'failed'
  response: unknown
}

export async function beginIdempotentRequest(
  supabase: SupabaseClient,
  userId: string,
  key: string
): Promise<IdempotencyResult> {
  const { error: insertError } = await supabase
    .from('idempotency_keys')
    .insert({
      user_id: userId,
      idempotency_key: key,
      status: 'processing',
    })

  if (!insertError) {
    return { action: 'process' }
  }

  // Unique violation — key already exists
  if (insertError.code === '23505') {
    const { data: existing, error: fetchError } = await supabase
      .from('idempotency_keys')
      .select('status, response')
      .eq('user_id', userId)
      .eq('idempotency_key', key)
      .single<IdempotencyRow>()

    if (fetchError || !existing) {
      return { action: 'error', message: fetchError?.message ?? 'Failed to fetch existing key' }
    }

    if (existing.status === 'complete') {
      return { action: 'return', response: existing.response }
    }

    if (existing.status === 'processing') {
      return { action: 'in_progress' }
    }

    if (existing.status === 'failed') {
      return { action: 'retry' }
    }
  }

  return { action: 'error', message: insertError.message }
}

export async function completeIdempotentRequest(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  response: Record<string, unknown>
): Promise<void> {
  await supabase
    .from('idempotency_keys')
    .update({
      status: 'complete',
      response,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('idempotency_key', key)
}

export async function failIdempotentRequest(
  supabase: SupabaseClient,
  userId: string,
  key: string,
  errorMessage: string
): Promise<void> {
  await supabase
    .from('idempotency_keys')
    .update({
      status: 'failed',
      error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('idempotency_key', key)
}


