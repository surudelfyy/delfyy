'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DecisionLoading } from './decision-loading'

const CATEGORY_LABELS = [
  'Strategy',
  'Product',
  'Design & UX',
  'Operations',
] as const
type CategoryLabel = (typeof CATEGORY_LABELS)[number]
type LevelHint = 'strategy' | 'product' | 'design_ux' | 'operations'

const LABEL_TO_HINT: Record<CategoryLabel, LevelHint> = {
  Strategy: 'strategy',
  Product: 'product',
  'Design & UX': 'design_ux',
  Operations: 'operations',
}

const PLACEHOLDERS = [
  'What decision are you stuck on?',
  'Should I charge from day one or offer a free tier?',
  'Who should I target first?',
  'Should I hire or outsource?',
] as const

const EXAMPLE_QUESTIONS: Record<CategoryLabel | 'default', string[]> = {
  Strategy: [
    'Should I raise or bootstrap?',
    'Free tier or paid-only?',
    'Pivot or persist?',
  ],
  Product: [
    'Launch now or keep building?',
    'Build feature X or fix onboarding?',
    'MVP or full product first?',
  ],
  'Design & UX': [
    'User interviews or analytics first?',
    'Simplify the flow or add guidance?',
    'Test with 5 users or launch and learn?',
  ],
  Operations: [
    'Hire my first dev or outsource?',
    'Handle support myself or hire?',
    'Quit my job or stay employed?',
  ],
  default: [
    'Should I raise or bootstrap?',
    'Free tier or paid-only?',
    'Pivot or persist?',
  ],
}

export function DecideInputShell() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryLabel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [placeholder, setPlaceholder] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isFocused, setIsFocused] = useState(false)

  const canSubmit = useMemo(
    () => question.trim().length >= 10 && !isSubmitting,
    [question, isSubmitting],
  )

  const levelHint = selectedCategory ? LABEL_TO_HINT[selectedCategory] : null

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setCurrentStep('classifying')
    setError(null)
    try {
      const idempotencyKey =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : undefined

      const response = await fetch('/api/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          user_level_hint: levelHint,
          idempotency_key: idempotencyKey,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to submit')
      }

      if (!response.body) {
        throw new Error('No response body from server')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let gotResult = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const eventText of events) {
          if (!eventText.trim()) continue
          if (eventText.startsWith(':')) continue

          const lines = eventText.split('\n').filter(Boolean)
          const eventLine = lines.find((l) => l.startsWith('event: '))
          const dataLine = lines.find((l) => l.startsWith('data: '))
          if (!eventLine || !dataLine) continue

          const eventType = eventLine.replace('event: ', '').trim()
          const dataStr = dataLine.replace('data: ', '')

          try {
            const data = JSON.parse(dataStr) as {
              decision_id?: string
              message?: string
              step?: string
            }

            if (eventType === 'result' && data.decision_id) {
              router.push(`/decisions/${data.decision_id}`)
              gotResult = true
              return
            }
            if (eventType === 'progress') {
              if (typeof data.step === 'string') {
                setCurrentStep(data.step)
              }
              continue
            }
            if (eventType === 'error') {
              throw new Error(data.message || 'Something went wrong')
            }
          } catch {
            // ignore malformed event
            continue
          }
        }
      }

      if (!gotResult) {
        throw new Error('Stream ended unexpectedly. Please try again.')
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      setError(message)
      setCurrentStep('')
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, levelHint, question, router])

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

  useEffect(() => {
    if (isFocused || question.trim()) {
      return
    }

    const text = PLACEHOLDERS[placeholderIndex]
    let charIndex = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const typeInterval = setInterval(() => {
      if (charIndex <= text.length) {
        setPlaceholder(text.slice(0, charIndex))
        charIndex += 1
      } else {
        clearInterval(typeInterval)
        timeoutId = setTimeout(() => {
          setPlaceholder('')
          setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length)
        }, 2000)
      }
    }, 50)

    return () => {
      clearInterval(typeInterval)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [placeholderIndex, isFocused, question])

  const handleCategory = (category: CategoryLabel) => {
    setSelectedCategory((prev) => (prev === category ? null : category))
  }

  if (isSubmitting) {
    return (
      <DecisionLoading
        question={question || 'Working on your decision...'}
        currentStep={currentStep}
      />
    )
  }

  return (
    <div>
      {/* Main container */}
      <div
        className={cn(
          'bg-card border border-border rounded-xl',
          'p-4 sm:p-6',
          'transition-all duration-150',
          'focus-within:border-ring',
        )}
      >
        {/* Textarea */}
        <textarea
          id="decision-input"
          value={question}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            setPlaceholder('')
          }}
          onBlur={() => {
            setIsFocused(false)
          }}
          placeholder={placeholder}
          className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground text-base sm:text-lg resize-none"
          maxLength={500}
          disabled={isSubmitting}
        />

        {/* Character counter */}
        <div className="text-sm text-muted-foreground text-right">
          {question.length}/500
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-destructive mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            {error}
          </div>
        )}

        {/* Bottom row: chips left, submit right (desktop) */}
        <div className="mt-4 pt-4 border-t border-border">
          {/* Desktop layout: chips and button in same row */}
          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-4">
            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleCategory(label)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150',
                    selectedCategory === label
                      ? 'bg-primary text-primary-foreground border border-primary'
                      : 'bg-secondary text-secondary-foreground border border-border hover:bg-accent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Submit button - icon only on desktop */}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
              className={cn(
                'h-11 w-11 rounded-xl flex items-center justify-center',
                'bg-secondary border border-border text-foreground',
                'hover:bg-accent transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'shrink-0',
              )}
              aria-label="Submit decision"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile layout: chips then full-width button */}
          <div className="sm:hidden space-y-4">
            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {CATEGORY_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleCategory(label)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full transition-colors duration-150',
                    selectedCategory === label
                      ? 'bg-primary text-primary-foreground border border-primary'
                      : 'bg-secondary text-secondary-foreground border border-border hover:bg-accent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Submit button - full width on mobile */}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
              className={cn(
                'h-11 w-full rounded-xl flex items-center justify-center',
                'bg-secondary border border-border text-foreground font-medium',
                'hover:bg-accent transition-colors duration-150',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              Get Decision
            </button>
          </div>
        </div>
      </div>

      {/* Helper text outside container */}
      <p className="text-sm text-muted-foreground mt-4 text-center">
        The more context you give, the better the decision.
      </p>

      {/* Example question cards */}
      <div className="mt-6">
        <p className="text-muted-foreground text-sm mb-3">
          Or try one of these:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {EXAMPLE_QUESTIONS[selectedCategory || 'default'].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className="bg-card border border-border p-4 text-left hover:bg-accent hover:border-ring transition-all duration-150 rounded-xl group"
            >
              <p className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">
                {q}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
