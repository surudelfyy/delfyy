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
  acceptedSteps = [],
}: CommitmentBlockProps) {
  const [accepted, setAccepted] = useState(isCommitted)
  const [selectedSteps, setSelectedSteps] = useState<string[]>(nextSteps)
  const [acceptCheckbox, setAcceptCheckbox] = useState(isCommitted)
  const [saving, setSaving] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const toggleStep = (step: string) => {
    setSelectedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step],
    )
  }

  const handleCommit = async () => {
    if (!acceptCheckbox) return
    setSaving(true)
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committed_at: new Date().toISOString(),
          accepted_steps: selectedSteps,
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
        <p className="text-sm text-zinc-500 mb-3">
          ✓ Committed on {date} · {acceptedSteps.length} of {nextSteps.length}{' '}
          steps accepted
        </p>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-zinc-400 hover:text-zinc-200 underline"
        >
          {showDetails ? 'Hide details' : 'View commitment details'}
        </button>
        {showDetails && (
          <ul className="mt-4 space-y-2 text-zinc-300">
            {nextSteps.map((step, i) => (
              <li
                key={i}
                className={
                  acceptedSteps.includes(step)
                    ? ''
                    : 'text-zinc-500 line-through'
                }
              >
                {acceptedSteps.includes(step) ? '✓' : '○'} {step}
              </li>
            ))}
          </ul>
        )}
      </section>
    )
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-zinc-100 mb-4">Next steps</h2>
      <div className="space-y-3 mb-4">
        {nextSteps.map((step, i) => (
          <label
            key={i}
            className="flex items-start gap-3 cursor-pointer text-zinc-300"
          >
            <input
              type="checkbox"
              checked={selectedSteps.includes(step)}
              onChange={() => toggleStep(step)}
              className="mt-1 h-4 w-4 rounded-none border border-zinc-600 bg-transparent"
            />
            <span className="text-base leading-relaxed">{step}</span>
          </label>
        ))}
      </div>

      <p className="text-sm text-zinc-500 mb-3">
        Committing helps you track what you decided and follow through.
      </p>

      <label className="flex items-center gap-3 mb-4 cursor-pointer text-zinc-300">
        <input
          type="checkbox"
          checked={acceptCheckbox}
          onChange={(e) => setAcceptCheckbox(e.target.checked)}
          className="h-4 w-4 rounded-none border border-zinc-600 bg-transparent"
        />
        <span className="text-base">I accept this recommendation</span>
      </label>

      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <button
          type="button"
          onClick={handleCommit}
          disabled={!acceptCheckbox || selectedSteps.length === 0 || saving}
          className="px-4 py-2 border border-zinc-600 text-zinc-100 rounded-none text-sm font-semibold hover:border-zinc-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Commit to decision'}
        </button>
        <span className="text-sm text-zinc-500">Save for later</span>
      </div>
    </section>
  )
}
