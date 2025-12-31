'use client'

'use client'

import { CheckCircle2, XCircle } from 'lucide-react'

interface DecisionCard {
  decision?: string
  confidence?: string
  assumptions?: string
  trade_offs?: string
  risks?: string
  next_step?: string
  review_trigger?: string
  escape_hatch?: string
  approach?: string
  principle?: string
  where_worked?: string
  where_failed?: string
  mechanism?: string
}

const tierConfig: Record<string, { label: string; color: string }> = {
  high: { label: 'High confidence', color: 'bg-green-100 text-green-800 border-green-200' },
  supported: { label: 'Good confidence', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  directional: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  exploratory: { label: 'Provisional', color: 'bg-amber-100 text-amber-800 border-amber-200' },
}

interface DecisionCardDisplayProps {
  card: DecisionCard
  confidenceTier?: string
}

export function DecisionCardDisplay({ card, confidenceTier }: DecisionCardDisplayProps) {
  const tier = tierConfig[confidenceTier || 'directional'] || tierConfig.directional

  return (
    <div className="space-y-12">
      {/* ACT 1: THE CALL */}
      <section>
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">The Call</p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${tier.color}`}>
              {tier.label}
            </span>
          </div>

          <p className="text-2xl font-semibold text-gray-900 leading-relaxed mb-4">
            {card.decision || 'No decision generated'}
          </p>

          {card.confidence && <p className="text-gray-500 leading-relaxed">{card.confidence}</p>}
        </div>

        <p className="text-center text-gray-400 mt-6 text-sm">That's one less thing living in your head.</p>
      </section>

      {/* ACT 2: WHY THIS CALL */}
      <section className="space-y-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Why This Call</h2>

        {card.assumptions && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Assumptions</h3>
            <p className="text-gray-600 leading-relaxed">{card.assumptions}</p>
          </div>
        )}

        {card.trade_offs && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Trade-offs</h3>
            <p className="text-gray-600 leading-relaxed">{card.trade_offs}</p>
          </div>
        )}

        {card.risks && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Risks</h3>
            <p className="text-gray-600 leading-relaxed">{card.risks}</p>
          </div>
        )}

        {card.approach && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Approach</h3>
            <p className="text-gray-600 leading-relaxed">{card.approach}</p>
          </div>
        )}
      </section>

      {/* ACT 3: THE EVIDENCE */}
      <section className="space-y-8">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">The Evidence</h2>

        {card.principle && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">The Pattern</h3>
            <p className="text-gray-600 leading-relaxed">{card.principle}</p>
          </div>
        )}

        {card.mechanism && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Why It Works</h3>
            <p className="text-gray-600 leading-relaxed">{card.mechanism}</p>
          </div>
        )}

        {(card.where_worked || card.where_failed) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {card.where_worked && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">
                    Where It Worked
                  </p>
                </div>
                <p className="text-green-900 text-sm leading-relaxed">{card.where_worked}</p>
              </div>
            )}

            {card.where_failed && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">
                    Where It Failed
                  </p>
                </div>
                <p className="text-red-900 text-sm leading-relaxed">{card.where_failed}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ACT 4: YOUR NEXT STEP */}
      {card.next_step && (
        <section>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8">
            <h2 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">
              Your Next Step
            </h2>
            <p className="text-blue-900 text-lg leading-relaxed">{card.next_step}</p>
          </div>
        </section>
      )}

      {/* FOOTNOTES: Watch & Escape */}
      {(card.review_trigger || card.escape_hatch) && (
        <section className="space-y-4 text-sm">
          {card.review_trigger && (
            <div>
              <span className="font-semibold text-gray-700">Watch for: </span>
              <span className="text-gray-500">{card.review_trigger}</span>
            </div>
          )}

          {card.escape_hatch && (
            <div>
              <span className="font-semibold text-gray-700">Escape hatch: </span>
              <span className="text-gray-500">{card.escape_hatch}</span>
            </div>
          )}
        </section>
      )}
    </div>
  )
}



