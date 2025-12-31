'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { renderDecisionCardMarkdown } from '@/lib/utils/render-decision-card-markdown'
import type { DecisionCard } from '@/lib/schemas/decision-card'

interface DecisionActionsProps {
  card: DecisionCard
}

export function DecisionActions({ card }: DecisionActionsProps) {
  const [copied, setCopied] = useState(false)

  const copyDecision = async () => {
    const content = renderDecisionCardMarkdown(card)

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

  return (
    <div className="relative group inline-block">
      <Button variant="outline" size="sm" onClick={copyDecision} className="gap-2">
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy decision
          </>
        )}
      </Button>

      {!copied && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Formatted for Notion, Confluence, Docs
        </div>
      )}
    </div>
  )
}


