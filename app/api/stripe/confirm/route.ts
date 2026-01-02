import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'

const stripeSecret = process.env.STRIPE_SECRET_KEY

export async function POST(request: NextRequest) {
  if (!stripeSecret) {
    return NextResponse.json({ error: { message: 'Stripe not configured' } }, { status: 500 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 })
  }

  const { session_id } = await request.json().catch(() => ({} as { session_id?: string }))
  if (!session_id) {
    return NextResponse.json({ error: { message: 'Missing session_id' } }, { status: 400 })
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-11-20' })
  const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] })

  if (!session || session.metadata?.user_id !== user.id) {
    return NextResponse.json({ error: { message: 'Invalid session' } }, { status: 400 })
  }

  const isPaid = session.payment_status === 'paid' || session.status === 'complete'
  if (!isPaid) {
    return NextResponse.json({ error: { message: 'Payment not completed' } }, { status: 400 })
  }

  const subscription = session.subscription as Stripe.Subscription | null
  const status = subscription?.status || 'active'
  const customer = session.customer as string | Stripe.Customer | null
  const customerId = typeof customer === 'string' ? customer : customer?.id
  const subscriptionId = subscription?.id

  const { error: upsertError } = await supabase.from('subscriptions').upsert(
    {
      user_id: user.id,
      status,
      customer_id: customerId ?? null,
      subscription_id: subscriptionId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (upsertError) {
    return NextResponse.json({ error: { message: 'Failed to persist subscription' } }, { status: 500 })
  }

  return NextResponse.json({ success: true, status })
}

