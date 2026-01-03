'use client'

interface DecisionSectionCardProps {
  label: string
  content?: string
  highlight?: boolean
  action?: boolean
}

export function DecisionSectionCard({ label, content, highlight, action }: DecisionSectionCardProps) {
  if (!content) return null

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        action
          ? 'bg-blue-950/30 border-blue-800/60'
          : highlight
          ? 'bg-zinc-900 border-zinc-800'
          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p
        className={`leading-relaxed ${action ? 'text-blue-200' : 'text-zinc-100'} ${
          highlight ? 'font-medium' : ''
        }`}
      >
        {content}
      </p>
    </div>
  )
}


