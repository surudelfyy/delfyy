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
        <div key={`${item.assumption}-${idx}`} className="space-y-1">
          <p className="text-base text-zinc-100 leading-relaxed">
            <span className="text-zinc-500 text-sm uppercase tracking-wide mr-2">
              {item.confidence === 'high'
                ? 'High'
                : item.confidence === 'medium'
                  ? 'Medium'
                  : 'Low'}
            </span>
            {cleanTextLocal(item.assumption)}
          </p>
          {item.why_it_matters ? (
            <p className="text-sm leading-relaxed text-zinc-500">
              {cleanTextLocal(item.why_it_matters)}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
