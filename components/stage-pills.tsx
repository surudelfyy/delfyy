'use client'

import clsx from 'clsx'

const STAGES = ['Discovery', 'Build', 'Launch', 'Growth'] as const

interface StagePillsProps {
  selected: string | null
  onSelect: (stage: string | null) => void
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
              'rounded-full border px-3 py-1 text-sm transition',
              active
                ? 'border-zinc-50 bg-zinc-50 text-zinc-950'
                : 'border-zinc-700 text-zinc-300 hover:border-zinc-600'
            )}
          >
            {stage}
          </button>
        )
      })}
    </div>
  )
}


