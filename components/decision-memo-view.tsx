import type { DecisionMemo } from '@/lib/schemas/decision-memo'

interface DecisionMemoViewProps {
  memo: DecisionMemo
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

export function DecisionMemoView({ memo }: DecisionMemoViewProps) {
  const metaParts: string[] = []
  if (memo.meta.stage) metaParts.push(`Stage: ${memo.meta.stage}`)
  const date = memo.meta.date_iso
    ? new Date(memo.meta.date_iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null
  if (date) metaParts.push(`Date: ${date}`)

  return (
    <article className="max-w-[760px] w-full mx-auto bg-white border border-gray-200 shadow-sm rounded-2xl p-6 md:p-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
          {memo.question}
        </h1>
        <p className="text-sm text-gray-500">That&apos;s one less thing living in your head.</p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-gray-700">
            {memo.confidence.tier} ({memo.confidence.score.toFixed(2)})
          </span>
          {metaParts.length > 0 && <span>{metaParts.join(' • ')}</span>}
        </div>
      </header>

      <Section title="The Call">
        <p>{memo.call}</p>
      </Section>

      <Section title="Confidence">
        <p>{memo.confidence.rationale}</p>
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

