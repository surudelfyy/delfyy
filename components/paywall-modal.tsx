'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url as string
      } else {
        throw new Error('No checkout URL')
      }
    } catch {
      toast.error('Failed to start checkout')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-900 p-6 rounded-none">
        <h2 className="text-xl font-semibold text-zinc-50 mb-2">
          Upgrade to keep deciding
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          You&apos;ve used your 3 free decisions. Get unlimited decisions
          forever for £99.
        </p>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-zinc-50 text-zinc-900 py-3 font-semibold border border-zinc-50 rounded-none hover:bg-transparent hover:text-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Get Lifetime Access — £99'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
