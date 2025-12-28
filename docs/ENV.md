# Environment Variables

Required for rate limiting (set in `.env.local`, do not commit):
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST token

Required for CSRF checks:
- `NEXT_PUBLIC_APP_URL` — canonical app origin (e.g., https://askdelfyy.com)

Optional (auto-set on Vercel):
- `VERCEL_URL` — used to allow preview/prod origins server-side

Do not commit secrets. Keep actual values in `.env.local` (git-ignored).
