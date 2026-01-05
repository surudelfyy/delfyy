'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Outcome = 'in_progress' | 'successful' | 'failed'

interface OutcomeSelectorProps {
  decisionId: string
  currentOutcome: Outcome | null
}

export function OutcomeSelector({
  decisionId,
  currentOutcome,
}: OutcomeSelectorProps) {
  const [outcome, setOutcome] = useState<Outcome>(
    currentOutcome || 'in_progress',
  )
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const handleChange = async (newOutcome: Outcome) => {
    if (newOutcome === outcome || saving) return

    setSaving(true)
    try {
      const res = await fetch(`/api/decisions/${decisionId}/outcome`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: newOutcome }),
      })

      if (!res.ok) throw new Error('Failed to save')

      setOutcome(newOutcome)
      toast.success('Outcome saved')
      router.refresh()
    } catch {
      toast.error('Failed to save outcome')
    } finally {
      setSaving(false)
    }
  }

  const btn = (value: Outcome, label: string) => {
    const isActive = outcome === value
    return (
      <button
        key={value}
        onClick={() => handleChange(value)}
        disabled={saving}
        aria-pressed={isActive}
        className={`px-4 py-2 text-sm font-medium border rounded-none transition-colors ${
          isActive
            ? 'border-input bg-card text-foreground'
            : 'border-border text-foreground/80 hover:border-input'
        } ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {label}
      </button>
    )
  }

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        Outcome
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Did this decision work out?
      </p>
      <div className="flex flex-wrap gap-2">
        {btn('successful', 'Successful')}
        {btn('failed', 'Failed')}
        {btn('in_progress', 'In progress')}
      </div>
    </section>
  )
}
