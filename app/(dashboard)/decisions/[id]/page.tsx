import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DecisionActions } from '@/components/decision-actions'
import { DecisionCardDisplay } from '@/components/decision-card-display'
import { ProvisionalBanner } from '@/components/provisional-banner'

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
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span>This decision is still processing...</span>
          </div>
          <div className="mt-6">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 underline">
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (decision.status === 'failed') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">This decision could not be completed.</p>
          <Link href="/decide" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Try again
          </Link>
        </div>
      </main>
    )
  }

  const isProvisional = decision.confidence_tier === 'exploratory'
  const card = decision.decision_card || {}
  const stage = decision.input_context?.stage

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/delfyylogo.svg"
              alt="Delfyy"
              width={120}
              height={40}
              className="h-auto"
              priority
            />
          </Link>
          <DecisionActions
            question={decision.question}
            card={card}
            confidenceTier={decision.confidence_tier}
          />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          All decisions
        </Link>

        {/* Question as headline */}
        <h1 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-8">
          {decision.question}
        </h1>

        {/* Provisional banner */}
        {isProvisional && <ProvisionalBanner />}

        {/* The Decision Card */}
        <DecisionCardDisplay card={card} confidenceTier={decision.confidence_tier} />

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between text-sm text-gray-400">
          <DecisionActions
            question={decision.question}
            card={card}
            confidenceTier={decision.confidence_tier}
          />
          <div className="flex items-center gap-3">
            {stage && <span className="capitalize">{stage}</span>}
            <span>
              {new Date(decision.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}

