import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { DecisionCardDisplay } from '@/components/decision-card-display'
import { DecisionActions } from '@/components/decision-actions'
import { ProvisionalBanner } from '@/components/provisional-banner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DecisionPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, status, question, decision_card, confidence_tier, created_at')
    .eq('id', id)
    .single()

  if (error || !decision) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">This decision could not be found.</p>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  // Running state
  if (decision.status === 'running') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
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

  // Failed state
  if (decision.status === 'failed') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 mb-4">This decision couldn&apos;t be completed.</p>
          <Link href="/decide" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Try again
          </Link>
        </div>
      </main>
    )
  }

  const isProvisional = decision.confidence_tier === 'exploratory'
  const card = decision.decision_card || {}

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            Delfyy
          </Link>

          {/* Desktop actions in header */}
          <div className="hidden md:flex items-center gap-2">
            <DecisionActions
              question={decision.question}
              card={card}
              confidenceTier={decision.confidence_tier}
            />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          All decisions
        </Link>

        {/* Hero intro */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">That&apos;s one less thing living in your head.</p>
          <h1 className="text-2xl font-semibold text-gray-900">{decision.question}</h1>
          <p className="text-sm text-gray-400 mt-2">
            {new Date(decision.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Provisional banner if exploratory */}
        {isProvisional && <ProvisionalBanner />}

        {/* Mobile actions */}
        <div className="md:hidden mb-6 flex gap-2">
          <DecisionActions
            question={decision.question}
            card={card}
            confidenceTier={decision.confidence_tier}
          />
        </div>

        {/* The Decision Card */}
        <DecisionCardDisplay card={card} confidenceTier={decision.confidence_tier} />
      </div>
    </main>
  )
}


