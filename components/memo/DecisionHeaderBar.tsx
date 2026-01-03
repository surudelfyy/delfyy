'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check, ChevronLeft, Copy, Upload } from 'lucide-react'

import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { decisionMemoToMarkdown } from '@/lib/utils/decision-memo-to-markdown'
import { renderDecisionView } from '@/lib/tone/render-decision-view'

type DecisionHeaderBarProps = {
  memo: DecisionMemo
  decisionId: string
  createdAt: string
  outcome?: 'successful' | 'failed' | null
  stage?: string | null
}

export function DecisionHeaderBar({
  memo,
  decisionId,
  createdAt,
  outcome = null,
  stage = null,
}: DecisionHeaderBarProps) {
  const [copied, setCopied] = useState(false)

  const buildMarkdown = () => {
    const base = decisionMemoToMarkdown(memo, {
      createdAt,
      outcome,
      stage,
    })
    return renderDecisionView({
      memoMarkdown: base,
      tone: 'calm-founder',
      channel: 'markdown',
    }).markdown
  }

  const copyAsMarkdown = async () => {
    const content = buildMarkdown()
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const exportMarkdown = () => {
    const content = buildMarkdown()
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `delfyy-decision-${decisionId}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <header className="flex items-center justify-between py-4 mb-6">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
        aria-label="Back to dashboard"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Dashboard</span>
      </Link>

      <div className="flex items-center gap-2">
        <button
          onClick={copyAsMarkdown}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          title="Copy document"
          aria-label="Copy document"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy document</span>
            </>
          )}
        </button>

        <button
          onClick={exportMarkdown}
          className="p-2 text-zinc-400 hover:text-zinc-100"
          title="Export"
          aria-label="Export"
        >
          <Upload className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
