declare module 'stripe' {
  // Minimal fallback type to satisfy TS in environments without Stripe types.
  // Replace with real types when available.
  export default class Stripe {
    constructor(_secretKey: string, _opts: { apiVersion: string })
    webhooks: {
      constructEvent: (
        _body: string | Buffer,
        _signature: string,
        _secret: string,
      ) => unknown
    }
    checkout: {
      sessions: {
        create: (_params: Record<string, unknown>) => Promise<{
          url?: string | null
          customer?: string | null
          metadata?: Record<string, string>
        }>
      }
    }
  }
}
