'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function UpgradeToastClient() {
  const params = useSearchParams()
  const upgraded = params.get('upgraded')
  const sessionId = params.get('session_id')
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (upgraded === '1') {
      setShow(true)
      setMessage('Upgraded — unlimited decisions unlocked')
    }
  }, [upgraded])

  useEffect(() => {
    if (upgraded === '1' && sessionId) {
      ;(async () => {
        try {
          await fetch('/api/stripe/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          })
        } catch {
          // ignore
        }
      })()
    }
  }, [upgraded, sessionId])

  if (!show || !message) return null

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="rounded-md bg-green-600 text-white px-4 py-2 shadow-lg text-sm">
        {message}
        <button className="ml-3 text-white/80 hover:text-white" onClick={() => setShow(false)}>
          ×
        </button>
      </div>
    </div>
  )
}

