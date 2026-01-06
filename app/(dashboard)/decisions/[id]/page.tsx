import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DecisionMemoView } from '@/components/decision-memo-view'
import {
  DecisionMemoSchema,
  type DecisionMemo,
} from '@/lib/schemas/decision-memo'
import { toSentenceCase } from '@/lib/utils/format'
import { DecisionHeaderBar } from '@/components/memo/DecisionHeaderBar'
import { CommitmentBlock } from '@/components/memo/CommitmentBlock'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Explicit auth check - defense in depth with RLS
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: decision, error } = await supabase
    .from('decisions')
    .select(
      'id, status, question, decision_memo, confidence_tier, created_at, input_context, check_in_date, check_in_outcome, winning_outcome, committed_at, accepted_steps, outcome, outcome_marked_at',
    )
    .eq('id', id)
    .maybeSingle()

  console.log('[decisions/[id]] supabase fetch', {
    error: error?.message,
    hasDecision: !!decision,
  })

  if (error || !decision) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Decision not found
          </div>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load that decision. It may have been removed.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground underline hover:text-foreground/80"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (decision.status === 'running') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground mb-4">
            <div className="h-4 w-4 border-2 border-border border-t-input rounded-full animate-spin" />
            <span className="text-sm">Still processing...</span>
          </div>
          <p className="text-sm text-muted-foreground">
            <Link
              href="/dashboard"
              className="underline hover:text-muted-foreground"
            >
              Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    )
  }

  if (decision.status === 'failed') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-destructive mb-4 text-sm sm:text-base">
            This decision couldn&apos;t be completed.
          </p>
          <Link
            href="/decide"
            className="text-sm text-muted-foreground underline hover:text-foreground/80"
          >
            Try again
          </Link>
        </div>
      </div>
    )
  }

  const parsed = DecisionMemoSchema.safeParse(decision.decision_memo)
  if (!parsed.success) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-foreground/80 mb-3">
            Decision memo is missing or invalid.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground/80 underline"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const memo: DecisionMemo = parsed.data

  const confidenceLabel =
    memo.confidence.tier === 'high'
      ? 'Very high confidence'
      : memo.confidence.tier === 'supported'
        ? 'High confidence'
        : memo.confidence.tier === 'directional'
          ? 'Medium confidence'
          : 'Early signal'

  const createdDate = new Date(decision.created_at).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  )

  const stageLabel =
    (memo.meta.stage ?? '').charAt(0).toUpperCase() +
      (memo.meta.stage ?? '').slice(1) || 'Unknown'

  const outcomeLabel =
    decision.outcome === 'successful'
      ? 'Successful'
      : decision.outcome === 'failed'
        ? 'Failed'
        : decision.committed_at
          ? 'Pending'
          : null

  const bannerStyle = 'bg-card border-border'

  return (
    <article className="max-w-2xl mx-auto py-4 sm:py-8">
      <DecisionHeaderBar
        memo={memo}
        decisionId={decision.id}
        createdAt={decision.created_at}
        outcome={
          (decision.outcome as 'successful' | 'failed' | null | undefined) ??
          null
        }
        stage={memo.meta.stage ?? null}
      />

      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight text-foreground mb-3 break-words">
        {toSentenceCase(memo.question)}
      </h1>

      <div className="flex flex-wrap items-center gap-2 mt-3 mb-4">
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border border-border text-foreground/80 rounded-xl uppercase tracking-wide whitespace-nowrap">
          {confidenceLabel}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border border-border text-foreground/80 rounded-xl uppercase tracking-wide whitespace-nowrap">
          {stageLabel}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border border-border text-foreground/80 rounded-xl uppercase tracking-wide whitespace-nowrap">
          {createdDate}
        </span>
        {outcomeLabel ? (
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border border-border text-foreground/80 rounded-xl uppercase tracking-wide whitespace-nowrap">
            {outcomeLabel}
          </span>
        ) : null}
      </div>

      {memo.confidence.rationale ? (
        <div
          className={cn('mt-4 mb-6 p-3 sm:p-4 rounded-xl border', bannerStyle)}
        >
          <p className="text-muted-foreground text-sm leading-relaxed">
            {memo.confidence.rationale}
          </p>
        </div>
      ) : null}

      <DecisionMemoView memo={memo} />

      {!decision.committed_at ? (
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
          <CommitmentBlock
            decisionId={decision.id}
            nextSteps={memo.next_steps}
            isCommitted={Boolean(decision.committed_at)}
            committedAt={decision.committed_at ?? undefined}
            acceptedSteps={
              Array.isArray(decision.accepted_steps)
                ? (decision.accepted_steps as string[])
                : []
            }
          />
        </div>
      ) : null}
    </article>
  )
}
