# Stripe Integration (MVP)

## Flow

1. `NewDecisionButton` checks `/api/usage` — blocks at 3 completed decisions for free tier.
2. Paywall modal → “Upgrade” calls `/api/stripe/checkout`.
3. Stripe Checkout redirects to `/dashboard?upgraded=1&session_id=...`.
4. `UpgradeToastClient` shows success toast and calls `/api/stripe/confirm`.
5. `/api/stripe/confirm` verifies payment and upserts subscription to `active`.

## Env vars

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_YEARLY`

## Database

`subscriptions` table (MVP fields):
- `user_id` (PK, references auth.users)
- `status`
- `customer_id`
- `subscription_id`
- `updated_at`

