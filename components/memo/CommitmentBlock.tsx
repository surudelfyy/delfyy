'use client'

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
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Next steps</h2>
        <ul className="space-y-3">
          {nextSteps.map((step, i) => (
            <li
              key={i}
              className="text-zinc-300 leading-relaxed pl-4 border-l-2 border-zinc-700"
            >
              {step}
            </li>
          ))}
        </ul>

        <div className="mt-12 mb-8 flex justify-center">
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="text-sm">Committed {date}</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">Next steps</h2>
      <ul className="space-y-3">
        {nextSteps.map((step, i) => (
          <li
            key={i}
            className="text-zinc-300 leading-relaxed pl-4 border-l-2 border-zinc-700"
          >
            {step}
          </li>
        ))}
      </ul>

      <div className="mt-12 mb-8 flex justify-center">
        <button
          type="button"
          onClick={handleCommit}
          disabled={saving}
          className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Commit to this decision'}
        </button>
      </div>
    </section>
  )
}
