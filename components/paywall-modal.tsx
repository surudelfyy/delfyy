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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md border border-border bg-card p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-card-foreground mb-2">
          Upgrade to keep deciding
        </h2>
        <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
          You&apos;ve used your 3 free decisions. Get unlimited decisions
          forever for £99.
        </p>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-1 h-11 bg-primary text-primary-foreground shadow-sm text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Get Lifetime Access — £99'}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
