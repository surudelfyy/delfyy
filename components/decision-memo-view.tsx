import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { AssumptionChips } from './memo/AssumptionChips'
import { TradeOffLine } from './memo/TradeOffLine'
import { TriggerCard } from './memo/TriggerCard'

function ConfidenceChip({ tier }: { tier: string }) {
  const map: Record<
    string,
    { label: string; className: string }
  > = {
    exploratory: {
      label: 'Needs more info',
      className: 'bg-red-50 text-red-700 border border-red-200',
    },
    directional: {
      label: 'Early signal',
      className: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    supported: {
      label: 'Good confidence',
      className: 'bg-green-50 text-green-700 border border-green-200',
    },
    high: {
      label: 'Strong confidence',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
  }
  const config = map[tier] ?? map.directional
  return (
    <span className={`rounded-full px-3 py-1 text-sm ${config.className}`}>
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
      <h2 className="text-xl font-serif font-semibold text-gray-900 tracking-tight">{title}</h2>
      <div className="text-[17px] leading-[1.65] text-gray-800 space-y-2">{children}</div>
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

export function DecisionMemoView({ memo, createdAt }: DecisionMemoViewProps) {
  console.log('memo data:', {
    assumptions: memo.assumptions,
    trade_offs: memo.trade_offs,
    review_trigger: memo.review_trigger,
    escape_hatch: memo.escape_hatch,
  })

  const metaParts: string[] = []
  const dateSource = createdAt || memo.meta.date_iso
  const date = dateSource
    ? new Date(dateSource).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null
  const stageLabel = memo.meta.stage ? memo.meta.stage.charAt(0).toUpperCase() + memo.meta.stage.slice(1) : null

  return (
    <article className="max-w-[760px] w-full mx-auto bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
          {memo.question}
        </h1>
        <p className="text-sm text-gray-500">That&apos;s one less thing living in your head.</p>
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceChip tier={memo.confidence.tier} />
          {stageLabel && (
            <span className="bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-sm">{stageLabel}</span>
          )}
          {date && <span className="bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-sm">{date}</span>}
        </div>
      </header>

      <Section title="The Call">
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

      <Section title="Do next">
        <Bullets items={memo.next_steps} />
      </Section>

      <Section title="Why this call">
        <Bullets items={memo.why_this_call} />
      </Section>

      <Section title="Risks">
        <Bullets items={memo.risks} />
      </Section>

      <TriggerCard reviewTrigger={memo.review_trigger} escapeHatch={memo.escape_hatch} />

      <Section title="The Pattern">
        <p className="font-semibold">{memo.pattern.principle}</p>
        <p>{memo.pattern.why_it_works}</p>
      </Section>

      {memo.examples.worked.length > 0 && (
        <Section title="Where it worked">
          <Bullets
            items={memo.examples.worked.map((e) => {
              const yr = e.year ? ` (${e.year})` : ''
              return `${e.company}${yr}: ${e.story}`
            })}
          />
        </Section>
      )}

      {memo.examples.failed.length > 0 && (
        <Section title="Where it failed">
          <Bullets
            items={memo.examples.failed.map((e) => {
              const yr = e.year ? ` (${e.year})` : ''
              return `${e.company}${yr}: ${e.story}`
            })}
          />
        </Section>
      )}
    </article>
  )
}

