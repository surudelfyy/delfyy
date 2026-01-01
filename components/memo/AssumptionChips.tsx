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

function ConfidenceMark({ confidence }: { confidence: Confidence }) {
  if (confidence === 'high') {
    return (
      <span
        aria-label="high confidence"
        className="h-4 w-4 shrink-0 rounded-full bg-slate-400"
      />
    )
  }

  if (confidence === 'medium') {
    return (
      <span
        aria-label="medium confidence"
        className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full border border-slate-400"
      >
        <span className="absolute inset-0 w-1/2 bg-slate-400/70" />
      </span>
    )
  }

  return (
    <span
      aria-label="low confidence"
      className="h-4 w-4 shrink-0 rounded-full border border-slate-400"
    />
  )
}

export function AssumptionChips({ assumptions }: AssumptionChipsProps) {
  const display = useMemo(() => {
    if (!assumptions?.length) return []
    return [...assumptions].sort(
      (a, b) => confidenceRank[a.confidence] - confidenceRank[b.confidence]
    )
  }, [assumptions])

  if (!assumptions?.length) return null

  return (
    <div className="space-y-4">
      {display.map((item, idx) => (
        <div
          key={`${item.assumption}-${idx}`}
          className="flex items-start gap-3 text-[17px] leading-[1.65] text-slate-800"
        >
          <span className="mt-[3px] inline-flex h-4 w-4 items-center justify-center">
            <ConfidenceMark confidence={item.confidence} />
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="leading-relaxed">{cleanTextLocal(item.assumption)}</p>
            {item.why_it_matters ? (
              <p className="text-sm leading-relaxed text-slate-500">
                {cleanTextLocal(item.why_it_matters)}
              </p>
            ) : null}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Confidence levels</span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <ConfidenceMark confidence="high" /> high
          </span>
          <span className="inline-flex items-center gap-1">
            <ConfidenceMark confidence="medium" /> medium
          </span>
          <span className="inline-flex items-center gap-1">
            <ConfidenceMark confidence="low" /> low
          </span>
        </span>
      </div>
    </div>
  )
}

