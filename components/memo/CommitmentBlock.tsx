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
        <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-zinc-100 mb-3 sm:mb-4">
          Next steps
        </h2>
        <ul className="space-y-2 sm:space-y-3">
          {nextSteps.map((step, i) => (
            <li
              key={i}
              className="text-sm sm:text-base text-zinc-300 leading-relaxed pl-3 sm:pl-4 border-l-2 border-zinc-700"
            >
              {step}
            </li>
          ))}
        </ul>

        <div className="mt-8 sm:mt-12 mb-6 sm:mb-8 flex justify-center">
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-xs sm:text-sm">Committed {date}</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 sm:mt-10">
      <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-zinc-100 mb-3 sm:mb-4">
        Next steps
      </h2>
      <ul className="space-y-2 sm:space-y-3">
        {nextSteps.map((step, i) => (
          <li
            key={i}
            className="text-sm sm:text-base text-zinc-300 leading-relaxed pl-3 sm:pl-4 border-l-2 border-zinc-700"
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
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white text-black text-sm sm:text-base font-medium rounded-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Commit to this decision'}
          </button>

          <Link
            href="/decide"
            className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 border border-zinc-700 text-zinc-200 text-sm sm:text-base font-medium rounded-sm hover:bg-zinc-900 transition-colors"
          >
            Decide something else
          </Link>
        </div>
      </div>
    </section>
  )
}
