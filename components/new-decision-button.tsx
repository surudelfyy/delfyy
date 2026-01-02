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

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url as string
      }
    } catch {
      // ignore
    }
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">Upgrade to keep deciding</h2>
              <p className="text-sm text-gray-600">
                You’ve used your 3 free decisions. Upgrade to create unlimited decisions.
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-800">
              £85/year
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                onClick={() => setShowPaywall(false)}
              >
                Maybe later
              </button>
              <button
                type="button"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                onClick={handleUpgrade}
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

