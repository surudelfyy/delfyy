'use client'

import { useMemo } from 'react'

interface TradeOffLineProps {
  tradeOffs: string[]
}

function cleanTextLocal(text?: string): string {
  if (!text) return ''
  return text
    .replace(/—/g, ' - ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;!?])/g, '$1')
    .trim()
}

export function TradeOffLine({ tradeOffs }: TradeOffLineProps) {
  const items = useMemo(() => tradeOffs.map((t) => cleanTextLocal(t)).filter(Boolean), [tradeOffs])

  if (!items.length) return null

  return (
    <div className="space-y-2 text-[17px] leading-[1.65] text-slate-800">
      <p className="text-sm text-slate-600">You&apos;re accepting:</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-slate-800">
            <span className="text-slate-400">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

