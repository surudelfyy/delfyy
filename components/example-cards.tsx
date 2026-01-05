'use client'

import { cn } from '@/lib/utils'
import { LevelHint } from './level-hint-chips'

export type CategoryLabel =
  | 'Strategy'
  | 'Product'
  | 'UX & Design'
  | 'Operations'

const EXAMPLE_QUESTIONS: Record<LevelHint, string[]> = {
  strategy: [
    'Should I raise or bootstrap?',
    'Free tier or paid-only?',
    'Pivot or persist?',
  ],
  product: [
    'Launch now or keep building?',
    'Build feature X or fix onboarding?',
    'MVP or full product first?',
  ],
  design_ux: [
    'Simplify the flow or add guidance?',
    'Reduce steps or add more clarity?',
    'Test with 5 users or launch and learn?',
  ],
  operations: [
    'Hire my first dev or outsource?',
    'Handle support myself or hire?',
    'Quit my job or stay employed?',
  ],
}

interface ExampleCardsProps {
  selectedCategory: LevelHint | null
  onSelect: (_question: string) => void
  disabled?: boolean
}

export function ExampleCards({
  selectedCategory,
  onSelect,
  disabled,
}: ExampleCardsProps) {
  const hintKey: LevelHint = selectedCategory ?? 'strategy'
  const questions = EXAMPLE_QUESTIONS[hintKey]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => {
            if (disabled) return
            onSelect(question)
          }}
          className={cn(
            'bg-card border border-border p-4 text-left',
            'hover:border-input transition-colors rounded-xl text-sm text-foreground/90',
            disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
          )}
        >
          {question}
        </button>
      ))}
    </div>
  )
}
