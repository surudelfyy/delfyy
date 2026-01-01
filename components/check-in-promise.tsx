'use client'

interface CheckInPromiseProps {
  decisionId: string
  checkInDate: string | null
  checkInOutcome: 'pending' | 'held' | 'pivoted' | 'too_early'
  winningOutcome: string | null
}

export function CheckInPromise({ decisionId, checkInDate, checkInOutcome, winningOutcome }: CheckInPromiseProps) {
  if (!checkInDate) {
    return null
  }

  const checkIn = new Date(checkInDate)
  const now = new Date()
  const isPast = checkIn <= now
  const isCompleted = checkInOutcome !== 'pending'

  const diffTime = checkIn.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (isCompleted) {
    const outcomeConfig = {
      held: {
        text: 'Decision held',
        icon: '✓',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200',
      },
      pivoted: {
        text: 'You pivoted',
        icon: '↻',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-200',
      },
      too_early: {
        text: 'Extended',
        icon: '→',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-200',
      },
    } as const

    const config = outcomeConfig[checkInOutcome as keyof typeof outcomeConfig]
    if (!config) return null

    return (
      <div className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-center gap-2">
          <span className={`text-lg ${config.textColor}`}>{config.icon}</span>
          <span className={`font-medium ${config.textColor}`}>{config.text}</span>
        </div>
      </div>
    )
  }

  if (isPast || diffDays <= 0) {
    return (
      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-amber-800">Check-in due</p>
            {winningOutcome && (
              <p className="mt-1 text-sm text-amber-700">You said winning = &quot;{winningOutcome}&quot;</p>
            )}
          </div>
          <a
            href={`/decisions/${decisionId}/check-in`}
            className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Check in now →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2" aria-hidden="true">
          <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            In{' '}
            <span className="font-medium text-foreground">
              {diffDays} day{diffDays !== 1 ? 's' : ''}
            </span>
            , we&apos;ll ask: did this work?
          </p>
          {winningOutcome && (
            <p className="mt-1 text-sm text-muted-foreground">Success = &quot;{winningOutcome}&quot;</p>
          )}
        </div>
      </div>
    </div>
  )
}

