'use client'

import { AlertTriangle } from 'lucide-react'

export function ProvisionalBanner() {
  return (
    <div className="bg-amber-50/50 border border-amber-200/60 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-amber-100 rounded-md">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="font-medium text-amber-900 text-sm">Provisional Call</p>
          <p className="text-amber-700 text-sm mt-0.5">
            I&apos;m not sure yet. Here&apos;s my best guess + how to firm it up.
          </p>
        </div>
      </div>
    </div>
  )
}


