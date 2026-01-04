'use client'

import { useCallback, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS = [
  'Strategy',
  'Product',
  'UX & Design',
  'Operations',
] as const
type CategoryLabel = (typeof CATEGORY_LABELS)[number]
type LevelHint = 'strategy' | 'product' | 'design_ux' | 'operations'

const LABEL_TO_HINT: Record<CategoryLabel, LevelHint> = {
  Strategy: 'strategy',
  Product: 'product',
  'UX & Design': 'design_ux',
  Operations: 'operations',
}

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

export function DecideInputShell() {
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryLabel | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(
    () => question.trim().length >= 10 && !isSubmitting,
    [question, isSubmitting],
  )

  const _levelHint = selectedCategory ? LABEL_TO_HINT[selectedCategory] : null

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setError(null)
    // Real SSE wiring will be added in a later prompt.
    // Payload will include user_level_hint: levelHint.
    try {
      // Placeholder for real submit
      await Promise.resolve()
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void handleSubmit()
      }
    },
    [handleSubmit],
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, 500)
    setQuestion(next)
  }

  const counterColor =
    question.length > 480 ? 'text-amber-500' : 'text-zinc-500'

  const handleCategory = (category: CategoryLabel) => {
    setSelectedCategory((prev) => (prev === category ? null : category))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="decision-input"
          className="text-sm font-semibold text-zinc-200"
        >
          What decision are you stuck on?
        </label>
        <textarea
          id="decision-input"
          aria-describedby={question.length > 400 ? 'char-count' : undefined}
          value={question}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="What decision are you stuck on?"
          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 p-4 text-lg resize-none focus:outline-none focus:border-zinc-500 rounded-sm min-h-[120px] disabled:opacity-60 disabled:pointer-events-none"
          maxLength={500}
          disabled={isSubmitting}
        />
      </div>

      {question.length > 400 && (
        <div id="char-count" className={`text-xs ${counterColor}`}>
          {question.length} of 500 characters used
        </div>
      )}

      {error && <div className="text-sm text-rose-500">{error}</div>}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          aria-disabled={!canSubmit}
          className="w-full border border-zinc-50 bg-zinc-100 text-zinc-900 px-4 py-3 text-sm font-semibold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-transparent hover:text-zinc-50 transition-colors rounded-sm"
        >
          {isSubmitting ? 'Processing...' : 'Get decision'}
        </button>
        <div className="text-xs text-zinc-600 text-center">⌘ + Enter</div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_LABELS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategory(category)}
              role="radio"
              aria-checked={selectedCategory === category}
              className={cn(
                'px-4 py-2 text-sm font-medium border transition-colors rounded-sm',
                selectedCategory === category
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300',
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          Marketing &amp; Sales? Usually{' '}
          <span className="text-zinc-400">Strategy</span> (go-to-market,
          pricing) or <span className="text-zinc-400">Operations</span>{' '}
          (partnerships).
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-zinc-400">Or try one of these:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {EXAMPLE_QUESTIONS[
            selectedCategory ? LABEL_TO_HINT[selectedCategory] : 'strategy'
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                if (isSubmitting) return
                setQuestion(example)
                requestAnimationFrame(() => {
                  if (typeof window !== 'undefined') {
                    const el =
                      document.querySelector<HTMLTextAreaElement>('textarea')
                    if (el) {
                      el.style.height = 'auto'
                      el.style.height = `${el.scrollHeight}px`
                    }
                  }
                })
              }}
              className={cn(
                'bg-zinc-900 border border-zinc-800 p-4 text-left hover:border-zinc-600 transition-colors rounded-sm text-sm text-zinc-200',
                isSubmitting &&
                  'opacity-50 pointer-events-none cursor-not-allowed',
              )}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
