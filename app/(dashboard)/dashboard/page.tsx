import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DecisionList } from '@/components/decision-list'
import { NewDecisionButton } from '@/components/new-decision-button'
import { UpgradeToastClient } from '@/components/upgrade-toast-client'

type DecisionRowType = {
  id: string
  question: string
  decision_card: unknown
  status: string
  created_at: string
  check_in_date: string | null
  check_in_outcome: string | null
  winning_outcome?: string | null
  input_context?: any
}

type Stats = { total: number; held: number; pivoted: number; due: number }

async function fetchUsage() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/usage`, { cache: 'no-store' })
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

  const usage = await fetchUsage()

  let stats: Stats = { total: 0, held: 0, pivoted: 0, due: 0 }
  const { data: statsData, error: statsError } = await supabase.rpc('get_decision_stats')
  if (!statsError && Array.isArray(statsData) && statsData[0]) {
    stats = (statsData[0] as Stats) ?? stats
  }

  const { data: decisions, error } = await supabase
    .from('decisions')
    .select(
      'id, question, decision_card, status, created_at, check_in_date, check_in_outcome, winning_outcome, input_context'
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch decisions:', error.message)
  }

  const sortedDecisions = [...(decisions || [])].sort((a, b) => {
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <UpgradeToastClient />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Decisions</h1>
        <NewDecisionButton usage={usage} />
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
        <DecisionList decisions={sortedDecisions as DecisionRowType[]} />
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
