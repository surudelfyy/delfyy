'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Usage = { tier: 'free' | 'paid'; completedDecisions: number; limit: number } | null

interface NewDecisionButtonProps {
  usage: Usage
}

export function NewDecisionButton({ usage }: NewDecisionButtonProps) {
  const router = useRouter()
  const [showPaywall, setShowPaywall] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    const isFree = usage?.tier === 'free'
    const limit = usage?.limit ?? 3
    const completed = usage?.completedDecisions ?? 0
    if (isFree && completed >= limit) {
      setShowPaywall(true)
      return
    }
    setLoading(true)
    router.push('/decide')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60"
      >
        + New decision
      </button>

      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 p-6 shadow-xl space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-zinc-50">Upgrade to keep deciding</h2>
              <p className="text-sm text-zinc-400">
                You’ve used your 3 free decisions. Upgrade to create unlimited decisions.
              </p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 text-sm text-zinc-100">
              £85/year
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-600"
                onClick={() => setShowPaywall(false)}
              >
                Maybe later
              </button>
              <button
                type="button"
                className="rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

