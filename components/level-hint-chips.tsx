'use client'

import { cn } from '@/lib/utils'

export type LevelHint = 'strategy' | 'product' | 'design_ux' | 'operations'

interface LevelHintChipsProps {
  value: LevelHint | null
  onChange: (_value: LevelHint | null) => void
  disabled?: boolean
}

const LEVEL_OPTIONS: Array<{
  value: LevelHint
  label: string
  subtext: string
}> = [
  {
    value: 'strategy',
    label: 'Strategy',
    subtext: 'Market, positioning, pricing, channels',
  },
  {
    value: 'product',
    label: 'Product',
    subtext: 'Scope, architecture, packaging, what to build',
  },
  {
    value: 'design_ux',
    label: 'Design & UX',
    subtext: 'Flows, copy, friction, edge cases',
  },
  {
    value: 'operations',
    label: 'Operations',
    subtext: 'Hiring, process, partnerships, execution',
  },
]

export function LevelHintChips({
  value,
  onChange,
  disabled,
}: LevelHintChipsProps) {
  const handleClick = (clicked: LevelHint) => {
    if (disabled) return
    onChange(value === clicked ? null : clicked)
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-zinc-400">
        What&apos;s this about?{' '}
        <span className="text-zinc-500">(optional)</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEVEL_OPTIONS.map((opt) => {
          const isSelected = value === opt.value

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleClick(opt.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-start border px-3 py-2 text-left transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-zinc-500',
                isSelected
                  ? 'bg-zinc-800 border-zinc-500 text-zinc-100'
                  : 'bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-900',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="mt-0.5 text-xs text-zinc-500">
                {opt.subtext}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Marketing &amp; Sales? Usually{' '}
        <span className="text-zinc-400">Strategy</span> (go-to-market, pricing)
        or <span className="text-zinc-400">Operations</span> (pipeline,
        partnerships).
      </p>
    </div>
  )
}
