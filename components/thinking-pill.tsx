'use client'

interface ThinkingPillProps {
  label: string
}

export function ThinkingPill({ label }: ThinkingPillProps) {
  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm min-w-[280px]">
        <p className="text-gray-900 font-medium text-center mb-3">{label}</p>
        <div className="flex justify-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-dot-1" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-dot-2" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-dot-3" />
        </div>
      </div>
      <p className="text-xs text-gray-400">Applying the Delfyy framework to reach a defensible call.</p>
    </div>
  )
}


