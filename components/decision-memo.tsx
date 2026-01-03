import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DecisionMemoProps {
  markdown: string
}

export function DecisionMemo({ markdown }: DecisionMemoProps) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 shadow-sm rounded-2xl p-6 md:p-10 max-w-[820px] w-full mx-auto">
      <div className="decision-prose memo">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  )
}

