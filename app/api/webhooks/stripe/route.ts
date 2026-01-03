import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

const stripe =
  stripeSecretKey && webhookSecret
    ? new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      })
    : null

const supabase =
  supabaseUrl && serviceRole
    ? createSupabaseClient(supabaseUrl, serviceRole)
    : null

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret || !supabase) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 },
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: unknown

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const stripeEvent = event as { data?: { object?: unknown }; type?: string }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data?.object as {
      metadata?: { user_id?: string | null }
      customer?: string | null
    }
    const userId = session?.metadata?.user_id

    if (userId) {
      await supabase
        .from('profiles')
        .update({
          has_lifetime_access: true,
          stripe_customer_id: (session.customer as string) ?? null,
          paid_at: new Date().toISOString(),
        })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
