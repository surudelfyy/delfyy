import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckInForm } from '@/components/check-in-form'

interface PageProps {
  params: { id: string }
}

export default async function CheckInPage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: decision, error } = await supabase
    .from('decisions')
    .select('id, question, decision_card, winning_outcome, check_in_outcome, check_in_date')
    .eq('id', params.id)
    .single()

  if (error || !decision) {
    notFound()
  }

  if (decision.check_in_outcome !== 'pending') {
    redirect(`/decisions/${params.id}`)
  }

  const recommendation =
    typeof decision.decision_card === 'object' &&
    decision.decision_card !== null &&
    'decision' in decision.decision_card
      ? (decision.decision_card as { decision?: string }).decision
      : null

  return (
    <div className="container max-w-2xl px-4 py-8">
      <a
        href={`/decisions/${params.id}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to decision
      </a>

      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Check in</h1>

      <div className="mb-8 rounded-lg border bg-card p-6">
        <p className="mb-2 text-sm text-muted-foreground">You decided:</p>
        <p className="text-lg font-medium">{recommendation || 'Your decision'}</p>

        {decision.winning_outcome && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">You said winning =</p>
            <p className="mt-1 text-sm">&quot;{decision.winning_outcome}&quot;</p>
          </div>
        )}
      </div>

      <CheckInForm decisionId={decision.id} />
    </div>
  )
}

