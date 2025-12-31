/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import clsx from 'clsx'

const STEPS = [
  'Understanding the decision',
  'Gathering relevant perspectives',
  'Evaluating trade-offs',
  'Checking assumptions',
  'Forming a clear call',
  'Finding real examples',
  'Preparing your decision',
]

interface ProgressStepperProps {
  currentStepIndex: number // 0-6
}

export function ProgressStepper({ currentStepIndex }: ProgressStepperProps) {
  return (
    <ol className="space-y-3" aria-label="Progress">
      {STEPS.map((label, idx) => {
        const state =
          idx < currentStepIndex ? 'done' : idx === currentStepIndex ? 'active' : 'todo'
        return (
          <li key={label} className="flex items-center gap-3 text-sm text-gray-700">
            <span
              className={clsx(
                'inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs',
                state === 'done' && 'border-green-600 text-green-600',
                state === 'active' && 'border-gray-900 text-gray-900 animate-pulse',
                state === 'todo' && 'border-gray-300 text-gray-300'
              )}
              aria-hidden="true"
            >
              {state === 'done' ? '✓' : state === 'active' ? '●' : '○'}
            </span>
            <span>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}


