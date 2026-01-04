'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Circle, X } from 'lucide-react'

type Outcome = 'in_progress' | 'successful' | 'failed'

interface OutcomeDropdownProps {
  decisionId: string
  currentOutcome: Outcome
  onUpdate?: (_newOutcome: Outcome) => void
}

const OUTCOME_OPTIONS: Array<{
  value: Outcome
  label: string
  icon: typeof Check
  activeClass: string
}> = [
  {
    value: 'successful',
    label: 'Successful',
    icon: Check,
    activeClass: 'border border-zinc-500 text-zinc-100 bg-zinc-800',
  },
  {
    value: 'failed',
    label: 'Failed',
    icon: X,
    activeClass: 'border border-zinc-700 text-zinc-300 bg-zinc-900',
  },
  {
    value: 'in_progress',
    label: 'Pending',
    icon: Circle,
    activeClass: 'border border-zinc-700 text-zinc-400 bg-zinc-900',
  },
]

export function OutcomeDropdown({
  decisionId,
  currentOutcome,
  onUpdate,
}: OutcomeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [outcome, setOutcome] = useState<Outcome>(currentOutcome)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOutcome(currentOutcome)
  }, [currentOutcome])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const updateOutcome = async (_newOutcome: Outcome) => {
    if (isLoading || _newOutcome === outcome) {
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(`/api/decisions/${decisionId}/outcome`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: _newOutcome }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Failed to update outcome')
      }

      setOutcome(_newOutcome)
      onUpdate?.(_newOutcome)
    } catch (error) {
      console.error('Failed to update outcome:', error)
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  const currentOption =
    OUTCOME_OPTIONS.find((opt) => opt.value === outcome) ?? OUTCOME_OPTIONS[2]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-sm hover:bg-zinc-700 transition-colors ${
          currentOption.activeClass
        } ${isLoading ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
      >
        <currentOption.icon className="w-3.5 h-3.5" />
        <span>{currentOption.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-zinc-900 border border-zinc-700 rounded shadow-lg z-20">
          {OUTCOME_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isActive = opt.value === outcome
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateOutcome(opt.value)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors ${
                  isActive ? 'bg-zinc-800' : ''
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
                {isActive && (
                  <Check className="w-3.5 h-3.5 text-zinc-300 ml-auto" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
