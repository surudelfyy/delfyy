import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: { id: string }
  searchParams: { outcome?: string }
}

export default async function CheckInCompletePage({ params, searchParams }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const outcome = searchParams.outcome
  const validOutcomes = ['held', 'pivoted', 'too_early']

  if (!outcome || !validOutcomes.includes(outcome)) {
    redirect(`/decisions/${params.id}`)
  }

  const { data: decisions } = await supabase
    .from('decisions')
    .select('id, check_in_outcome, status')
    .eq('user_id', user.id)

  const completedDecisions = decisions?.filter((d) => d.status === 'complete') || []
  const totalDecisions = completedDecisions.length
  const heldCount = completedDecisions.filter((d) => d.check_in_outcome === 'held').length
  const pivotedCount = completedDecisions.filter((d) => d.check_in_outcome === 'pivoted').length

  const outcomeContent = {
    held: {
      icon: '✓',
      title: 'Decision held',
      subtitle: 'Nice. Trust your judgment.',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    pivoted: {
      icon: '↻',
      title: 'You pivoted',
      subtitle: 'Good. Adapting is a skill.',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    too_early: {
      icon: '→',
      title: 'Extended',
      subtitle: "We'll check in again in 7 days.",
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
  } as const

  const content = outcomeContent[outcome as keyof typeof outcomeContent]

  return (
    <div className="container max-w-md px-4 py-16 text-center">
      <div
        className={`mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full text-3xl ${content.bgColor} ${content.textColor}`}
      >
        {content.icon}
      </div>

      <h1 className="mb-2 text-2xl font-semibold">{content.title}</h1>
      <p className="mb-8 text-muted-foreground">{content.subtitle}</p>

      {totalDecisions > 0 && (
        <div className="mb-8 rounded-lg border bg-card p-6 text-left">
          <p className="mb-1 text-sm text-muted-foreground">Your track record</p>
          <p className="text-lg">
            <span className="font-semibold">{totalDecisions}</span>
            {' decision'}
            {totalDecisions !== 1 ? 's' : ''} ·{' '}
            <span className="font-semibold text-green-600">{heldCount}</span>
            {' held'} ·{' '}
            <span className="font-semibold text-amber-600">{pivotedCount}</span>
            {' pivoted'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/decide"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Make another decision
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

