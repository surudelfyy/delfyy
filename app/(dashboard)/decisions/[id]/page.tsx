import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { DecisionActions } from '@/components/decision-actions'
import { DecisionMemoView } from '@/components/decision-memo-view'
import { CheckInPromise } from '@/components/check-in-promise'
import { DecisionMemoSchema, type DecisionMemo } from '@/lib/schemas/decision-memo'
import { toSentenceCase } from '@/lib/utils/format'
import { ConfidenceChip } from '@/components/decision-memo-view'
import { DeleteDecisionButton } from '@/components/delete-decision-button'
import { DecisionStatusBanner } from '@/components/decision-status-banner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: decision, error } = await supabase
    .from('decisions')
    .select(
      'id, status, question, decision_memo, confidence_tier, created_at, input_context, check_in_date, check_in_outcome, winning_outcome, assumption_corrections'
    )
    .eq('id', id)
    .maybeSingle()

  console.log('[decisions/[id]] supabase fetch', { error: error?.message, hasDecision: !!decision })

  if (error || !decision) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-xl font-semibold text-gray-900">Decision not found</div>
          <p className="text-sm text-gray-600">We couldn&apos;t load that decision. It may have been removed.</p>
          <Link href="/dashboard" className="text-sm text-gray-500 underline hover:text-gray-700">
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const parsed = DecisionMemoSchema.safeParse(decision.decision_memo)
  if (!parsed.success) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-700 mb-3">Decision memo is missing or invalid.</p>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const memo: DecisionMemo = parsed.data

  if (decision.status === 'running' || decision.status === 'failed') {
    return (
      <DecisionStatusBanner
        status={decision.status as 'running' | 'failed'}
        decisionId={decision.id}
        question={decision.question}
        inputContext={decision.input_context}
      />
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2" aria-label="Back to dashboard" />
          <div />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-3.5 w-3.5" />
            All decisions
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-semibold text-gray-900 leading-snug">{toSentenceCase(memo.question)}</h1>
              <div className="flex items-center gap-3 text-sm mt-2">
                <ConfidenceChip tier={memo.confidence.tier} />
                <span className="text-gray-500">
                  {(memo.meta.stage ?? '').charAt(0).toUpperCase() + (memo.meta.stage ?? '').slice(1) || 'Unknown'} ·{' '}
                  {new Date(decision.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DecisionActions memo={memo} decisionId={decision.id} buttonSize="sm" />
              <DeleteDecisionButton decisionId={decision.id} />
            </div>
          </div>
        </div>

        {memo.confidence.tier === 'exploratory' && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Provisional call</p>
              <p className="text-sm text-amber-800">This is a hypothesis. Run the next step to firm it up.</p>
            </div>
          </div>
        )}

        <DecisionMemoView
          memo={memo}
          createdAt={decision.created_at}
          decisionId={decision.id}
          assumptionCorrections={(decision as any).assumption_corrections || {}}
        />

        <div className="mt-6 border-t pt-6">
          <CheckInPromise
            decisionId={decision.id}
            checkInDate={(decision as any).check_in_date ?? null}
            checkInOutcome={(decision as any).check_in_outcome ?? 'pending'}
            winningOutcome={(decision as any).winning_outcome ?? null}
          />
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-gray-700 hover:bg-zinc-50 transition-colors"
          >
            ← All decisions
          </Link>
          <Link
            href="/decide"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + New decision
          </Link>
        </div>
      </div>
    </main>
  )
}

