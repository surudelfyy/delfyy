'use client'

import clsx from 'clsx'

const STAGES = ['Discovery', 'Build', 'Launch', 'Growth'] as const

interface StagePillsProps {
  selected: string | null
  onSelect: (_stage: string | null) => void
}

export function StagePills({ selected, onSelect }: StagePillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STAGES.map((stage) => {
        const active = selected === stage
        return (
          <button
            key={stage}
            type="button"
            onClick={() => onSelect(active ? null : stage)}
            className={clsx(
              'border px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
            )}
          >
            {stage}
          </button>
        )
      })}
    </div>
  )
}
