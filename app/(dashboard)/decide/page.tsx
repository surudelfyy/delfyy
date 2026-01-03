 
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StagePills } from '@/components/stage-pills'
import { DecisionLoading } from '@/components/decision-loading'

const STEP_ORDER = [
  'classifying',
  'compiling',
  'evaluating',
  'governing',
  'synthesising',
  'matching',
  'rendering',
] as const

export default function DecidePage() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [contextText, setContextText] = useState('')
  const [stage, setStage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentStepId, setCurrentStepId] = useState<
    (typeof STEP_ORDER)[number]
  >(STEP_ORDER[0])
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const stepIndexRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const questionRef = useRef<HTMLTextAreaElement | null>(null)
  const contextRef = useRef<HTMLTextAreaElement | null>(null)

  const charCount = contextText.length
  const charColor =
    charCount >= 500
      ? 'text-red-500'
      : charCount >= 450
        ? 'text-amber-500'
        : 'text-zinc-600'

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  useEffect(() => {
    const saved =
      typeof window !== 'undefined'
        ? localStorage.getItem('decide_context_expanded')
        : null
    if (saved === 'true') setShowContext(true)
    return () => {
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(
      'decide_context_expanded',
      showContext ? 'true' : 'false',
    )
  }, [showContext])

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    autoResize(questionRef.current)
  }, [question])

  useEffect(() => {
    autoResize(contextRef.current)
  }, [contextText])

  const hasValidQuestion = (value: string) => {
    const trimmed = value.trim()
    if (trimmed.length < 10) return false
    return /[A-Za-z]/.test(trimmed)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (processing) return
    if (!hasValidQuestion(question)) {
      setQuestionError(
        'Question must be at least 10 characters and include letters.',
      )
      return
    }
    setQuestionError(null)

    setProcessing(true)
    setError(null)
    setCurrentStepId(STEP_ORDER[0]) // show activity immediately
    stepIndexRef.current = 0
    setTimedOut(false)
    clearTimers()
    timeoutRef.current = setTimeout(() => setTimedOut(true), 90_000)

    try {
      const response = await fetch('/api/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: {
            stage: stage ? stage.toLowerCase() : undefined,
            freeform: contextText || undefined,
          },
        }),
      })

      if (!response.body) {
        throw new Error('No response body from server')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() || ''

        for (const eventText of events) {
          if (!eventText.trim()) continue
          if (eventText.startsWith(':')) continue // heartbeat

          const lines = eventText.split('\n').filter(Boolean)
          const eventLine = lines.find((l) => l.startsWith('event: '))
          const dataLine = lines.find((l) => l.startsWith('data: '))
          if (!eventLine || !dataLine) continue

          const eventType = eventLine.replace('event: ', '').trim()
          const dataStr = dataLine.replace('data: ', '')

          try {
            const data = JSON.parse(dataStr)
            console.log('[sse] event', eventType, data)

            if (eventType === 'progress') {
              const stepIdx = STEP_ORDER.indexOf(data.step)
              if (stepIdx !== -1) {
                setCurrentStepId(STEP_ORDER[stepIdx])
              }
              if (stepIdx !== -1 && stepIdx > stepIndexRef.current) {
                stepIndexRef.current = stepIdx
              }
            } else if (eventType === 'result') {
              clearTimers()
              router.push(`/decisions/${data.decision_id}`)
              return
            } else if (eventType === 'error') {
              clearTimers()
              setError(data.message || 'Something went wrong')
              setProcessing(false)
              return
            }
          } catch {
            continue
          }
        }
      }

      // If we exit loop without result
      clearTimers()
      setError('Stream ended unexpectedly. Please try again.')
      setProcessing(false)
    } catch (err) {
      clearTimers()
      setError((err as Error).message)
      setProcessing(false)
    }
  }

  const showForm = !processing && !error
  const showStatus = processing && !error

  return (
    <main className="relative min-h-screen bg-zinc-950">
      <header className="flex items-center justify-between px-6 py-4">
        <div />
        <a
          href="/dashboard"
          className="text-sm text-zinc-400 border border-zinc-700 px-3 py-2 hover:border-zinc-500 hover:text-zinc-300"
        >
          Cancel
        </a>
      </header>

      <div className="mx-auto max-w-2xl px-6 pb-16">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
            <div className="space-y-2">
              <textarea
                ref={questionRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value)
                  setQuestionError(null)
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    void handleSubmit(e)
                  }
                }}
                maxLength={500}
                rows={3}
                className="w-full border-2 border-zinc-700 bg-transparent px-4 py-3 text-base text-zinc-50 focus:border-zinc-50 focus:outline-none resize-none placeholder:text-zinc-600"
                placeholder="What decision are you stuck on?"
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{question.length}/500</span>
                {questionError && (
                  <span className="text-rose-600">{questionError}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowContext((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-300"
              >
                <span className="inline-block">{showContext ? '▼' : '►'}</span>
                Add context (optional)
              </button>

              {showContext && (
                <div className="space-y-4 border border-zinc-700 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-50">
                        Where are you?
                      </span>
                      <span className="text-xs text-zinc-500">
                        We&apos;ll infer it if you skip this.
                      </span>
                    </div>
                    <StagePills selected={stage} onSelect={setStage} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-50">
                        Context
                      </span>
                      <span className={`text-xs ${charColor}`}>
                        {charCount} / 500
                      </span>
                    </div>
                    <textarea
                      ref={contextRef}
                      value={contextText}
                      onChange={(e) => {
                        const next = e.target.value
                        if (next.length <= 500) setContextText(next)
                      }}
                      maxLength={500}
                      rows={2}
                      className="w-full border border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-50 focus:border-zinc-50 focus:outline-none resize-none placeholder:text-zinc-600"
                      placeholder="Stage, goal, constraints — whatever shapes this decision."
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!hasValidQuestion(question) || processing}
              className="w-full border-2 border-zinc-50 bg-zinc-50 px-4 py-3 text-zinc-950 text-sm font-semibold uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-transparent hover:text-zinc-50 transition-colors"
            >
              Make decision
            </button>
          </form>
        )}

        {showStatus && (
          <div className="py-12 space-y-4">
            <DecisionLoading
              question={question || 'Working on your decision...'}
              currentStep={currentStepId}
            />
            {timedOut && (
              <div className="text-sm text-zinc-500">
                This is taking longer than usual.
                <button
                  type="button"
                  className="underline ml-1"
                  onClick={() => {
                    clearTimers()
                    setProcessing(false)
                    setTimedOut(false)
                  }}
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 text-center space-y-3">
            <div className="text-3xl">⚠️</div>
            <div className="text-lg font-semibold text-zinc-50">
              Something went wrong.
            </div>
            <div className="text-sm text-zinc-300">{error}</div>
            <button
              type="button"
              className="border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-50 hover:text-zinc-50"
              onClick={() => {
                setError(null)
                setProcessing(false)
                setCurrentStepId(STEP_ORDER[0])
                clearTimers()
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
