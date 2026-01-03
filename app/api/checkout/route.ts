import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const priceId = process.env.STRIPE_PRICE_ID
const appUrl = process.env.NEXT_PUBLIC_APP_URL

const stripe =
  stripeSecretKey && priceId && appUrl
    ? new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      })
    : null

export async function POST() {
  if (!stripe || !priceId || !appUrl) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 500 },
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('has_lifetime_access')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.has_lifetime_access) {
    return NextResponse.json(
      { error: 'Already have lifetime access' },
      { status: 400 },
    )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
    },
  })

  return NextResponse.json({ url: session.url })
}
