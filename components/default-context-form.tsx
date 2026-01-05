'use client'

import { useState } from 'react'
import { saveDefaultContext } from '@/app/(dashboard)/settings/actions'
import { Button } from '@/components/ui/button'

interface Props {
  initialContext: string
  limit: number
}

export function DefaultContextForm({ initialContext, limit }: Props) {
  const [context, setContext] = useState(initialContext)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    const result = await saveDefaultContext(context)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Saved!' })
      setTimeout(() => setMessage(null), 2000)
    }
    setSaving(false)
  }

  const overLimit = context.length > limit
  const hasChanges = context !== initialContext

  return (
    <div className="space-y-3">
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="e.g., I'm building a SaaS for small businesses. We're at MVP stage with 50 beta users..."
        className="w-full h-32 px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          {context.length} / {limit}
        </span>

        <div className="flex items-center gap-3">
          {message && (
            <span
              className={`text-sm ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}
            >
              {message.text}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || overLimit || !hasChanges}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
