'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DecisionLoading } from './decision-loading'

const CATEGORY_LABELS = ['Strategy', 'Product', 'Feature', 'Operating'] as const
type CategoryLabel = (typeof CATEGORY_LABELS)[number]
type LevelHint = 'strategy' | 'product' | 'design_ux' | 'operations'

const LABEL_TO_HINT: Record<CategoryLabel, LevelHint> = {
  Strategy: 'strategy',
  Product: 'product',
  Feature: 'design_ux',
  Operating: 'operations',
}

const EXAMPLE_QUESTIONS: Record<LevelHint, string[]> = {
  strategy: [
    'Who should I target first?',
    'Free tier or paid-only?',
    'Pivot or persist?',
  ],
  product: [
    'What feature should I build next?',
    'Launch now or keep building?',
    'MVP or full product first?',
  ],
  design_ux: [
    'Should the default be on or off?',
    'Simplify the flow or add guidance?',
    'Reduce steps or add more clarity?',
  ],
  operations: [
    'Should I hire or outsource?',
    'Handle support myself or hire?',
    'Quit my job or stay employed?',
  ],
}

const PLACEHOLDERS = [
  'Who should I target first?',
  'What feature should I build next?',
  'Should the default be on or off?',
  'Should I hire or outsource?',
] as const

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

  const counterColor =
    question.length > 480 ? 'text-amber-500' : 'text-zinc-500'

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
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <textarea
          id="decision-input"
          aria-describedby={question.length > 400 ? 'char-count' : undefined}
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
          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 placeholder:italic p-3 sm:p-4 text-sm sm:text-base resize-none focus:outline-none focus:border-zinc-500 rounded-sm min-h-[100px] sm:min-h-[120px] disabled:opacity-60 disabled:pointer-events-none"
          maxLength={500}
          disabled={isSubmitting}
        />
      </div>

      {question.length > 400 && (
        <div id="char-count" className={`text-xs ${counterColor}`}>
          {question.length} of 500 characters used
        </div>
      )}

      {error && (
        <div className="text-sm text-rose-500 p-3 bg-rose-900/20 border border-rose-800 rounded-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          aria-disabled={!canSubmit}
          className="w-full border border-zinc-50 bg-zinc-100 text-zinc-900 px-4 py-3 text-sm sm:text-base font-semibold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-transparent hover:text-zinc-50 transition-colors rounded-sm"
        >
          {isSubmitting ? 'Processing...' : 'Get decision'}
        </button>
        <div className="font-mono text-xs text-zinc-600 text-center hidden sm:block">
          ⌘ + Enter
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORY_LABELS.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategory(category)}
              role="radio"
              aria-checked={selectedCategory === category}
              className={cn(
                'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border transition-colors rounded-sm',
                selectedCategory === category
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                  : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300',
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs sm:text-sm text-zinc-400 text-center sm:text-left">
          Or try one of these:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
                'bg-zinc-900 border border-zinc-800 p-3 sm:p-4 text-left hover:border-zinc-600 transition-colors rounded-sm text-xs sm:text-sm text-zinc-200',
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
