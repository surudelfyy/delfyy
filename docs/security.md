# Security Notes (MVP)

Implemented:
- RLS enforced at database layer
- Server-side auth + CSRF protection
- Zod validation on all API inputs
- Idempotency for decision execution
- Rate limiting (MVP)
- Security headers
- Secrets hygiene

Known gaps (intentional):
- Centralised rate limiting (Redis)
- External audit log sink
- Monitoring & alerting
- CSP tightening for production

Rule:
- No new features bypass these guarantees.

