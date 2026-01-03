'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DecisionMemoView } from '@/components/decision-memo-view'
import {
  DecisionMemoSchema,
  type DecisionMemo,
} from '@/lib/schemas/decision-memo'
import { toSentenceCase } from '@/lib/utils/format'
import { CommitmentBlock } from '@/components/memo/CommitmentBlock'
import { DecisionHeaderBar } from '@/components/memo/DecisionHeaderBar'
import { OutcomeSelector } from '@/components/outcome-selector'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

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
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-xl font-semibold text-zinc-50">
            Decision not found
          </div>
          <p className="text-sm text-zinc-400">
            We couldn&apos;t load that decision. It may have been removed.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  if (decision.status === 'running') {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-zinc-500 mb-4">
            <div className="h-4 w-4 border-2 border-zinc-700 border-t-zinc-600 rounded-full animate-spin" />
            <span>Still processing...</span>
          </div>
          <p className="text-sm text-zinc-600">
            <Link href="/dashboard" className="underline hover:text-zinc-400">
              Back to dashboard
            </Link>
          </p>
        </div>
      </main>
    )
  }

  if (decision.status === 'failed') {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            This decision couldn&apos;t be completed.
          </p>
          <Link
            href="/decide"
            className="text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            Try again
          </Link>
        </div>
      </main>
    )
  }

  const parsed = DecisionMemoSchema.safeParse(decision.decision_memo)
  if (!parsed.success) {
    return (
      <main className="min-h-screen bg-zinc-950">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-zinc-300 mb-3">
            Decision memo is missing or invalid.
          </p>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-zinc-300 underline"
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

  return (
    <main className="min-h-screen bg-zinc-950">
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <DecisionHeaderBar memo={memo} decisionId={decision.id} />

        <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-zinc-100 mb-3">
          {toSentenceCase(memo.question)}
        </h1>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-400 mb-4">
          <span>{confidenceLabel}</span>
          <span>·</span>
          <span>{stageLabel}</span>
          <span>·</span>
          <span>{createdDate}</span>
        </div>

        {memo.confidence.rationale ? (
          <p className="text-base text-zinc-300 leading-relaxed mb-8">
            {memo.confidence.rationale}
          </p>
        ) : null}

        {memo.confidence.tier === 'exploratory' && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">
              Provisional call
            </h3>
            <p className="text-base text-zinc-300 leading-relaxed">
              This is a hypothesis. Run the next step to firm it up.
            </p>
          </div>
        )}

        <DecisionMemoView memo={memo} />

        {decision.status === 'complete' ? (
          <OutcomeSelector
            decisionId={decision.id}
            currentOutcome={
              (decision.outcome as
                | 'pending'
                | 'worked'
                | 'didnt_work'
                | null) ?? null
            }
          />
        ) : null}

        {!decision.committed_at ? (
          <div className="mt-12 pt-8 border-t border-zinc-800">
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
    </main>
  )
}
