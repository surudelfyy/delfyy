'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, Copy, Upload } from 'lucide-react'

import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { decisionMemoToMarkdown } from '@/lib/utils/decision-memo-to-markdown'
import { renderDecisionView } from '@/lib/tone/render-decision-view'

type DecisionHeaderBarProps = {
  memo: DecisionMemo
  decisionId: string
}

export function DecisionHeaderBar({
  memo,
  decisionId,
}: DecisionHeaderBarProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const buildMarkdown = () => {
    const base = decisionMemoToMarkdown(memo)
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
      setTimeout(() => setCopied(false), 1600)
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
      setTimeout(() => setCopied(false), 1600)
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
      <button
        onClick={() => router.back()}
        className="p-2 text-zinc-400 hover:text-zinc-100"
        title="Back to all decisions"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1">
        <button
          onClick={copyAsMarkdown}
          className="p-2 text-zinc-400 hover:text-zinc-100"
          title="Copy as Markdown"
          aria-label="Copy"
        >
          {copied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
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
