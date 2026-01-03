'use client'

// icons removed (unused)

interface TriggerCardProps {
  reviewTrigger: string | null
  escapeHatch: string | null
}

export function TriggerCard({ reviewTrigger, escapeHatch }: TriggerCardProps) {
  if (!reviewTrigger && !escapeHatch) return null

  return (
    <div className="space-y-6">
      {reviewTrigger && (
        <div>
          <p className="text-zinc-300 leading-relaxed">{reviewTrigger}</p>
        </div>
      )}

      {escapeHatch && (
        <div>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-2">
            Escape hatch
          </p>
          <p className="text-zinc-300 leading-relaxed">{escapeHatch}</p>
        </div>
      )}
    </div>
  )
}
