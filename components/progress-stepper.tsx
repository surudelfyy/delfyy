/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import clsx from 'clsx'

export const PROGRESS_STEPS = [
  { key: 'classifying', label: 'Understanding the decision' },
  { key: 'compiling', label: 'Gathering relevant perspectives' },
  { key: 'evaluating', label: 'Evaluating trade-offs' },
  { key: 'governing', label: 'Checking assumptions' },
  { key: 'synthesising', label: 'Forming a clear call' },
  { key: 'matching', label: 'Finding real examples' },
  { key: 'rendering', label: 'Preparing your decision' },
] as const

interface ProgressStepperProps {
  currentStep: number // 0-6
}

export function ProgressStepper({ currentStep }: ProgressStepperProps) {
  return (
    <ol className="space-y-3" aria-label="Progress">
      {PROGRESS_STEPS.map((step, idx) => {
        const state = idx < currentStep ? 'done' : idx === currentStep ? 'active' : 'todo'
        return (
          <li
            key={step.key}
            className={clsx(
              'flex items-center gap-3 text-sm',
              state === 'done' && 'text-zinc-500',
              state === 'active' && 'text-zinc-50 font-semibold text-base',
              state === 'todo' && 'text-zinc-500'
            )}
          >
            {state === 'done' && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-green-600 text-green-600 text-xs">
                ✓
              </span>
            )}
            {state === 'active' && (
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
              </span>
            )}
            {state === 'todo' && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 text-zinc-500 text-xs">
                ○
              </span>
            )}
            <span>{step.label}</span>
          </li>
        )
      })}
    </ol>
  )
}



