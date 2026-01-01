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

interface TradeOffLineProps {
  tradeOffs: string[]
  maxChars?: number
}

function joinWithAnd(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function splitClauses(text: string): string[] {
  return text
    .split(/[,;]+/)
    .map((t) => cleanTextLocal(t))
    .map((t) => t.replace(/^\band\b\s+/i, '').trim())
    .filter(Boolean)
}

function normalizeCase(clauses: string[]): string[] {
  if (!clauses.length) return clauses
  return clauses.map((clause, idx) => {
    if (idx === 0) return clause
    const firstWordMatch = clause.match(/^([A-Za-z]+)(.*)$/)
    if (!firstWordMatch) return clause
    const [_, first, rest] = firstWordMatch
    const isAcronym = first === first.toUpperCase() && first.length <= 5
    const lowered = isAcronym ? first : first.toLowerCase()
    return `${lowered}${rest}`
  })
}

export function TradeOffLine({ tradeOffs }: TradeOffLineProps) {
  const text = useMemo(() => {
    const clauses = tradeOffs.flatMap((t) => splitClauses(t))
    const normalized = normalizeCase(clauses)
    return joinWithAnd(normalized)
  }, [tradeOffs])

  if (!tradeOffs?.length || !text) return null

  return (
    <div className="text-[17px] leading-[1.65] text-slate-800">
      <span className="text-slate-500">You're accepting </span>
      <span>{text}</span>
    </div>
  )
}

