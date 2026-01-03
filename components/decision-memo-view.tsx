import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { TradeOffLine } from './memo/TradeOffLine'
import { TriggerCard } from './memo/TriggerCard'

interface DecisionMemoViewProps {
  memo: DecisionMemo
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-2 text-base text-zinc-300 leading-relaxed">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="text-zinc-500">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function DecisionMemoView({ memo }: DecisionMemoViewProps) {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Decision</h2>
        <p className="text-base text-zinc-300 leading-relaxed">{memo.call}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Reasoning</h2>
        <Bullets items={memo.why_this_call} />
        <div className="mt-6 pt-4 border-t border-zinc-800">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border border-zinc-500 text-zinc-300 rounded uppercase tracking-wide">
            {memo.confidence.tier === 'high'
              ? 'Very high'
              : memo.confidence.tier === 'supported'
                ? 'High'
                : memo.confidence.tier === 'directional'
                  ? 'Medium'
                  : 'Early signal'}{' '}
            confidence
          </span>
          {memo.confidence.rationale ? (
            <p className="mt-2 text-zinc-400 text-sm">
              {memo.confidence.rationale}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          Assumptions
        </h2>
        <ul className="space-y-6">
          {memo.assumptions.map((item, i) => (
            <li key={i} className="space-y-1">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-zinc-100 text-zinc-900 rounded uppercase tracking-wide">
                  {item.confidence}
                </span>
              </div>
              <p className="text-zinc-100">{item.assumption}</p>
              {item.why_it_matters ? (
                <p className="text-zinc-500 text-sm">{item.why_it_matters}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Trade-offs</h2>
        <TradeOffLine tradeOffs={memo.trade_offs} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Risks</h2>
        <Bullets items={memo.risks} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          When to revisit
        </h2>
        <TriggerCard
          reviewTrigger={memo.review_trigger}
          escapeHatch={memo.escape_hatch}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          Real-world case studies
        </h2>

        <p className="text-zinc-300 mb-6">{memo.pattern.principle}</p>

        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          What worked
        </h3>
        <div className="space-y-4 mb-6">
          {memo.examples.worked.map((e, i) => (
            <p key={i} className="text-zinc-300">
              <span className="font-semibold text-zinc-100">{e.company}</span>
              {e.year ? (
                <span className="text-zinc-500"> ({e.year})</span>
              ) : null}
              : {e.story}
            </p>
          ))}
        </div>

        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide mb-3">
          What failed
        </h3>
        <div className="space-y-4 mb-6">
          {memo.examples.failed.map((e, i) => (
            <p key={i} className="text-zinc-300">
              <span className="font-semibold text-zinc-100">{e.company}</span>
              {e.year ? (
                <span className="text-zinc-500"> ({e.year})</span>
              ) : null}
              : {e.story}
            </p>
          ))}
        </div>

        {memo.pattern.why_it_works && (
          <p className="text-zinc-500 italic">{memo.pattern.why_it_works}</p>
        )}
      </section>
    </div>
  )
}
