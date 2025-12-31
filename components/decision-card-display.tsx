'use client'

import { DecisionSectionCard } from './decision-section-card'
import { ConfidencePill } from './confidence-pill'

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

interface DecisionCardDisplayProps {
  card: DecisionCard
  confidenceTier?: string
}

export function DecisionCardDisplay({ card, confidenceTier }: DecisionCardDisplayProps) {
  return (
    <div className="space-y-8">
      {/* THE CALL — Hero Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">The Call</p>
          <ConfidencePill tier={confidenceTier} />
        </div>
        <p className="text-xl font-medium text-gray-900 leading-relaxed">
          {card.decision || 'No decision generated'}
        </p>
        {card.confidence && <p className="text-sm text-gray-500 mt-3">{card.confidence}</p>}
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* LEFT COLUMN: Layer 1 — The Decision (3/5 width) */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            The Decision
          </h2>

          <DecisionSectionCard label="Assumptions" content={card.assumptions} />
          <DecisionSectionCard label="Trade-offs" content={card.trade_offs} />
          <DecisionSectionCard label="Risks" content={card.risks} />
          <DecisionSectionCard label="Next Step" content={card.next_step} action />
          <DecisionSectionCard label="What to Watch For" content={card.review_trigger} />
          <DecisionSectionCard label="What Would Force a Change" content={card.escape_hatch} />
          {card.approach && <DecisionSectionCard label="Approach" content={card.approach} />}
        </div>

        {/* RIGHT COLUMN: Layer 2 — The Pattern (2/5 width) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            The Pattern
          </h2>

          <DecisionSectionCard label="The Pattern" content={card.principle} highlight />
          <DecisionSectionCard label="Where It Worked" content={card.where_worked} />
          <DecisionSectionCard label="Where It Failed" content={card.where_failed} />
          <DecisionSectionCard label="Why It Works" content={card.mechanism} />
        </div>
      </div>
    </div>
  )
}


