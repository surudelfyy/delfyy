'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  status: 'running' | 'failed'
  decisionId: string
  question: string
  inputContext?: any
}

export function DecisionStatusBanner({ status, decisionId, question, inputContext }: Props) {
  const router = useRouter()
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (status !== 'running') return
    setPolling(true)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/decisions/${decisionId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data?.status && data.status !== 'running') {
          clearInterval(interval)
          router.refresh()
        }
      } catch {
        // ignore
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [status, decisionId, router])

  if (status === 'running') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            <span>Still processing...</span>
          </div>
          <p className="text-sm text-gray-500">We&apos;ll reload as soon as it completes.</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            Refresh now
          </button>
        </div>
      </main>
    )
  }

  const freeform = inputContext?.freeform || ''
  const stage = inputContext?.stage || ''
  const retryUrl = `/decide?question=${encodeURIComponent(question)}&context=${encodeURIComponent(
    freeform
  )}&stage=${encodeURIComponent(stage)}`

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-red-600 font-medium">This decision couldn&apos;t be completed.</p>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => router.push(retryUrl)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Retry (edit & resubmit)
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </main>
  )
}

