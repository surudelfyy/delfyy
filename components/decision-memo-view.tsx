import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { cn } from '@/lib/utils'
import { AssumptionChips } from './memo/AssumptionChips'
import { TradeOffLine } from './memo/TradeOffLine'
import { TriggerCard } from './memo/TriggerCard'
import { BookOpen } from 'lucide-react'

export function ConfidenceChip({ tier }: { tier: string }) {
  const map: Record<
    string,
    { label: string; className: string }
  > = {
    exploratory: {
      label: 'Early signal',
      className: 'bg-slate-400 text-zinc-950',
    },
    directional: {
      label: 'Medium confidence',
      className: 'bg-violet-600 text-zinc-950',
    },
    supported: {
      label: 'High confidence',
      className: 'bg-indigo-900 text-zinc-950',
    },
    high: {
      label: 'Very high confidence',
      className: 'bg-indigo-900 text-zinc-950',
    },
  }
  const config = map[tier] ?? map.directional
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

interface DecisionMemoViewProps {
  memo: DecisionMemo
  createdAt?: string
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  if (!children) return null
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-serif font-semibold text-zinc-50 tracking-tight">{title}</h2>
      <div className="text-[17px] leading-[1.65] text-zinc-100 space-y-2">{children}</div>
    </section>
  )
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="list-disc ml-5 space-y-2">
      {items.map((item, idx) => (
        <li key={idx}>{item}</li>
      ))}
    </ul>
  )
}

export function DecisionMemoView({ memo, createdAt: _createdAt, className }: DecisionMemoViewProps & { className?: string }) {
  return (
    <article
      className={cn(
        'max-w-[760px] w-full mx-auto bg-zinc-950 border border-zinc-800 shadow-sm rounded-2xl p-6 md:p-10 space-y-10',
        className
      )}
    >
      <Section title="Decision">
        <p>{memo.call}</p>
      </Section>

      <Section title="Confidence">
        <p>{memo.confidence.rationale}</p>
      </Section>

      <Section title="Assumptions">
        <AssumptionChips assumptions={memo.assumptions} />
      </Section>

      <Section title="Trade-offs">
        <TradeOffLine tradeOffs={memo.trade_offs} />
      </Section>

      <Section title="Next steps">
        <Bullets items={memo.next_steps} />
      </Section>

      <Section title="Reasoning">
        <Bullets items={memo.why_this_call} />
      </Section>

      <Section title="Risks">
        <Bullets items={memo.risks} />
      </Section>

      <Section title="When to revisit">
        <TriggerCard reviewTrigger={memo.review_trigger} escapeHatch={memo.escape_hatch} />
      </Section>

      <div className="mt-2 bg-zinc-900 border-l-2 border-zinc-700 pl-4 py-4 rounded-r space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>Real-world precedent</span>
        </div>

        <div className="space-y-2">
          <p className="text-zinc-300 font-semibold">{memo.pattern.principle}</p>
        </div>

        {memo.examples.worked.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-green-400 uppercase tracking-wide">What worked</span>
            <p className="text-zinc-400 text-sm mt-1">
              {memo.examples.worked
                .map((e) => {
                  const yr = e.year ? ` (${e.year})` : ''
                  return `${e.company}${yr}: ${e.story}`
                })
                .join(' · ')}
            </p>
          </div>
        )}

        {memo.examples.failed.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-red-400 uppercase tracking-wide">What failed</span>
            <p className="text-zinc-400 text-sm mt-1">
              {memo.examples.failed
                .map((e) => {
                  const yr = e.year ? ` (${e.year})` : ''
                  return `${e.company}${yr}: ${e.story}`
                })
                .join(' · ')}
            </p>
          </div>
        )}

        {memo.pattern.why_it_works && (
          <p className="text-zinc-500 text-sm italic">{memo.pattern.why_it_works}</p>
        )}
      </div>
    </article>
  )
}

