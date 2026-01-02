/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { StagePills } from '@/components/stage-pills'
import { DecisionLoading } from '@/components/decision-loading'
import { ContinuationGate } from '@/components/continuation-gate'

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
  const [currentStepId, setCurrentStepId] = useState<(typeof STEP_ORDER)[number]>(STEP_ORDER[0])
  const [error, setError] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [winningOutcome, setWinningOutcome] = useState('')
  const [showContext, setShowContext] = useState(false)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const stepIndexRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const questionRef = useRef<HTMLTextAreaElement | null>(null)
  const contextRef = useRef<HTMLTextAreaElement | null>(null)
  const [showGate, setShowGate] = useState(false)

  const charCount = contextText.length
  const charColor =
    charCount >= 500 ? 'text-red-500' : charCount >= 450 ? 'text-amber-500' : 'text-gray-400'

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null
  }

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('decide_context_expanded') : null
    if (saved === 'true') setShowContext(true)
    return () => {
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('decide_context_expanded', showContext ? 'true' : 'false')
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
      setQuestionError('Question must be at least 10 characters and include letters.')
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
          winning_outcome: winningOutcome.trim() || null,
        }),
      })

      if (!response.ok) {
        if (response.status === 402) {
          setShowGate(true)
          setProcessing(false)
          return
        }
        try {
          const errJson = await response.json()
          setError(errJson?.error?.message || 'Request failed')
        } catch {
          const text = await response.text()
          setError(text || 'Request failed')
        }
        setProcessing(false)
        return
      }

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
              setWinningOutcome('')
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
    <main className="relative min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4">
        <div />
        <a
          href="/dashboard"
          className="text-sm text-gray-600 border border-gray-300 rounded-md px-3 py-2 hover:border-gray-400"
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
                className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none resize-none"
                placeholder="What decision are you stuck on?"
              />
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{question.length}/500</span>
                {questionError && <span className="text-rose-600">{questionError}</span>}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowContext((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-zinc-700"
              >
                <span className="inline-block">{showContext ? '▼' : '►'}</span>
                Add context (optional)
              </button>

              {showContext && (
                <div className="space-y-4 rounded-lg border border-zinc-200 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">Where are you?</span>
                      <span className="text-xs text-gray-500">We&apos;ll infer it if you skip this.</span>
                    </div>
                    <StagePills selected={stage} onSelect={setStage} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Context</span>
                      <span className={`text-xs ${charColor}`}>{charCount} / 500</span>
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none resize-none"
                      placeholder="Stage, goal, constraints — whatever shapes this decision."
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="winning_outcome"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      What does winning look like?
                      <span className="text-gray-500 font-normal ml-1">(optional)</span>
                    </label>

                    <textarea
                      id="winning_outcome"
                      name="winning_outcome"
                      placeholder="e.g., 3 customers pay within 2 weeks"
                      value={winningOutcome}
                      onChange={(e) => setWinningOutcome(e.target.value)}
                      maxLength={500}
                      rows={2}
                      className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      aria-describedby="winning_outcome_help winning_outcome_count"
                    />

                    <div className="flex justify-between items-center">
                      <span id="winning_outcome_help" className="text-xs text-gray-500">
                        Define success so we know if this worked
                      </span>
                      {winningOutcome.length > 0 && (
                        <span
                          id="winning_outcome_count"
                          className={`text-xs ${
                            winningOutcome.length > 450 ? 'text-amber-500' : 'text-gray-500'
                          }`}
                        >
                          {winningOutcome.length}/500
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!hasValidQuestion(question) || processing}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Make decision
            </button>
          </form>
        )}

        {showStatus && (
          <div className="py-12 space-y-4">
            <DecisionLoading question={question || 'Working on your decision...'} currentStep={currentStepId} />
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
            <div className="text-lg font-semibold text-gray-900">Something went wrong.</div>
            <div className="text-sm text-gray-700">{error}</div>
            <button
              type="button"
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
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

        {showGate && (
          <ContinuationGate
            onClose={() => setShowGate(false)}
            onUpgrade={async () => {
              try {
                const res = await fetch('/api/stripe/checkout', { method: 'POST' })
                const data = await res.json()
                if (data?.url) {
                  window.location.href = data.url as string
                }
              } catch {
                // ignore
              }
            }}
          />
        )}
      </div>
    </main>
  )
}


