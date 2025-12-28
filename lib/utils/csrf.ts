import { NextRequest } from 'next/server'

type OriginCheckResult = { ok: true } | { ok: false; reason: string }

function normalizeOrigin(url?: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function getAllowedOrigins(): string[] {
  const origins = new Set<string>()

  const appUrl = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL)
  if (appUrl) origins.add(appUrl)

  // VERCEL_URL is auto-set by Vercel on all deployments (preview + prod)
  const vercelUrl = normalizeOrigin(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  )
  if (vercelUrl) origins.add(vercelUrl)

  if (process.env.NODE_ENV === 'development') {
    origins.add('http://localhost:3000')
    origins.add('http://127.0.0.1:3000')
  }

  return Array.from(origins)
}

function isAllowed(origin: string | null, allowed: string[]): boolean {
  if (!origin) return false
  return allowed.includes(origin)
}

// MVP: Simple origin check. Consider SameSite cookies + CSRF tokens for stricter protection.
export function verifyOrigin(request: NextRequest): OriginCheckResult {
  const allowedOrigins = getAllowedOrigins()
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (isAllowed(origin, allowedOrigins)) {
    return { ok: true }
  }

  const refererOrigin = normalizeOrigin(referer)
  if (isAllowed(refererOrigin, allowedOrigins)) {
    return { ok: true }
  }

  return { ok: false, reason: 'Origin not allowed' }
}

