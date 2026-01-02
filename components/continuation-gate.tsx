'use client'

import { useEffect } from 'react'

interface ContinuationGateProps {
  onClose: () => void
  onUpgrade: () => void
}

export function ContinuationGate({ onClose, onUpgrade }: ContinuationGateProps) {
  useEffect(() => {
    // lightweight analytics event
    try {
      window.dispatchEvent(new CustomEvent('continuation_gate_viewed'))
    } catch {
      // ignore
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl space-y-6 focus:outline-none">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">You’ve reached the free decision limit</h2>
          <p className="text-sm text-gray-500">Delfyy is designed for repeat decisions — not one-offs.</p>
        </div>
        <p className="text-base text-gray-700 leading-relaxed">
          You’ve used your 3 free decisions to think more clearly and reduce uncertainty. To keep momentum, unlock
          unlimited decisions.
        </p>
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              try {
                window.dispatchEvent(new CustomEvent('continuation_gate_upgrade_clicked'))
              } catch {
                // ignore
              }
              onUpgrade()
            }}
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Unlock unlimited decisions
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            Maybe later
          </button>
        </div>
        <p className="text-xs text-gray-500">You’ll review options before anything is charged.</p>
      </div>
    </div>
  )
}

