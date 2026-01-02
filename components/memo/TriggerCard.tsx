'use client'

import { RotateCcw, AlertTriangle } from 'lucide-react'

interface TriggerCardProps {
  reviewTrigger: string | null
  escapeHatch: string | null
}

export function TriggerCard({ reviewTrigger, escapeHatch }: TriggerCardProps) {
  if (!reviewTrigger && !escapeHatch) return null

  return (
    <div className="space-y-3">
      {reviewTrigger && (
        <div className="border-l-2 border-slate-300 bg-slate-50 p-4 rounded-r-lg">
          <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Revisit if
          </p>
          <p className="text-sm text-slate-900 mt-1">{reviewTrigger}</p>
        </div>
      )}

      {escapeHatch && (
        <div className="border-l-2 border-rose-300 bg-rose-50 p-4 rounded-r-lg">
          <p className="text-sm font-medium text-rose-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Switch immediately if
          </p>
          <p className="text-sm text-rose-900 mt-1">{escapeHatch}</p>
        </div>
      )}
    </div>
  )
}

