import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { DecisionCardDisplay } from '@/components/decision-card-display'
import { DecisionActions } from '@/components/decision-actions'
import { cleanText, fixContractions } from '@/lib/utils/format-decision-text'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, status, question, decision_card, confidence_tier, created_at, input_context')
    .eq('id', id)
    .single()

  if (error || !decision) {
    notFound()
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

  const card = decision.decision_card

  if (!card) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-700 mb-3">No decision card available yet.</p>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const questionClean = cleanText(fixContractions(decision.question))

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-[780px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/delfyylogo.svg" alt="Delfyy" width={120} height={40} className="h-auto" priority />
          </Link>
          <DecisionActions card={card} showPlainText buttonSize="sm" />
        </div>
      </header>

      <div className="memo max-w-[780px] mx-auto px-6 py-12 space-y-16">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All decisions
            </Link>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 leading-snug tracking-tight">
              {questionClean}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-gray-700">
                {decision.confidence_tier ?? 'Unknown confidence'}
              </span>
              {decision.input_context?.stage && (
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-gray-700 capitalize">
                  {decision.input_context.stage}
                </span>
              )}
              <span>
                {new Date(decision.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex">
            <DecisionActions card={card} showPlainText buttonSize="sm" />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-10">
          {card.meta.confidence_tier === 'exploratory' && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Provisional call</p>
                <p className="text-sm text-amber-800">This is a hypothesis. Run the next step to firm it up.</p>
              </div>
            </div>
          )}

          <DecisionCardDisplay card={card} confidenceTier={decision.confidence_tier ?? undefined} />
        </div>

        <footer className="pt-8 border-t border-gray-100 flex justify-between text-sm text-gray-500">
          <span>
            Generated on{' '}
            {new Date(decision.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <DecisionActions card={card} showPlainText buttonSize="sm" />
        </footer>
      </div>
    </main>
  )
}

