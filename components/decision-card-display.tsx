'use client'

import { AlertTriangle, CheckCircle2, Eye, XCircle } from 'lucide-react'
import type { DecisionCard } from '@/lib/schemas/decision-card'
import { cleanText, fixContractions, splitBullets, firstExample } from '@/lib/utils/format-decision-text'

const tierConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  high: { label: 'High confidence', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  good: { label: 'Good confidence', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  moderate: { label: 'Moderate', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  directional: { label: 'Directional', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  exploratory: { label: 'Provisional', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-semibold text-gray-600 tracking-tight font-serif mb-3">{children}</p>
}

function MemoText({ text }: { text?: string }) {
  if (!text) return null
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="space-y-3">
      {blocks.map((block, idx) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        const hasList = lines.some((l) => /^[-•]/.test(l))
        if (hasList) {
          return (
            <ul key={idx} className="list-disc ml-5 space-y-1 text-gray-700 leading-relaxed">
              {lines.map((l, i) => (
                <li key={i}>{cleanText(fixContractions(l.replace(/^[-•]\s*/, '')))}</li>
              ))}
            </ul>
          )
        }
        if (lines.length > 1) {
          return (
            <div key={idx} className="space-y-2">
              {lines.map((l, i) => (
                <p key={i} className="text-gray-700 leading-relaxed">
                  {cleanText(fixContractions(l))}
                </p>
              ))}
            </div>
          )
        }
        return (
          <p key={idx} className="text-gray-700 leading-relaxed">
            {cleanText(fixContractions(block))}
          </p>
        )
      })}
    </div>
  )
}

interface DecisionCardDisplayProps {
  card: DecisionCard
  confidenceTier?: string
}

export function DecisionCardDisplay({ card, confidenceTier }: DecisionCardDisplayProps) {
  const tier = tierConfig[confidenceTier || card.meta.confidence_tier] || tierConfig.directional
  const decision = cleanText(fixContractions(card.summary.call || ''))
  const confidence = cleanText(fixContractions(card.summary.confidence || ''))

  return (
    <div className="memo space-y-16">
      {/* Hero: The Call */}
      <section>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <Label>The Call</Label>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${tier.bg} ${tier.text} ${tier.border}`}>
              {tier.label}
            </span>
          </div>

          <p className="text-[22px] md:text-2xl font-serif font-semibold text-gray-900 leading-snug tracking-tight mb-4">
            {decision || 'No recommendation generated'}
          </p>

          {confidence && <p className="text-gray-500 leading-relaxed text-sm">{confidence}</p>}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">That's one less thing living in your head.</p>
      </section>

      {/* Next Step */}
      {card.summary.do_next && (
        <section>
          <div className="border-l-4 border-blue-400 bg-blue-50/50 rounded-r-xl pl-6 pr-6 py-5">
            <Label>Your Next Step</Label>
            <p className="text-gray-900 leading-relaxed">{cleanText(fixContractions(card.summary.do_next))}</p>
          </div>
        </section>
      )}

      {/* Why This Call */}
      {card.summary.change_course_if.length > 0 && (
        <section className="space-y-8">
          <Label>Why This Call</Label>
          <div>
            <h3 className="font-serif font-semibold text-gray-900 tracking-tight mb-2">Change course if</h3>
            <MemoText text={card.summary.change_course_if.join('\n')} />
          </div>
        </section>
      )}

      {/* Details */}
      {(card.details.assumptions.length ||
        card.details.tradeoffs.length ||
        card.details.risks.length ||
        card.details.watch_for.length ||
        card.details.approach) && (
        <section className="space-y-8">
          <Label>The Reasoning</Label>
          <MemoText text={card.details.assumptions.join('\n')} />
          <MemoText text={card.details.tradeoffs.join('\n')} />
          <MemoText text={card.details.risks.join('\n')} />
          <MemoText text={card.details.watch_for.join('\n')} />
          {card.details.approach && (
            <div>
              <h3 className="font-serif font-semibold text-gray-900 tracking-tight mb-2">Approach</h3>
              <MemoText text={card.details.approach} />
            </div>
          )}
        </section>
      )}

      {/* Evidence */}
      {(card.pattern.principle ||
        card.pattern.mechanism ||
        card.pattern.where_worked.length ||
        card.pattern.where_failed.length) && (
        <section className="space-y-8">
          <Label>The Evidence</Label>

          {card.pattern.principle && (
            <div>
              <h3 className="font-serif font-semibold text-gray-900 tracking-tight mb-2">The Pattern</h3>
              <MemoText text={card.pattern.principle} />
            </div>
          )}

          {card.pattern.mechanism && (
            <div>
              <h3 className="font-serif font-semibold text-gray-900 tracking-tight mb-2">Why It Works</h3>
              <MemoText text={card.pattern.mechanism} />
            </div>
          )}

          {(card.pattern.where_worked.length > 0 || card.pattern.where_failed.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {card.pattern.where_worked.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-[12px] font-semibold text-emerald-700 tracking-tight font-serif">
                      Where It Worked
                    </span>
                  </div>
                  <p className="text-sm text-emerald-900 leading-relaxed">
                    {firstExample(card.pattern.where_worked[0])}
                  </p>
                </div>
              )}

              {card.pattern.where_failed.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <span className="text-[12px] font-semibold text-red-700 tracking-tight font-serif">
                      Where It Failed
                    </span>
                  </div>
                  <p className="text-sm text-red-900 leading-relaxed">
                    {firstExample(card.pattern.where_failed[0])}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Footnotes */}
      {(card.details.watch_for.length > 0 || card.summary.change_course_if.length > 0) && (
        <section className="border-t border-gray-100 pt-8 space-y-4">
          {card.details.watch_for.length > 0 && (
            <div className="flex gap-3 text-sm">
              <Eye className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-700">Revisit if: </span>
                <span className="text-gray-500">{card.details.watch_for.join(' ')}</span>
              </div>
            </div>
          )}

          {card.summary.change_course_if.length > 0 && (
            <div className="flex gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-700">Change course if: </span>
                <span className="text-gray-500">{card.summary.change_course_if.join(' ')}</span>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}



