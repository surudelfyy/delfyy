import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { cn } from '@/lib/utils'
import { AssumptionChips } from './memo/AssumptionChips'
import { TradeOffLine } from './memo/TradeOffLine'
import { TriggerCard } from './memo/TriggerCard'
import { BookOpen } from 'lucide-react'

export function ConfidenceChip({ tier }: { tier: string }) {
  const map: Record<string, { label: string; className: string }> = {
    exploratory: {
      label: 'Early signal',
      className:
        'rounded-none bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-medium text-zinc-400 uppercase tracking-wider',
    },
    directional: {
      label: 'Medium confidence',
      className:
        'rounded-none bg-amber-950/50 border border-amber-800 px-2 py-0.5 text-xs font-medium text-amber-400',
    },
    supported: {
      label: 'High confidence',
      className:
        'rounded-none bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 text-xs font-medium text-emerald-400',
    },
    high: {
      label: 'Very high confidence',
      className:
        'rounded-none bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 text-xs font-medium text-emerald-400',
    },
  }
  const config = map[tier] ?? map.directional
  return <span className={config.className}>{config.label}</span>
}

interface DecisionMemoViewProps {
  memo: DecisionMemo
  createdAt?: string
}

function Section({
  title,
  children,
}: {
  title: string
  children?: React.ReactNode
}) {
  if (!children) return null
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">{title}</h2>
      <div className="text-[17px] leading-[1.65] text-zinc-300 space-y-2">
        {children}
      </div>
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

export function DecisionMemoView({
  memo,
  createdAt: _createdAt,
  className,
}: DecisionMemoViewProps & { className?: string }) {
  return (
    <article
      className={cn(
        'max-w-[760px] w-full mx-auto bg-zinc-900 border border-zinc-800 rounded-none p-6 md:p-8 space-y-10',
        className,
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

      {memo.next_steps && memo.next_steps.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">Next steps</h2>
          <div className="space-y-3">
            {memo.next_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div
                  className="rounded-none border border-zinc-700 w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer hover:border-zinc-500 transition-colors"
                  role="checkbox"
                  aria-checked="false"
                  aria-label={`Step ${i + 1}`}
                />
                <p className="text-zinc-300 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Section title="Reasoning">
        <Bullets items={memo.why_this_call} />
      </Section>

      <Section title="Risks">
        <Bullets items={memo.risks} />
      </Section>

      <Section title="When to revisit">
        <TriggerCard
          reviewTrigger={memo.review_trigger}
          escapeHatch={memo.escape_hatch}
        />
      </Section>

      <div className="mt-2 border border-zinc-800 bg-zinc-900/50 p-6 space-y-4 rounded-none">
        <div className="flex items-center gap-2 text-zinc-500 mb-1">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs uppercase tracking-wider">
            Real-world precedent
          </span>
        </div>

        <p className="text-lg font-medium text-zinc-100">
          {memo.pattern.principle}
        </p>

        {memo.examples.worked.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              What worked
            </h4>
            <div className="space-y-2 text-zinc-300">
              {memo.examples.worked.map((e, i) => (
                <p key={i}>
                  <strong className="text-zinc-100">{e.company}</strong>
                  {e.year ? ` (${e.year})` : ''}: {e.story}
                </p>
              ))}
            </div>
          </div>
        )}

        {memo.examples.failed.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
              What failed
            </h4>
            <div className="space-y-2 text-zinc-300">
              {memo.examples.failed.map((e, i) => (
                <p key={i}>
                  <strong className="text-zinc-100">{e.company}</strong>
                  {e.year ? ` (${e.year})` : ''}: {e.story}
                </p>
              ))}
            </div>
          </div>
        )}

        {memo.pattern.why_it_works && (
          <p className="italic text-zinc-400 border-t border-zinc-800 pt-4 mt-2">
            {memo.pattern.why_it_works}
          </p>
        )}
      </div>
    </article>
  )
}
