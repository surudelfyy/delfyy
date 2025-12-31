'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'

const tierConfig = {
  high: { label: 'High', color: 'bg-green-100 text-green-800 border-green-200' },
  supported: { label: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  directional: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  exploratory: { label: 'Provisional', color: 'bg-amber-100 text-amber-800 border-amber-200' },
}

interface ConfidencePillProps {
  tier?: string
}

export function ConfidencePill({ tier }: ConfidencePillProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig.directional
  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color} transition-all hover:opacity-80`}
      >
        {config.label}
        <Info className="h-3.5 w-3.5 opacity-60" />
      </button>
      {showTooltip && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTooltip(false)} />

          <div className="absolute right-0 top-10 z-50 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <p className="font-semibold text-gray-900 text-sm">What confidence means</p>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600 -mt-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="space-y-2.5 text-sm">
              <li className="flex gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span>
                  <span className="font-medium text-gray-900">High</span>{' '}
                  <span className="text-gray-600">— All three views aligned.</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <span>
                  <span className="font-medium text-gray-900">Good</span>{' '}
                  <span className="text-gray-600">— Mostly agreed, minor concerns.</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
                <span>
                  <span className="font-medium text-gray-900">Moderate</span>{' '}
                  <span className="text-gray-600">— Reasonable, but untested.</span>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>
                  <span className="font-medium text-gray-900">Provisional</span>{' '}
                  <span className="text-gray-600">— Needs more info.</span>
                </span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}


