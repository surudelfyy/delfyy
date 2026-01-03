import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { AssumptionChips } from './memo/AssumptionChips'
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

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">Reasoning</h2>
        <Bullets items={memo.why_this_call} />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          Assumptions
        </h2>
        <AssumptionChips assumptions={memo.assumptions} />
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

      <section>
        <h2 className="text-xl font-semibold text-zinc-100 mb-4">
          Real-world precedent
        </h2>
        <div className="space-y-6">
          <p className="text-lg text-zinc-200">{memo.pattern.principle}</p>

          {memo.examples.worked.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-400">What worked</p>
              <div className="space-y-4 text-zinc-300">
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
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-400">What failed</p>
              <div className="space-y-4 text-zinc-300">
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
            <p className="text-zinc-400 italic">{memo.pattern.why_it_works}</p>
          )}
        </div>
      </section>

      {memo.next_steps?.length ? (
        <section>
          <h2 className="text-xl font-semibold text-zinc-100 mb-4">
            Next steps
          </h2>
          <div className="space-y-3">
            {memo.next_steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-zinc-500 mt-0.5">☐</span>
                <p className="text-base text-zinc-300 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
