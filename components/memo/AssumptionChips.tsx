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

const confidenceRank: Record<Confidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

export function AssumptionChips({ assumptions }: AssumptionChipsProps) {
  const display = useMemo(() => {
    if (!assumptions?.length) return []
    return [...assumptions].sort(
      (a, b) => confidenceRank[a.confidence] - confidenceRank[b.confidence]
    )
  }, [assumptions])

  if (!assumptions?.length) return null

  const chipClass = (confidence: Confidence) => {
    if (confidence === 'high') return 'w-16 text-center bg-indigo-900 text-zinc-950'
    if (confidence === 'medium') return 'w-16 text-center bg-violet-600 text-zinc-950'
    return 'w-16 text-center bg-slate-400 text-zinc-950'
  }

  return (
    <div className="space-y-4">
      {display.map((item, idx) => (
        <div
          key={`${item.assumption}-${idx}`}
          className="space-y-1"
        >
          <div className="flex items-start gap-3 text-[17px] leading-[1.65] text-slate-800">
            <span
              className={`text-xs font-medium py-1 rounded-full shrink-0 mt-0.5 ${chipClass(item.confidence)}`}
            >
              {item.confidence === 'high' ? 'High' : item.confidence === 'medium' ? 'Medium' : 'Low'}
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="leading-relaxed">{cleanTextLocal(item.assumption)}</p>
              {item.why_it_matters ? (
                <p className="text-sm leading-relaxed text-slate-500">{cleanTextLocal(item.why_it_matters)}</p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

