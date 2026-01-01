'use client'

import { RotateCcw, Zap } from 'lucide-react'

interface TriggerCardProps {
  reviewTrigger: string | null
  escapeHatch: string | null
}

export function TriggerCard({ reviewTrigger, escapeHatch }: TriggerCardProps) {
  if (!reviewTrigger && !escapeHatch) return null

  const rows = [
    reviewTrigger
      ? {
          icon: <RotateCcw className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />,
          label: 'Revisit if',
          text: reviewTrigger,
        }
      : null,
    escapeHatch
      ? {
          icon: <Zap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />,
          label: 'Switch if',
          text: escapeHatch,
        }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; text: string }[]

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
      {rows.map((row, idx) => (
        <div key={idx} className="flex items-start gap-3">
          {row.icon}
          <div className="flex gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide w-20 flex-shrink-0">
              {row.label}
            </span>
            <span className="text-sm text-slate-700 leading-relaxed">{row.text}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

