'use client'

import { useState } from 'react'
import { Copy, FileText, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { decisionCardToMarkdown, decisionCardToPlainText } from '@/lib/utils/decision-card-to-markdown'

interface DecisionCard {
  decision?: string
  confidence?: string
  assumptions?: string
  trade_offs?: string
  risks?: string
  next_step?: string
  review_trigger?: string
  escape_hatch?: string
  approach?: string
  principle?: string
  where_worked?: string
  where_failed?: string
  mechanism?: string
}

interface DecisionActionsProps {
  question: string
  card: DecisionCard
  confidenceTier?: string
}

export function DecisionActions({ question, card, confidenceTier }: DecisionActionsProps) {
  const [copiedType, setCopiedType] = useState<'markdown' | 'text' | null>(null)

  const copyToClipboard = async (type: 'markdown' | 'text') => {
    const content =
      type === 'markdown'
        ? decisionCardToMarkdown(question, card, confidenceTier)
        : decisionCardToPlainText(question, card, confidenceTier)

    try {
      await navigator.clipboard.writeText(content)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard('markdown')}
        className="justify-start gap-2"
      >
        {copiedType === 'markdown' ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        {copiedType === 'markdown' ? 'Copied!' : 'Copy Markdown'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard('text')}
        className="justify-start gap-2 text-gray-600"
      >
        {copiedType === 'text' ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {copiedType === 'text' ? 'Copied!' : 'Copy Plain Text'}
      </Button>

      {copiedType && (
        <p className="text-xs text-gray-500 mt-1">Paste into Notion, Confluence, or any doc</p>
      )}
    </div>
  )
}


