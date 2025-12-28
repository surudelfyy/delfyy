import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'

export type IdempotencyResult =
  | { action: 'process' }
  | { action: 'return'; response: unknown }
  | { action: 'in_progress' }
  | { action: 'retry' }
  | { action: 'error'; message: string }

type IdempotencyRow = {
  status: 'processing' | 'complete' | 'failed'
  response: unknown | null
}

export async function beginIdempotentRequest(
  supabase: SupabaseClient,
  userId: string,
  key: string
): Promise<IdempotencyResult> {
  const { error: insertError } = await supabase.from('idempotency_keys').insert({
    user_id: userId,
    idempotency_key: key,
    status: 'processing',
  })

  if (!insertError) {
    return { action: 'process' }
  }

  const maybePgError = insertError as PostgrestError
  if (maybePgError.code !== '23505') {
    return { action: 'error', message: insertError.message }
  }

  const { data: row, error: fetchError } = await supabase
    .from('idempotency_keys')
    .select('status,response')
    .eq('user_id', userId)
    .eq('idempotency_key', key)
    .maybeSingle<IdempotencyRow>()

  if (fetchError) {
    return { action: 'error', message: fetchError.message }
  }

  if (!row) {
    return { action: 'error', message: 'Idempotency key exists but row not found' }
  }

  if (row.status === 'complete') {
    return { action: 'return', response: row.response }
  }

  if (row.status === 'processing') {
    return { action: 'in_progress' }
  }

  return { action: 'retry' }
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
