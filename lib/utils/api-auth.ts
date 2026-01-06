import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

type RouteContext = { params: Promise<Record<string, string>> }

export function withAuth<T extends RouteContext = RouteContext>(
  handler: (_req: NextRequest, _ctx: T, _user: User) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: T): Promise<Response> => {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    return handler(req, ctx, user)
  }
}
