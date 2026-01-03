import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, ChevronLeft } from 'lucide-react'
import { DecisionActions } from '@/components/decision-actions'
import { DecisionMemoView } from '@/components/decision-memo-view'
import { CheckInPromise } from '@/components/check-in-promise'
import {
  DecisionMemoSchema,
  type DecisionMemo,
} from '@/lib/schemas/decision-memo'
import { toSentenceCase } from '@/lib/utils/format'
import { ConfidenceChip } from '@/components/decision-memo-view'
import { DeleteDecisionButton } from '@/components/delete-decision-button'
import { CopyDocumentButton } from '@/components/copy-document-button'
import type { DecisionDocument } from '@/lib/utils/copy-as-document'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: decision, error } = await supabase
    .from('decisions')
    .select(
      'id, status, question, decision_memo, confidence_tier, created_at, input_context, check_in_date, check_in_outcome, winning_outcome',
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

  const decisionDocument: DecisionDocument = {
    id: decision.id,
    question: decision.question,
    created_at: decision.created_at,
    decision_card: {
      decision: memo.call,
      confidence_tier: memo.confidence.tier,
      confidence_reason: memo.confidence.rationale,
      reasoning: memo.why_this_call?.join('\n'),
      assumptions: Array.isArray(memo.assumptions)
        ? memo.assumptions.map((a) => {
            if (typeof a === 'string') return a
            const confidence = a.confidence ? ` (${a.confidence})` : ''
            const why = a.why_it_matters ? ` - ${a.why_it_matters}` : ''
            return `${a.assumption}${confidence}${why}`
          })
        : [],
      trade_offs: Array.isArray(memo.trade_offs)
        ? memo.trade_offs.join('\n')
        : memo.trade_offs,
      risks: memo.risks,
      next_steps: memo.next_steps,
      review_trigger: memo.review_trigger || undefined,
      escape_hatch: memo.escape_hatch || undefined,
      principle: memo.pattern?.principle,
      where_worked: memo.examples?.worked
        ?.map((e) => `${e.company}${e.year ? ` (${e.year})` : ''}: ${e.story}`)
        .join('; '),
      where_failed: memo.examples?.failed
        ?.map((e) => `${e.company}${e.year ? ` (${e.year})` : ''}: ${e.story}`)
        .join('; '),
      mechanism: memo.pattern?.why_it_works,
    },
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-zinc-900 border border-zinc-800 rounded-none overflow-hidden">
          <header className="px-5 py-4 sm:px-6 border-b border-zinc-800 flex items-center justify-between gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              All decisions
            </Link>
            <div className="flex items-center gap-2">
              <CopyDocumentButton
                decision={decisionDocument}
                className="rounded-none border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              />
              <DecisionActions
                memo={memo}
                decisionId={decision.id}
                buttonSize="sm"
              />
              <DeleteDecisionButton decisionId={decision.id} />
            </div>
          </header>

          <div className="px-5 py-6 sm:px-8 sm:py-8 space-y-8">
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-zinc-100">
                {toSentenceCase(memo.question)}
              </h1>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 text-sm">
                <ConfidenceChip tier={memo.confidence.tier} />
                <span className="text-zinc-500">
                  {(memo.meta.stage ?? '').charAt(0).toUpperCase() +
                    (memo.meta.stage ?? '').slice(1) || 'Unknown'}{' '}
                  ·{' '}
                  {new Date(decision.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {memo.confidence.rationale && (
                <p className="text-base leading-relaxed text-zinc-400">
                  {memo.confidence.rationale}
                </p>
              )}
            </div>

            {memo.confidence.tier === 'exploratory' && (
              <div className="rounded-none border-l-4 border-amber-600 bg-amber-950/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-200">
                      Provisional call
                    </p>
                    <p className="text-sm text-amber-300/80">
                      This is a hypothesis. Run the next step to firm it up.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DecisionMemoView
              memo={memo}
              createdAt={decision.created_at}
              className="bg-transparent border-0 shadow-none p-0"
            />

            <div className="border-t border-zinc-800 pt-6">
              <CheckInPromise
                decisionId={decision.id}
                checkInDate={decision.check_in_date ?? null}
                checkInOutcome={
                  (decision.check_in_outcome as
                    | 'pending'
                    | 'held'
                    | 'pivoted'
                    | 'too_early'
                    | null) ?? 'pending'
                }
                winningOutcome={decision.winning_outcome ?? null}
              />
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
