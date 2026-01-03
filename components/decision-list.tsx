'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type DecisionRowType = {
  id: string
  question: string
  decision_card: unknown
  status: string
  created_at: string
  check_in_date: string | null
  check_in_outcome: string | null
  winning_outcome?: string | null
  input_context?: any
}

interface DecisionListProps {
  decisions: DecisionRowType[]
}

export function DecisionList({ decisions }: DecisionListProps) {
  const [items, setItems] = useState(decisions)

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((d) => d.id !== id))
  }

  if (!items.length) return null

  return (
    <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
      {items.map((decision) => (
        <DecisionRow key={decision.id} decision={decision} onDeleted={handleDeleted} />
      ))}
    </div>
  )
}

function DecisionRow({
  decision,
  onDeleted,
}: {
  decision: DecisionRowType
  onDeleted: (id: string) => void
}) {
  const router = useRouter()
  const recommendation =
    typeof decision.decision_card === 'object' &&
    decision.decision_card !== null &&
    'decision' in decision.decision_card
      ? (decision.decision_card as { decision?: string }).decision
      : null

  const createdDate = new Date(decision.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })

  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDeleting) return
    const confirmed = window.confirm('Delete this decision?')
    if (!confirmed) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/decisions/${decision.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted(decision.id)
        router.refresh()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const statusLabel = decision.status === 'complete' ? 'Complete' : decision.status

  return (
    <div className="border-b border-gray-200 py-4">
      <Link href={`/decisions/${decision.id}`} className="block group">
        <p className="text-base text-gray-900 leading-snug group-hover:underline">
          {recommendation || decision.question}
        </p>

        <div className="flex items-center justify-between mt-2 text-sm">
          <p className="text-gray-500">
            {statusLabel} · {createdDate}
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-gray-900 disabled:opacity-60"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Link>
    </div>
  )
}

