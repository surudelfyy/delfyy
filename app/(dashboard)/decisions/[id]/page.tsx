import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { DecisionActions } from '@/components/decision-actions'
import { DecisionMemoView } from '@/components/decision-memo-view'
import { DecisionMemoSchema, type DecisionMemo } from '@/lib/schemas/decision-memo'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, status, question, decision_memo, confidence_tier, created_at, input_context')
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

  if (decision.status === 'running') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-gray-500 mb-4">
            <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span>Still processing...</span>
          </div>
          <p className="text-sm text-gray-400">
            <Link href="/dashboard" className="underline hover:text-gray-600">
              Back to dashboard
            </Link>
          </p>
        </div>
      </main>
    )
  }

  if (decision.status === 'failed') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">This decision couldn't be completed.</p>
          <Link href="/decide" className="text-sm text-gray-500 underline hover:text-gray-700">
            Try again
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

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/delfyylogo.svg" alt="Delfyy" width={120} height={40} className="h-auto" priority />
          </Link>
          <DecisionActions memo={memo} decisionId={decision.id} buttonSize="sm" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-3.5 w-3.5" />
          All decisions
        </Link>

        {memo.confidence.tier === 'exploratory' && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
            <AlertTriangle className="h-4 w-4 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Provisional call</p>
              <p className="text-sm text-amber-800">This is a hypothesis. Run the next step to firm it up.</p>
            </div>
          </div>
        )}

        <DecisionMemoView memo={memo} createdAt={decision.created_at} />
      </div>
    </main>
  )
}

