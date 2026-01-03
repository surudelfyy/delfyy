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
  const items = useMemo(
    () => tradeOffs.map((t) => cleanTextLocal(t)).filter(Boolean),
    [tradeOffs],
  )

  if (!items.length) return null

  return (
    <div className="space-y-2 text-base leading-relaxed text-zinc-300">
      <p className="text-sm text-zinc-500">You&apos;re accepting:</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-zinc-300">
            <span className="text-zinc-500">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
