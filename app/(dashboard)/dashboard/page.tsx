import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DecisionList } from '@/components/decision-list'

type DecisionRowType = {
  id: string
  question: string
  decision_card: unknown
  status: string
  created_at: string
  check_in_date: string | null
  check_in_outcome: string | null
  winning_outcome?: string | null
  input_context?: Record<string, unknown>
}

type Stats = { total: number; held: number; pivoted: number; due: number }

async function fetchUsage() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/usage`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await fetchUsage()

  let stats: Stats = { total: 0, held: 0, pivoted: 0, due: 0 }
  const { data: statsData, error: statsError } =
    await supabase.rpc('get_decision_stats')
  if (!statsError && Array.isArray(statsData) && statsData[0]) {
    stats = (statsData[0] as Stats) ?? stats
  }

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select(
      'id, question, decision_card, status, created_at, check_in_date, check_in_outcome, winning_outcome, input_context',
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch decisions:', error.message)
  }

  const sortedDecisions = [...(decisions || [])].sort((a, b) => {
    if (a.status !== 'complete' && b.status === 'complete') return 1
    if (a.status === 'complete' && b.status !== 'complete') return -1

    const now = new Date()
    const aDue =
      a.check_in_outcome === 'pending' &&
      a.check_in_date &&
      new Date(a.check_in_date) <= now
    const bDue =
      b.check_in_outcome === 'pending' &&
      b.check_in_date &&
      new Date(b.check_in_date) <= now
    if (aDue && !bDue) return -1
    if (!aDue && bDue) return 1

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-zinc-50">Decisions</h1>
          <Link
            href="/decide"
            className="bg-zinc-50 text-zinc-950 text-sm font-medium px-4 py-2 rounded-none border border-zinc-50 hover:bg-zinc-200"
          >
            + New decision
          </Link>
        </div>

        {stats.total > 0 && (
          <p className="text-sm text-zinc-500 mb-6">
            {stats.total} decision{stats.total !== 1 ? 's' : ''} · {stats.held}{' '}
            worked · {stats.pivoted} didn&apos;t work
            {stats.due > 0
              ? ` · ${stats.due} check-in${stats.due !== 1 ? 's' : ''} due`
              : ''}
          </p>
        )}

        {sortedDecisions.length > 0 ? (
          <DecisionList decisions={sortedDecisions as DecisionRowType[]} />
        ) : (
          <div className="border border-dashed border-zinc-800 py-12 text-center rounded-none">
            <p className="mb-4 text-zinc-500">No decisions yet</p>
            <Link href="/decide" className="text-zinc-50 hover:underline">
              Make your first decision →
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
