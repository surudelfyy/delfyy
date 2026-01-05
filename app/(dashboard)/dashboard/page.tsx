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
  outcome?: 'pending' | 'worked' | 'didnt_work' | null
}

type Stats = { total: number; worked: number; didntWork: number }

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

  let stats: Stats = { total: 0, worked: 0, didntWork: 0 }
  const { data: statsData, error: statsError } = await supabase
    .from('decisions')
    .select('outcome')
    .eq('user_id', user.id)
    .eq('status', 'complete')
  if (!statsError && Array.isArray(statsData)) {
    const total = statsData.length
    const worked = statsData.filter((d) => d.outcome === 'worked').length
    const didntWork = statsData.filter((d) => d.outcome === 'didnt_work').length
    stats = { total, worked, didntWork }
  }

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select(
      'id, question, decision_card, status, created_at, check_in_date, check_in_outcome, winning_outcome, input_context, outcome',
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
    <div className="py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">
          Decisions
        </h1>
        <Link
          href="/decide"
          className="bg-zinc-50 text-zinc-950 text-sm font-medium px-4 py-2 sm:py-2 rounded-sm border border-zinc-50 hover:bg-zinc-200 text-center sm:text-left whitespace-nowrap"
        >
          + New decision
        </Link>
      </div>

      {stats.total > 0 && (
        <p className="text-xs sm:text-sm text-zinc-500 mb-4 sm:mb-6">
          {stats.total} decision{stats.total !== 1 ? 's' : ''} · {stats.worked}{' '}
          successful · {stats.didntWork} failed
        </p>
      )}

      {sortedDecisions.length > 0 ? (
        <DecisionList decisions={sortedDecisions as DecisionRowType[]} />
      ) : (
        <div className="border border-dashed border-zinc-800 py-8 sm:py-12 text-center rounded-sm">
          <p className="mb-4 text-zinc-500 text-sm sm:text-base">
            No decisions yet
          </p>
          <Link
            href="/decide"
            className="text-zinc-50 hover:underline text-sm sm:text-base"
          >
            Make your first decision →
          </Link>
        </div>
      )}
    </div>
  )
}
