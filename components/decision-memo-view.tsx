import type { DecisionMemo } from '@/lib/schemas/decision-memo'
import { TradeOffLine } from './memo/TradeOffLine'
import { TriggerCard } from './memo/TriggerCard'

interface DecisionMemoViewProps {
  memo: DecisionMemo
}

function Bullets({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <ul className="space-y-2 text-sm sm:text-base text-foreground/80 leading-relaxed">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2">
          <span className="text-muted-foreground shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function DecisionMemoView({ memo }: DecisionMemoViewProps) {
  return (
    <div className="space-y-8 sm:space-y-12">
      <section>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Decision
        </h2>
        <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
          {memo.call}
        </p>
      </section>

      <hr className="border-border my-6 sm:my-10" />

      <section>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Reasoning
        </h2>
        <Bullets items={memo.why_this_call} />
      </section>

      <hr className="border-border my-6 sm:my-10" />

      <section>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Assumptions
        </h2>
        <ul className="space-y-4 sm:space-y-6">
          {memo.assumptions.map((item, i) => (
            <li key={i} className="space-y-1">
              <div>
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl uppercase tracking-wide">
                  {item.confidence}
                </span>
              </div>
              <p className="text-sm sm:text-base text-foreground">
                {item.assumption}
              </p>
              {item.why_it_matters ? (
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {item.why_it_matters}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <hr className="border-border my-6 sm:my-10" />

      <section>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Trade-offs
        </h2>
        <TradeOffLine tradeOffs={memo.trade_offs} />
      </section>

      <hr className="border-border my-6 sm:my-10" />

      <section>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Risks
        </h2>
        <Bullets items={memo.risks} />
      </section>

      <hr className="border-border my-6 sm:my-10" />

      <section>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          When to revisit
        </h2>
        <TriggerCard
          reviewTrigger={memo.review_trigger}
          escapeHatch={memo.escape_hatch}
        />
      </section>

      <hr className="border-border my-6 sm:my-10" />

      <section>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground mb-3 sm:mb-4">
          Real-world case studies
        </h2>

        <p className="text-sm sm:text-base text-foreground/80 mb-4 sm:mb-6">
          {memo.pattern.principle}
        </p>

        <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">
          What worked
        </h3>
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {memo.examples.worked.map((e, i) => (
            <p key={i} className="text-sm sm:text-base text-foreground/80">
              <span className="font-semibold text-foreground">{e.company}</span>
              {e.year ? (
                <span className="text-muted-foreground"> ({e.year})</span>
              ) : null}
              : {e.story}
            </p>
          ))}
        </div>

        <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 sm:mb-3">
          What failed
        </h3>
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {memo.examples.failed.map((e, i) => (
            <p key={i} className="text-sm sm:text-base text-foreground/80">
              <span className="font-semibold text-foreground">{e.company}</span>
              {e.year ? (
                <span className="text-muted-foreground"> ({e.year})</span>
              ) : null}
              : {e.story}
            </p>
          ))}
        </div>

        {memo.pattern.why_it_works && (
          <p className="text-xs sm:text-sm text-muted-foreground italic">
            {memo.pattern.why_it_works}
          </p>
        )}
      </section>
    </div>
  )
}
