'use client'

import { useEffect, useMemo, useState } from 'react'
import { PencilLine, Check as CheckIcon } from 'lucide-react'

function cleanTextLocal(text?: string): string {
  if (!text) return ''
  return text
    .replace(/—/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;!?])/g, '$1')
    .trim()
}

type Confidence = 'high' | 'medium' | 'low'

interface Assumption {
  assumption: string
  confidence: Confidence
  why_it_matters?: string
}

interface AssumptionChipsProps {
  assumptions: Assumption[]
  decisionId?: string
  corrections?: Record<string, { original: string; correction: string; corrected_at: string }>
}

const confidenceRank: Record<Confidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function AssumptionChips({ assumptions, decisionId, corrections }: AssumptionChipsProps) {
  const [localCorrections, setLocalCorrections] = useState<Record<string, { original: string; correction: string; corrected_at: string }>>(corrections || {})
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setLocalCorrections(corrections || {})
  }, [corrections])

  const display = useMemo(() => {
    if (!assumptions?.length) return []
    return [...assumptions].sort((a, b) => confidenceRank[a.confidence] - confidenceRank[b.confidence])
  }, [assumptions])

  if (!assumptions?.length) return null

  const chipClass = (confidence: Confidence) => {
    if (confidence === 'high') return 'w-16 text-center bg-indigo-900 text-white'
    if (confidence === 'medium') return 'w-16 text-center bg-violet-600 text-white'
    return 'w-16 text-center bg-slate-400 text-white'
  }

  const startEdit = (idx: number, current: string) => {
    if (!decisionId) return
    setEditing(idx)
    setDraft(current)
    setMessage(null)
  }

  const cancelEdit = () => {
    setEditing(null)
    setDraft('')
    setMessage(null)
  }

  const saveEdit = async (idx: number, original: string) => {
    if (!decisionId) return
    const trimmed = draft.trim()
    if (!trimmed) {
      cancelEdit()
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: idx, correction: trimmed, original }),
      })
      if (!res.ok) {
        setMessage("Couldn't save — try again")
        return
      }
      const data = await res.json().catch(() => ({}))
      if (data?.assumption_corrections) {
        setLocalCorrections(data.assumption_corrections)
      } else {
        setLocalCorrections((prev) => ({
          ...prev,
          [idx]: { original, correction: trimmed, corrected_at: new Date().toISOString() },
        }))
      }
      setMessage('Correction saved')
      setEditing(null)
      setDraft('')
    } finally {
      setSaving(false)
    }
  }

  const renderText = (text: string, idx: number) => {
    const correction = localCorrections?.[idx]
    const displayText = correction?.correction || text
    const edited = Boolean(correction)
    return (
      <div className="flex items-start gap-2">
        <p className="leading-relaxed flex-1">{cleanTextLocal(displayText)}</p>
        {edited && <span className="text-xs text-zinc-500">edited</span>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {display.map((item, idx) => {
        const correction = localCorrections?.[idx]
        const displayText = correction?.correction || item.assumption
        const isEditing = editing === idx
        return (
          <div key={`${item.assumption}-${idx}`} className="space-y-1 group">
            <div className="flex items-start gap-3 text-[17px] leading-[1.65] text-slate-800">
              <span className={`text-xs font-medium py-1 rounded-full shrink-0 mt-0.5 ${chipClass(item.confidence)}`}>
                {item.confidence === 'high' ? 'High' : item.confidence === 'medium' ? 'Medium' : 'Low'}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.slice(0, 500))}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault()
                          void saveEdit(idx, item.assumption)
                        } else if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          void saveEdit(idx, item.assumption)
                        } else if (e.key === 'Escape') {
                          e.preventDefault()
                          cancelEdit()
                        }
                      }}
                      maxLength={500}
                      rows={3}
                      autoFocus
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none resize-none"
                    />
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{draft.length}/500</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-zinc-700"
                          disabled={saving}
                          onClick={() => void saveEdit(idx, item.assumption)}
                        >
                          Save
                        </button>
                        <button type="button" className="text-zinc-500" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {renderText(displayText, idx)}
                    {item.why_it_matters ? (
                      <p className="text-sm leading-relaxed text-slate-500">
                        {cleanTextLocal(item.why_it_matters)}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              {decisionId && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      void saveEdit(idx, item.assumption)
                    } else {
                      startEdit(idx, displayText)
                    }
                  }}
                  className="ml-2 text-zinc-400 hover:text-zinc-700 transition-colors"
                  aria-label={isEditing ? 'Save' : 'Edit'}
                >
                  {isEditing ? <CheckIcon className="h-4 w-4" /> : <PencilLine className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        )
      })}
      {message && <p className="text-xs text-zinc-500">{message}</p>}
    </div>
  )
}

