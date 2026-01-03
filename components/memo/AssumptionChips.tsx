'use client'

import { useMemo } from 'react'

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
}

export function AssumptionChips({ assumptions }: AssumptionChipsProps) {
  const display = useMemo(() => {
    if (!assumptions?.length) return []
    return [...assumptions].sort((a, b) => {
      const rank: Record<Confidence, number> = { high: 0, medium: 1, low: 2 }
      return rank[a.confidence] - rank[b.confidence]
    })
  }, [assumptions])

  if (!assumptions?.length) return null

  return (
    <div className="space-y-6">
      {display.map((item, idx) => (
        <div key={`${item.assumption}-${idx}`}>
          <div className="flex items-start gap-3">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-zinc-100 text-zinc-900 rounded uppercase tracking-wide shrink-0">
              {item.confidence}
            </span>
            <p className="text-zinc-100">{cleanTextLocal(item.assumption)}</p>
          </div>
          {item.why_it_matters ? (
            <p className="mt-1 pl-16 text-zinc-500 text-sm">
              {cleanTextLocal(item.why_it_matters)}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
