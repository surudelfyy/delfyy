'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const PIPELINE_STEPS = [
  { id: 'classifying', active: 'Understanding your decision...', done: 'Decision understood' },
  { id: 'compiling', active: 'Gathering perspectives...', done: 'Perspectives gathered' },
  { id: 'evaluating', active: 'Evaluating from three angles...', done: 'Evaluated from three angles' },
  { id: 'synthesising', active: 'Forming recommendation...', done: 'Recommendation formed' },
  { id: 'matching', active: 'Finding real-world precedents...', done: 'Precedents found' },
  { id: 'rendering', active: 'Preparing your decision...', done: 'Decision ready' },
] as const

interface DecisionLoadingProps {
  question: string
  currentStep: string
}

export function DecisionLoading({ question, currentStep }: DecisionLoadingProps) {
  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-900 mb-8">{question}</h1>

      <div className="space-y-1.5">
        {PIPELINE_STEPS.map((step, index) => {
          const isComplete = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          if (!isComplete && !isCurrent) return null

          return (
            <div key={step.id} className="flex items-center gap-2">
              {isComplete ? (
                <>
                  <Check className="w-4 h-4 text-zinc-400" strokeWidth={2} />
                  <span className="text-sm text-zinc-400">{step.done}</span>
                </>
              ) : (
                <>
                  <span className="text-zinc-500 select-none">•</span>
                  <span className="text-sm text-zinc-600 animate-pulse">{step.active}</span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

