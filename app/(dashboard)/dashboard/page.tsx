import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type DecisionRowType = {
  id: string
  question: string
  decision_card: unknown
  status: string
  created_at: string
  check_in_date: string | null
  check_in_outcome: string | null
  winning_outcome?: string | null
}

type Stats = { total: number; held: number; pivoted: number; due: number }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Stats via RPC if available; fallback to zeros
  let stats: Stats = { total: 0, held: 0, pivoted: 0, due: 0 }
  const { data: statsData, error: statsError } = await supabase.rpc('get_decision_stats')
  if (!statsError && Array.isArray(statsData) && statsData[0]) {
    stats = (statsData[0] as Stats) ?? stats
  }

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select('id, question, decision_card, status, created_at, check_in_date, check_in_outcome, winning_outcome')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch decisions:', error.message)
  }

  const sortedDecisions = [...(decisions || [])].sort((a, b) => {
    // completed vs processing
    if (a.status !== 'complete' && b.status === 'complete') return 1
    if (a.status === 'complete' && b.status !== 'complete') return -1

    const now = new Date()
    const aDue = a.check_in_outcome === 'pending' && a.check_in_date && new Date(a.check_in_date) <= now
    const bDue = b.check_in_outcome === 'pending' && b.check_in_date && new Date(b.check_in_date) <= now
    if (aDue && !bDue) return -1
    if (!aDue && bDue) return 1

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="container max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
        <Link
          href="/decide"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          + New decision
        </Link>
      </div>

      {stats.total > 0 && (
        <div className="mb-6 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span>
              <span className="font-semibold">{stats.total}</span>
              <span className="ml-1 text-muted-foreground">decision{stats.total !== 1 ? 's' : ''}</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              <span className="font-semibold text-green-600">{stats.held}</span>
              <span className="ml-1 text-muted-foreground">held</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              <span className="font-semibold text-amber-600">{stats.pivoted}</span>
              <span className="ml-1 text-muted-foreground">pivoted</span>
            </span>
            {stats.due > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium text-amber-600">
                  {stats.due} check-in{stats.due !== 1 ? 's' : ''} due
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {sortedDecisions.length > 0 ? (
        <div className="space-y-3">
          {sortedDecisions.map((decision) => (
            <DecisionRow key={decision.id} decision={decision} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="mb-4 text-muted-foreground">No decisions yet</p>
          <Link href="/decide" className="text-primary hover:underline">
            Make your first decision →
          </Link>
        </div>
      )}
    </div>
  )
}

function DecisionRow({ decision }: { decision: DecisionRowType }) {
  const recommendation =
    typeof decision.decision_card === 'object' &&
    decision.decision_card !== null &&
    'decision' in decision.decision_card
      ? (decision.decision_card as { decision?: string }).decision
      : null

  const createdDate = new Date(decision.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  return (
    <Link
      href={`/decisions/${decision.id}`}
      className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">{recommendation || decision.question}</p>
          {recommendation && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{decision.question}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{createdDate}</p>
        </div>
        <div className="flex-shrink-0">
          <StatusBadge decision={decision} />
        </div>
      </div>
    </Link>
  )
}

function StatusBadge({ decision }: { decision: DecisionRowType }) {
  if (decision.status !== 'complete') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        Processing
      </span>
    )
  }

  if (decision.check_in_outcome === 'held') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        ✓ Held
      </span>
    )
  }

  if (decision.check_in_outcome === 'pivoted') {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        ↻ Pivoted
      </span>
    )
  }

  if (decision.check_in_date) {
    const checkInDate = new Date(decision.check_in_date)
    const now = new Date()
    if (checkInDate <= now) {
      return (
        <Link
          href={`/decisions/${decision.id}/check-in`}
          className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200"
        >
          Check in →
        </Link>
      )
    }
    const diffDays = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
        {diffDays}d
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
      —
    </span>
  )
}
