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
  const [selectedSteps, setSelectedSteps] = useState<string[]>(
    isCommitted ? acceptedSteps : nextSteps,
  )
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
      <section className="mt-8">
        <h2 className="text-lg font-semibold mt-8 mb-3 text-zinc-100">
          Next steps
        </h2>
        <div className="border border-zinc-800 bg-zinc-900/50 rounded-none p-6">
          <p className="text-sm text-zinc-400 mb-3">
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
            <ul className="mt-4 space-y-2">
              {nextSteps.map((step, i) => (
                <li
                  key={i}
                  className={`text-sm text-zinc-300 ${
                    acceptedSteps.includes(step)
                      ? ''
                      : 'text-zinc-600 line-through'
                  }`}
                >
                  {acceptedSteps.includes(step) ? '✓' : '○'} {step}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold mt-8 mb-3 text-zinc-100">
        Next steps
      </h2>
      <div className="border border-zinc-800 rounded-none p-6 bg-zinc-900/40">
        <div className="space-y-3 mb-6">
          {nextSteps.map((step, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSteps.includes(step)}
                onChange={() => toggleStep(step)}
                className="mt-1 h-4 w-4 rounded-none border border-zinc-700 bg-transparent"
              />
              <span className="text-base leading-relaxed text-zinc-300">
                {step}
              </span>
            </label>
          ))}
        </div>

        <hr className="my-6 border-zinc-800" />

        <p className="text-sm text-zinc-400 mb-4">
          Committing helps you track what you decided and follow through.
        </p>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptCheckbox}
            onChange={(e) => setAcceptCheckbox(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-none border border-zinc-700 bg-transparent"
          />
          <span className="text-sm font-medium text-zinc-200">
            I accept this recommendation
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleCommit}
            disabled={!acceptCheckbox || saving}
            className="px-4 py-2 border-2 border-zinc-50 bg-zinc-50 text-zinc-950 rounded-none text-sm font-semibold uppercase tracking-wide hover:bg-transparent hover:text-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Commit to decision'}
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Save for later
          </button>
        </div>
      </div>
    </section>
  )
}
