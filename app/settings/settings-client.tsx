'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type ProfileResponse = {
  default_context: string | null
  tier: 'free' | 'paid'
  limits: { default_context_max: number }
}

export default function SettingsClient() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [value, setValue] = useState('')
  const [limit, setLimit] = useState(800)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) {
          setMessage('Failed to load profile')
          return
        }
        const data: ProfileResponse = await res.json()
        if (!mounted) return
        setValue(data.default_context || '')
        setLimit(data.limits.default_context_max)
      } catch {
        setMessage('Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_context: value.trim() ? value : null }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMessage(data?.error?.message || 'Failed to save')
        return
      }
      setMessage('Context saved')
      router.refresh()
    } catch {
      setMessage('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-50">Default context</label>
        <p className="text-sm text-zinc-400">Added to every decision automatically.</p>
        <textarea
          value={value}
          onChange={(e) => {
            if (e.target.value.length <= limit) setValue(e.target.value)
          }}
          rows={6}
          className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-50 shadow-sm focus:border-zinc-50 focus:outline-none"
          maxLength={limit}
          placeholder="E.g., team, audience, constraints..."
          disabled={loading}
        />
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            {value.length}/{limit}
          </span>
          {message && <span className={message === 'Context saved' ? 'text-green-600' : 'text-rose-600'}>{message}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving || loading}
        className="inline-flex items-center justify-center rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

