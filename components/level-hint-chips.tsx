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
      <div className="text-sm text-muted-foreground">
        What&apos;s this about?{' '}
        <span className="text-muted-foreground">(optional)</span>
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
                'focus:outline-none focus:ring-2 focus:ring-ring',
                isSelected
                  ? 'bg-muted border-input text-foreground'
                  : 'bg-transparent border-border text-foreground/80 hover:bg-card',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                {opt.subtext}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Marketing &amp; Sales? Usually{' '}
        <span className="text-muted-foreground">Strategy</span> (go-to-market,
        pricing) or <span className="text-muted-foreground">Operations</span>{' '}
        (pipeline, partnerships).
      </p>
    </div>
  )
}
