'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { decisionCardToMarkdown } from '@/lib/utils/decision-card-to-markdown'
import { decisionCardToPlainText } from '@/lib/utils/decision-card-to-plain-text'
import type { DecisionCard } from '@/lib/schemas/decision-card'

interface DecisionActionsProps {
  card: DecisionCard
  showPlainText?: boolean
  buttonSize?: 'sm' | 'md'
}

export function DecisionActions({ card, showPlainText = false, buttonSize = 'sm' }: DecisionActionsProps) {
  const [copiedMarkdown, setCopiedMarkdown] = useState(false)
  const [copiedText, setCopiedText] = useState(false)

  const copyDecision = async () => {
    const content = decisionCardToMarkdown(card.summary.title, card, card.meta.confidence_tier)

    try {
      await navigator.clipboard.writeText(content)
      setCopiedMarkdown(true)
      setTimeout(() => setCopiedMarkdown(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedMarkdown(true)
      setTimeout(() => setCopiedMarkdown(false), 2000)
    }
  }

  const copyPlain = async () => {
    const content = decisionCardToPlainText(card.summary.title, card, card.meta.confidence_tier)
    try {
      await navigator.clipboard.writeText(content)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    }
  }

  return (
    <div className="relative group inline-flex items-center gap-2">
      <Button variant="outline" size={buttonSize} onClick={copyDecision} className="gap-2">
        {copiedMarkdown ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy as Markdown
          </>
        )}
      </Button>

      {showPlainText && (
        <Button variant="ghost" size={buttonSize} onClick={copyPlain} className="gap-2 text-gray-600">
          {copiedText ? (
            <>
              <Check className="h-4 w-4 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy plain text
            </>
          )}
        </Button>
      )}
    </div>
  )
}


