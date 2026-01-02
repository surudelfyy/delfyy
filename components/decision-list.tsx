'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Loader2, MoreVertical, RotateCcw, Trash2, X } from 'lucide-react'

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

  const handleRetryStarted = (id: string) => {
    setItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'running' } : d))
    )
  }

  if (!items.length) return null

  return (
    <div className="divide-y divide-zinc-200">
      {items.map((decision) => (
        <DecisionRow
          key={decision.id}
          decision={decision}
          onDeleted={handleDeleted}
          onRetrying={handleRetryStarted}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: JSX.Element; className: string; label: string }> = {
    complete: {
      icon: <Check className="h-4 w-4" />,
      className: 'bg-indigo-900 text-white',
      label: 'Complete',
    },
    failed: {
      icon: <X className="h-4 w-4" />,
      className: 'bg-rose-600 text-white',
      label: 'Failed',
    },
    running: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      className: 'bg-violet-600 text-white',
      label: 'Processing',
    },
    processing: {
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      className: 'bg-violet-600 text-white',
      label: 'Processing',
    },
  }
  const cfg = map[status] || map.processing
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full w-24 justify-center py-1 text-xs font-medium ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function DecisionRow({
  decision,
  onDeleted,
  onRetrying,
}: {
  decision: DecisionRowType
  onDeleted: (id: string) => void
  onRetrying: (id: string) => void
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

  const [menuOpen, setMenuOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleDelete = async () => {
    if (isDeleting) return
    const confirmed = window.confirm('Delete this decision?')
    if (!confirmed) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/decisions/${decision.id}`, { method: 'DELETE' })
      if (res.ok) {
        onDeleted(decision.id)
      }
    } finally {
      setIsDeleting(false)
      setMenuOpen(false)
    }
  }

  const handleRetry = async () => {
    if (isRetrying) return
    setIsRetrying(true)
    onRetrying(decision.id)
    try {
      const payload = {
        question: decision.question,
        context: decision.input_context || {},
        winning_outcome: decision.winning_outcome || null,
        check_in_date: decision.check_in_date || null,
      }
      const response = await fetch('/api/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.body) {
        setIsRetrying(false)
        return
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''
        for (const eventText of events) {
          if (!eventText.trim()) continue
          if (eventText.startsWith(':')) continue
          const lines = eventText.split('\n').filter(Boolean)
          const eventLine = lines.find((l) => l.startsWith('event: '))
          const dataLine = lines.find((l) => l.startsWith('data: '))
          if (!eventLine || !dataLine) continue
          const eventType = eventLine.replace('event: ', '').trim()
          const dataStr = dataLine.replace('data: ', '')
          try {
            const data = JSON.parse(dataStr)
            if (eventType === 'result' && data.decision_id) {
              router.push(`/decisions/${data.decision_id}`)
              return
            }
          } catch {
            continue
          }
        }
      }
    } finally {
      setIsRetrying(false)
      setMenuOpen(false)
    }
  }

  return (
    <div className="py-4 transition-colors hover:bg-zinc-50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <StatusBadge status={decision.status} />
          <div className="min-w-0">
            <Link href={`/decisions/${decision.id}`} className="font-medium text-zinc-900 leading-snug hover:underline">
              {recommendation || decision.question}
            </Link>
            {recommendation && (
              <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{decision.question}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-sm">
          {decision.check_in_date && decision.check_in_outcome === 'pending' && (
            <span className="text-zinc-500">
              {Math.ceil(
                (new Date(decision.check_in_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )}
              d
            </span>
          )}
          <span className="text-zinc-400">{createdDate}</span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 rounded hover:bg-zinc-100"
              aria-label="Actions"
            >
              <MoreVertical className="h-4 w-4 text-zinc-500" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-sm z-10">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50"
                  onClick={() => {
                    router.push(`/decisions/${decision.id}`)
                    setMenuOpen(false)
                  }}
                >
                  <Check className="h-4 w-4 text-zinc-500" />
                  View
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
                  onClick={handleRetry}
                  disabled={decision.status !== 'failed' || isRetrying}
                >
                  <RotateCcw className="h-4 w-4 text-zinc-500" />
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

