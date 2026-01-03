'use client'

import { useState } from 'react'
import Link from 'next/link'

type DecisionRowType = {
  id: string
  question: string
  decision_card: unknown
  status: string
  created_at: string
  check_in_date: string | null
  check_in_outcome: string | null
  winning_outcome?: string | null
  input_context?: Record<string, unknown>
}

interface DecisionListProps {
  decisions: DecisionRowType[]
}

type FilterType = 'all' | 'successful' | 'failed' | 'too_early' | 'pending'

function getOutcomeDisplay(decision: DecisionRowType): {
  label: string
  style: string
} {
  if (decision.status === 'processing' || decision.status === 'running') {
    return {
      label: 'Processing',
      style: 'border border-zinc-700 text-zinc-500 animate-pulse',
    }
  }
  if (decision.status === 'failed') {
    return { label: 'Error', style: 'border border-red-800 text-red-400' }
  }
  if (decision.check_in_outcome === 'worked') {
    return { label: 'Successful', style: 'bg-zinc-50 text-zinc-900' }
  }
  if (decision.check_in_outcome === 'didnt_work') {
    return { label: 'Failed', style: 'border border-zinc-700 text-zinc-400' }
  }
  if (decision.check_in_outcome === 'too_early') {
    return { label: 'Too early', style: 'border border-zinc-700 text-zinc-400' }
  }
  return { label: 'Pending', style: 'border border-zinc-700 text-zinc-500' }
}

function getFilterCategory(decision: DecisionRowType): FilterType {
  if (decision.status !== 'complete') return 'pending'
  if (decision.check_in_outcome === 'worked') return 'successful'
  if (decision.check_in_outcome === 'didnt_work') return 'failed'
  if (decision.check_in_outcome === 'too_early') return 'too_early'
  return 'pending'
}

export function DecisionList({ decisions }: DecisionListProps) {
  const [items, setItems] = useState(decisions)
  const [filter, setFilter] = useState<FilterType>('all')

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((d) => d.id !== id))
  }

  const counts = {
    all: items.length,
    successful: items.filter((d) => getFilterCategory(d) === 'successful')
      .length,
    failed: items.filter((d) => getFilterCategory(d) === 'failed').length,
    too_early: items.filter((d) => getFilterCategory(d) === 'too_early').length,
    pending: items.filter((d) => getFilterCategory(d) === 'pending').length,
  }

  const filteredItems =
    filter === 'all'
      ? items
      : items.filter((d) => getFilterCategory(d) === filter)

  if (!items.length) return null

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'successful', label: 'Successful' },
            { key: 'failed', label: 'Failed' },
            { key: 'too_early', label: 'Too early' },
            { key: 'pending', label: 'Pending' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              filter === key
                ? 'bg-zinc-50 text-zinc-900'
                : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label} {counts[key]}
          </button>
        ))}
      </div>

      <div className="divide-y divide-zinc-800">
        {filteredItems.map((decision) => (
          <DecisionRow
            key={decision.id}
            decision={decision}
            onDeleted={handleDeleted}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <p className="text-sm text-zinc-500 py-8 text-center">
          No {filter === 'all' ? 'decisions' : filter.replace('_', ' ')}{' '}
          decisions
        </p>
      )}
    </div>
  )
}

function DecisionRow({
  decision,
  onDeleted,
}: {
  decision: DecisionRowType
  onDeleted: (_id: string) => void
}) {
  const recommendation =
    typeof decision.decision_card === 'object' &&
    decision.decision_card !== null &&
    'decision' in decision.decision_card
      ? (decision.decision_card as { decision?: string }).decision
      : null

  const createdDate = new Date(decision.created_at).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
    },
  )

  const [isDeleting, setIsDeleting] = useState(false)
  const outcome = getOutcomeDisplay(decision)

  const handleDelete = async () => {
    if (isDeleting) return
    const confirmed = window.confirm('Delete this decision?')
    if (!confirmed) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/decisions/${decision.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        onDeleted(decision.id)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="py-4">
      <Link href={`/decisions/${decision.id}`} className="block group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-base text-zinc-50 leading-snug group-hover:underline">
              {recommendation || decision.question}
            </p>
            {recommendation && (
              <p className="mt-1 text-sm text-zinc-500 line-clamp-1">
                {decision.question}
              </p>
            )}
          </div>

          <span
            className={`shrink-0 px-2 py-0.5 text-xs font-medium ${outcome.style}`}
          >
            {outcome.label}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2 text-sm">
          <p className="text-zinc-600">{createdDate}</p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            className="text-zinc-600 hover:text-zinc-50"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Link>
    </div>
  )
}
