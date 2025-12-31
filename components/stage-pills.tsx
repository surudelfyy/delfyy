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
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-300 text-gray-700 hover:border-gray-400'
            )}
          >
            {stage}
          </button>
        )
      })}
    </div>
  )
}


