'use client'

import { Check } from 'lucide-react'

const PIPELINE_STEPS = [
  {
    id: 'classifying',
    active: 'Understanding your decision...',
    done: 'Decision understood',
  },
  {
    id: 'compiling',
    active: 'Gathering perspectives...',
    done: 'Perspectives gathered',
  },
  {
    id: 'evaluating',
    active: 'Evaluating from three angles...',
    done: 'Evaluated from three angles',
  },
  {
    id: 'synthesising',
    active: 'Forming recommendation...',
    done: 'Recommendation formed',
  },
  {
    id: 'matching',
    active: 'Finding real-world precedents...',
    done: 'Precedents found',
  },
  {
    id: 'rendering',
    active: 'Preparing your decision...',
    done: 'Decision ready',
  },
] as const

interface DecisionLoadingProps {
  question: string
  currentStep: string
}

export function DecisionLoading({
  question,
  currentStep,
}: DecisionLoadingProps) {
  const currentStepIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0 py-8 sm:py-12">
      <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mb-6 sm:mb-8 break-words">
        {question}
      </h1>

      <div className="space-y-2 sm:space-y-1.5">
        {PIPELINE_STEPS.map((step, index) => {
          const isComplete = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          if (!isComplete && !isCurrent) return null

          return (
            <div key={step.id} className="flex items-center gap-2">
              {isComplete ? (
                <>
                  <Check
                    className="w-4 h-4 text-zinc-400 shrink-0"
                    strokeWidth={2}
                  />
                  <span className="font-mono text-sm text-zinc-400">
                    {step.done}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-zinc-500 select-none shrink-0">•</span>
                  <span className="font-mono text-sm text-zinc-300 animate-pulse">
                    {step.active}
                  </span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
