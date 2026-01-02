import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient as createServerClient } from '@/lib/supabase/server'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const priceId = process.env.STRIPE_PRICE_ID_YEARLY

export async function POST(request: NextRequest) {
  if (!stripeSecret || !priceId) {
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

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || ''
  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-11-20' })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard`,
    metadata: { user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}

