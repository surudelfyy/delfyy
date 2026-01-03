'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { copyAsDocument, type DecisionDocument } from '@/lib/utils/copy-as-document'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CopyDocumentButtonProps {
  decision: DecisionDocument
  className?: string
}

export function CopyDocumentButton({ decision, className }: CopyDocumentButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyAsDocument(decision)

    if (success) {
      setCopied(true)
      toast.success('Copied — paste into Notion, Google Docs, or any notes app')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-50 transition-colors',
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy as Document
        </>
      )}
    </button>
  )
}

