'use client'

'use client'

'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import type { DecisionCard } from '@/lib/schemas/decision-card'

const tierConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'High confidence', color: 'bg-green-100 text-green-800 border-green-200' },
  good: { label: 'Good confidence', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  directional: { label: 'Directional', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  exploratory: { label: 'Provisional', color: 'bg-amber-100 text-amber-800 border-amber-200' },
}

interface DecisionCardDisplayProps {
  card: DecisionCard
}

function BulletList({ title, items }: { title?: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      {title && <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>}
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`} className="leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DecisionCardDisplay({ card }: DecisionCardDisplayProps) {
  const tier = tierConfig[card.meta.confidence_tier] || tierConfig.directional

  return (
    <div className="space-y-12">
      {/* ACT 1: THE CALL */}
      <section>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">The Call</p>
              <p className="text-sm text-gray-400">{card.summary.title}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tier.color}`}>
              {tier.label}
            </span>
          </div>

          <p className="text-2xl font-semibold text-gray-900 leading-relaxed mb-4">
            {card.summary.call || 'No decision generated'}
          </p>

          {card.summary.confidence && (
            <p className="text-gray-600 leading-relaxed">{card.summary.confidence}</p>
          )}
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">That's one less thing living in your head.</p>
      </section>

      {/* ACT 2: WHY THIS CALL */}
      <section className="space-y-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Why This Call</h2>

        <BulletList title="Do next" items={[card.summary.do_next]} />
        <BulletList title="Success looks like" items={card.summary.success_looks_like} />
        <BulletList title="Change course if" items={card.summary.change_course_if} />
      </section>

      {/* ACT 3: DETAILS */}
      <section className="space-y-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Details</h2>
        <BulletList title="Assumptions" items={card.details.assumptions} />
        <BulletList title="Trade-offs" items={card.details.tradeoffs} />
        <BulletList title="Risks" items={card.details.risks} />
        <BulletList title="What to watch for" items={card.details.watch_for} />
        {card.details.approach && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Approach</h3>
            <p className="text-gray-700 leading-relaxed">{card.details.approach}</p>
          </div>
        )}
      </section>

      {/* ACT 4: THE EVIDENCE */}
      <section className="space-y-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">The Evidence</h2>

        {card.pattern.principle && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">The Pattern</h3>
            <p className="text-gray-700 leading-relaxed">{card.pattern.principle}</p>
          </div>
        )}

        {card.pattern.mechanism && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Why It Works</h3>
            <p className="text-gray-700 leading-relaxed">{card.pattern.mechanism}</p>
          </div>
        )}

        {(card.pattern.where_worked.length > 0 || card.pattern.where_failed.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {card.pattern.where_worked.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                    Where It Worked
                  </p>
                </div>
                <ul className="list-disc list-inside text-green-900 space-y-1 text-sm">
                  {card.pattern.where_worked.map((item, idx) => (
                    <li key={`worked-${idx}`} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {card.pattern.where_failed.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">
                    Where It Failed
                  </p>
                </div>
                <ul className="list-disc list-inside text-red-900 space-y-1 text-sm">
                  {card.pattern.where_failed.map((item, idx) => (
                    <li key={`failed-${idx}`} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}



