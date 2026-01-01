/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ProgressStepper, PROGRESS_STEPS } from '@/components/progress-stepper'
import { StagePills } from '@/components/stage-pills'

const TIPS = [
  'Founders who document decisions are 2x more likely to follow through.',
  "The best decisions have clear 'change course if' triggers.",
  "A decision you can defend beats a perfect decision you can't explain.",
  "The goal isn't certainty — it's clarity on what to do next.",
  'Most founders revisit pricing decisions 3x before committing.',
] as const

const STEP_ORDER = [
  'classifying',
  'compiling',
  'evaluating',
  'governing',
  'synthesising',
  'matching',
  'rendering',
] as const

// ============================================
// DATE HELPERS
// ============================================

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function getMaxDate(): string {
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 90)
  return maxDate.toISOString().split('T')[0]
}

function getDefaultCheckInDate(): string {
  const defaultDate = new Date()
  defaultDate.setDate(defaultDate.getDate() + 7)
  return defaultDate.toISOString().split('T')[0]
}

function toISODateTime(dateString: string): string {
  return new Date(`${dateString}T09:00:00Z`).toISOString()
}

export default function DecidePage() {
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [contextText, setContextText] = useState('')
  const [stage, setStage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [winningOutcome, setWinningOutcome] = useState('')
  const [checkInDate, setCheckInDate] = useState(getDefaultCheckInDate())
  const [checkInDateError, setCheckInDateError] = useState<string | null>(null)
  const time20Ref = useRef<NodeJS.Timeout | null>(null)
  const time45Ref = useRef<NodeJS.Timeout | null>(null)
  const [timeout20, setTimeout20] = useState(false)
  const [timeout45, setTimeout45] = useState(false)
  const stepIndexRef = useRef(0)
  const [tipIndex, setTipIndex] = useState(0)

  const charCount = contextText.length
  const charColor =
    charCount >= 500 ? 'text-red-500' : charCount >= 450 ? 'text-amber-500' : 'text-gray-400'

  const clearTimers = () => {
    if (time20Ref.current) clearTimeout(time20Ref.current)
    if (time45Ref.current) clearTimeout(time45Ref.current)
    time20Ref.current = null
    time45Ref.current = null
    setTimeout20(false)
    setTimeout45(false)
  }

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (!processing) return
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [processing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim().length < 10 || processing) return

    if (checkInDate) {
      const selectedDate = new Date(checkInDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate <= today) {
        setCheckInDateError('Check-in date must be in the future')
        return
      }
    }
    setCheckInDateError(null)

    setProcessing(true)
    setError(null)
    setCurrentStepIndex(0) // show activity immediately
    stepIndexRef.current = 0

    time20Ref.current = setTimeout(() => setTimeout20(true), 20_000)
    time45Ref.current = setTimeout(() => setTimeout45(true), 45_000)

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
          check_in_date: checkInDate ? toISODateTime(checkInDate) : null,
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
          const match = eventText.match(/event: (\w+)\ndata: ([\s\S]+)/)
          if (!match) continue
          const [, eventType, dataStr] = match
          let data: any
          try {
            data = JSON.parse(dataStr)
          } catch {
            continue
          }
          if (eventType === 'progress') {
            const stepIdx = STEP_ORDER.indexOf(data.step)
            if (stepIdx !== -1 && stepIdx > stepIndexRef.current) {
              stepIndexRef.current = stepIdx
              setCurrentStepIndex(stepIdx)
            }
          } else if (eventType === 'result') {
            clearTimers()
            setWinningOutcome('')
            setCheckInDate(getDefaultCheckInDate())
            setCheckInDateError(null)
            router.push(`/decisions/${data.decision_id}`)
            return
          } else if (eventType === 'error') {
            clearTimers()
            setError(data.message || 'Something went wrong')
            setProcessing(false)
            return
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
  const showStepper = processing && !error

  return (
    <main className="relative min-h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/delfyylogo.svg" alt="Delfyy" width={120} height={40} priority />
        </div>
        <a
          href="/dashboard"
          className="text-sm text-gray-600 border border-gray-300 rounded-md px-3 py-2 hover:border-gray-400"
        >
          Cancel
        </a>
      </header>

      <div className="mx-auto max-w-2xl px-6 pb-16">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                What are you deciding?
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                minLength={10}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none"
                placeholder="One sentence. Write it like you'd message a cofounder"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-900">Where are you?</label>
                <span className="text-xs text-gray-500">We&apos;ll infer it if you skip this.</span>
              </div>
              <StagePills selected={stage} onSelect={setStage} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-900">Context</label>
                <span className={`text-xs ${charColor}`}>
                  {charCount} / 500
                </span>
              </div>
              <textarea
                value={contextText}
                onChange={(e) => {
                  const next = e.target.value
                  if (next.length <= 500) setContextText(next)
                }}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none"
                placeholder="Stage, goal, constraints — whatever shapes this decision."
              />
            </div>

            {/* ============================================ */}
            {/* WINNING OUTCOME FIELD */}
            {/* ============================================ */}
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

            {/* ============================================ */}
            {/* CHECK-IN DATE FIELD */}
            {/* ============================================ */}
            <div className="space-y-2">
              <label
                htmlFor="check_in_date"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                When should we check in?
              </label>

              <input
                id="check_in_date"
                name="check_in_date"
                type="date"
                value={checkInDate}
                onChange={(e) => {
                  setCheckInDate(e.target.value)
                  setCheckInDateError(null)
                }}
                min={getTomorrowDate()}
                max={getMaxDate()}
                required
                className="flex h-9 w-full sm:w-auto rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                aria-describedby="check_in_date_help check_in_date_error"
              />

              <p id="check_in_date_help" className="text-xs text-gray-500">
                We&apos;ll ask if your decision held
              </p>

              {checkInDateError && (
                <p id="check_in_date_error" className="text-xs text-red-500" role="alert">
                  {checkInDateError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={question.trim().length < 10}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Get one clear call
            </button>
          </form>
        )}

        {showStepper && (
          <div className="flex flex-col items-center py-16">
            <ProgressStepper currentStep={currentStepIndex} />
            <p className="text-sm text-gray-400 text-center mt-10 max-w-md transition-opacity duration-500">
              {TIPS[tipIndex]}
            </p>
            {timeout20 && !timeout45 && (
              <p className="text-sm text-gray-500 mt-6">Still working — this one needs extra thought.</p>
            )}
            {timeout45 && (
              <p className="text-sm text-gray-500 mt-6">Almost there — finalising the recommendation.</p>
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
                setCurrentStepIndex(0)
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


