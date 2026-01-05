'use client'

import Link from 'next/link'
import { useState } from 'react'

interface CommitmentBlockProps {
  decisionId: string
  nextSteps: string[]
  isCommitted?: boolean
  committedAt?: string
  acceptedSteps?: string[]
}

export function CommitmentBlock({
  decisionId,
  nextSteps,
  isCommitted = false,
  committedAt,
}: CommitmentBlockProps) {
  const [accepted, setAccepted] = useState(isCommitted)
  const [saving, setSaving] = useState(false)

  const handleCommit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committed_at: new Date().toISOString(),
          accepted_steps: nextSteps,
        }),
      })
      if (res.ok) {
        setAccepted(true)
      }
    } finally {
      setSaving(false)
    }
  }

  if (accepted) {
    const date = committedAt
      ? new Date(committedAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
    return (
      <section className="mt-6 sm:mt-10">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Next steps
        </h2>
        <ul className="space-y-2 sm:space-y-3">
          {nextSteps.map((step, i) => (
            <li
              key={i}
              className="text-sm sm:text-base text-foreground/80 leading-relaxed pl-3 sm:pl-4 border-l-2 border-border"
            >
              {step}
            </li>
          ))}
        </ul>

        <div className="mt-8 sm:mt-12 mb-6 sm:mb-8 flex justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs sm:text-sm">Committed {date}</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 sm:mt-10">
      <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
        Next steps
      </h2>
      <ul className="space-y-2 sm:space-y-3">
        {nextSteps.map((step, i) => (
          <li
            key={i}
            className="text-sm sm:text-base text-foreground/80 leading-relaxed pl-3 sm:pl-4 border-l-2 border-border"
          >
            {step}
          </li>
        ))}
      </ul>

      <div className="mt-8 sm:mt-12 mb-6 sm:mb-8 flex justify-center">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCommit}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 h-11 pl-5 pr-4 bg-primary text-primary-foreground shadow-sm text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Commit to this decision'}
          </button>

          <Link
            href="/decide"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 h-11 pl-5 pr-4 bg-secondary text-secondary-foreground border border-border shadow-sm text-sm font-medium rounded-xl hover:bg-accent transition-colors duration-150"
          >
            Decide something else
          </Link>
        </div>
      </div>
    </section>
  )
}
