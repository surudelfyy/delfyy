'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CheckInFormProps {
  decisionId: string
}

const outcomes = [
  {
    value: 'held',
    label: 'Yes, it worked',
    description: 'The decision held. Moving forward.',
    icon: '✓',
    selectedClass: 'border-green-500 bg-green-50 ring-2 ring-green-500',
    defaultClass: 'border-border hover:border-green-300',
  },
  {
    value: 'pivoted',
    label: 'No, I pivoted',
    description: 'Changed course based on what I learned.',
    icon: '↻',
    selectedClass: 'border-amber-500 bg-amber-50 ring-2 ring-amber-500',
    defaultClass: 'border-border hover:border-amber-300',
  },
  {
    value: 'too_early',
    label: 'Too early to tell',
    description: 'Need more time. Check in again in 7 days.',
    icon: '→',
    selectedClass: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
    defaultClass: 'border-border hover:border-blue-300',
  },
] as const

export function CheckInForm({ decisionId }: CheckInFormProps) {
  const router = useRouter()
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedOutcome) {
      setError('Please select an outcome')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/decisions/${decisionId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: selectedOutcome,
          note: note.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save check-in')
      }

      router.push(`/decisions/${decisionId}/check-in/complete?outcome=${selectedOutcome}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="mb-6">
        <legend className="mb-4 text-sm font-medium">Did it work?</legend>
        <div className="space-y-3">
          {outcomes.map((outcome) => (
            <label
              key={outcome.value}
              className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all duration-150 ${
                selectedOutcome === outcome.value ? outcome.selectedClass : outcome.defaultClass
              }`}
            >
              <input
                type="radio"
                name="outcome"
                value={outcome.value}
                checked={selectedOutcome === outcome.value}
                onChange={(e) => setSelectedOutcome(e.target.value)}
                className="sr-only"
              />
              <span className="text-2xl" aria-hidden="true">
                {outcome.icon}
              </span>
              <div>
                <p className="font-medium">{outcome.label}</p>
                <p className="text-sm text-muted-foreground">{outcome.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mb-6">
        <label htmlFor="note" className="mb-2 block text-sm font-medium">
          Add a note <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you learn? What would you do differently?"
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        {note.length > 0 && (
          <p className="mt-1 text-right text-xs text-muted-foreground">{note.length}/1000</p>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedOutcome || isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Confirm'}
      </button>
    </form>
  )
}

