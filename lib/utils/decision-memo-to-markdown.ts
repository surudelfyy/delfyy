import type { DecisionMemo } from '@/lib/schemas/decision-memo'

function fmtScore(score: number): string {
  return score.toFixed(2)
}

function fmtDate(dateIso?: string): string | undefined {
  if (!dateIso) return undefined
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function bullets(items?: string[]): string {
  if (!items || !items.length) return ''
  return items.map((i) => `- ${i.trim()}`).join('\n')
}

function exampleLines(list: DecisionMemo['examples']['worked']): string {
  if (!list || !list.length) return ''
  return list
    .map((e) => {
      const yr = e.year ? ` (${e.year})` : ''
      return `- **${e.company.trim()}**${yr}: ${e.story.trim()}`
    })
    .join('\n')
}

export function decisionMemoToMarkdown(memo: DecisionMemo): string {
  const out: string[] = []
  out.push('# Decision Memo')
  out.push('')
  out.push('## Question')
  out.push(memo.question.trim())
  out.push('')

  out.push('## The Call')
  out.push(memo.call.trim())
  out.push('')

  out.push('## Confidence')
  out.push(`Tier (${fmtScore(memo.confidence.score)}): ${memo.confidence.tier} — ${memo.confidence.rationale.trim()}`)
  out.push('')

  out.push('## Do next')
  out.push(bullets(memo.next_steps))
  out.push('')

  out.push('## Why this call')
  out.push(bullets(memo.why_this_call))
  out.push('')

  out.push('## Risks')
  out.push(bullets(memo.risks))
  out.push('')

  out.push('## The Pattern')
  out.push(`**Principle:** ${memo.pattern.principle.trim()}`)
  out.push(`**Why it works:** ${memo.pattern.why_it_works.trim()}`)
  out.push('')

  const worked = exampleLines(memo.examples.worked)
  if (worked) {
    out.push('## Where it worked')
    out.push(worked)
    out.push('')
  }

  const failed = exampleLines(memo.examples.failed)
  if (failed) {
    out.push('## Where it failed')
    out.push(failed)
    out.push('')
  }

  const metaParts: string[] = []
  if (memo.meta.stage) metaParts.push(`Stage: ${memo.meta.stage}`)
  const date = fmtDate(memo.meta.date_iso)
  if (date) metaParts.push(`Date: ${date}`)
  if (metaParts.length) {
    out.push('## Meta')
    out.push(metaParts.join(' • '))
    out.push('')
  }

  return out.join('\n')
}

