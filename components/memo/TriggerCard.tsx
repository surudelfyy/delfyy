'use client'

// icons removed (unused)

interface TriggerCardProps {
  reviewTrigger: string | null
  escapeHatch: string | null
}

export function TriggerCard({ reviewTrigger, escapeHatch }: TriggerCardProps) {
  if (!reviewTrigger && !escapeHatch) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      {reviewTrigger && (
        <div>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {reviewTrigger}
          </p>
        </div>
      )}

      {escapeHatch && (
        <div>
          <p className="text-xs sm:text-sm font-medium text-zinc-500 uppercase tracking-wide mb-1.5 sm:mb-2">
            Escape hatch
          </p>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            {escapeHatch}
          </p>
        </div>
      )}
    </div>
  )
}
