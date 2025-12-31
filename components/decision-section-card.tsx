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
          ? 'bg-blue-50/50 border-blue-200/60'
          : highlight
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p
        className={`leading-relaxed ${action ? 'text-blue-900' : 'text-gray-800'} ${
          highlight ? 'font-medium' : ''
        }`}
      >
        {content}
      </p>
    </div>
  )
}


