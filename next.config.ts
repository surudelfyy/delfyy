import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV !== 'production'

const csp = [
  // Fallback for unlisted directives
  "default-src 'self'",

  // Scripts: unsafe-inline needed for React/Next.js hydration
  // TODO: Implement nonces in v2 to remove unsafe-inline
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,

  // Styles: unsafe-inline needed for Tailwind/CSS-in-JS
  "style-src 'self' 'unsafe-inline'",

  // Images: restrict to self and Supabase storage
  "img-src 'self' data: https://*.supabase.co",

  // Fonts: self only (Geist bundled via next/font)
  "font-src 'self'",

  // API connections: Supabase, Claude, Vercel Analytics
  "connect-src 'self' https://api.anthropic.com https://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com",

  // Frame embedding: completely blocked
  "frame-src 'none'",
  "frame-ancestors 'none'",

  // Forms: only submit to same origin (prevents form hijacking)
  "form-action 'self'",

  // Base URI: prevent base tag injection
  "base-uri 'self'",

  // Plugins: block Flash/Java/etc
  "object-src 'none'",

  // Workers: same origin only
  "worker-src 'self'",

  // Manifest: same origin only
  "manifest-src 'self'",

  // Upgrade HTTP to HTTPS
  'upgrade-insecure-requests',
].join('; ')

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ]
  },
}

export default nextConfig
