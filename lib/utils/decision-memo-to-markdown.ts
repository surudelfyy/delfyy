import type { DecisionMemo } from '@/lib/schemas/decision-memo'

type MarkdownOptions = {
  createdAt?: string | null
  outcome?: 'successful' | 'failed' | null
  stage?: string | null
}

const confidenceLabelMap: Record<DecisionMemo['confidence']['tier'], string> = {
  high: 'High confidence',
  supported: 'High confidence',
  directional: 'Medium confidence',
  exploratory: 'Early signal',
}

const escapeMarkdown = (text?: string | null) => {
  if (!text) return ''
  return text.replace(/([*_#`[\]])/g, '\\$1')
}

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const truncateTitle = (text: string) =>
  text.length > 100 ? `${text.slice(0, 97)}...` : text

export function decisionMemoToMarkdown(
  memo: DecisionMemo,
  options: MarkdownOptions = {},
): string {
  const out: string[] = []

  const title = truncateTitle(escapeMarkdown(memo.question.trim()))
  out.push(`# ${title}`)
  out.push('')

  const metaParts: string[] = []
  const confidenceMeta = confidenceLabelMap[memo.confidence.tier] || ''
  if (confidenceMeta) metaParts.push(confidenceMeta)

  const stageLabel = options.stage
    ? options.stage.charAt(0).toUpperCase() + options.stage.slice(1)
    : memo.meta.stage
      ? memo.meta.stage.charAt(0).toUpperCase() + memo.meta.stage.slice(1)
      : ''
  if (stageLabel) metaParts.push(stageLabel)

  const createdDate = formatDate(options.createdAt)
  if (createdDate) metaParts.push(createdDate)

  if (options.outcome === 'successful') metaParts.push('✓ Successful')
  if (options.outcome === 'failed') metaParts.push('✗ Failed')

  if (metaParts.length) {
    out.push(`**${metaParts.join(' · ')}**`)
    out.push('')
  }

  if (memo.confidence.rationale) {
    out.push(`*${escapeMarkdown(memo.confidence.rationale)}*`)
    out.push('')
  }

  out.push('---')
  out.push('')
  if (memo.call) {
    out.push('## Decision')
    out.push(escapeMarkdown(memo.call.trim()))
    out.push('')
    out.push('---')
    out.push('')
  }

  if (memo.why_this_call?.length) {
    out.push('## Reasoning')
    memo.why_this_call.forEach((item) => {
      if (item) out.push(`- ${escapeMarkdown(item.trim())}`)
    })
    out.push('')
  }

  if (memo.assumptions?.length) {
    out.push('## Assumptions')
    memo.assumptions.forEach((a) => {
      out.push('')
      if (a.confidence)
        out.push(`**${escapeMarkdown(a.confidence.toUpperCase())}**`)
      if (a.assumption) out.push(escapeMarkdown(a.assumption))
      if (a.why_it_matters) out.push(`*${escapeMarkdown(a.why_it_matters)}*`)
    })
    out.push('')
    out.push('---')
    out.push('')
  }

  if (memo.trade_offs?.length) {
    out.push('## Trade-offs')
    out.push("You're accepting:")
    out.push('')
    memo.trade_offs.forEach((t) => {
      if (t) out.push(`- ${escapeMarkdown(t)}`)
    })
    out.push('')
    out.push('---')
    out.push('')
  }

  if (memo.risks?.length) {
    out.push('## Risks')
    memo.risks.forEach((r) => {
      if (r) out.push(`- ${escapeMarkdown(r)}`)
    })
    out.push('')
    out.push('---')
    out.push('')
  }

  if (memo.review_trigger || memo.escape_hatch) {
    out.push('## When to revisit')
    if (memo.review_trigger) out.push(escapeMarkdown(memo.review_trigger))
    if (memo.escape_hatch) {
      out.push('')
      out.push('**Escape hatch**')
      out.push(escapeMarkdown(memo.escape_hatch))
    }
    out.push('')
    out.push('---')
    out.push('')
  }

  if (
    memo.pattern.principle ||
    memo.examples.worked.length ||
    memo.examples.failed.length ||
    memo.pattern.why_it_works
  ) {
    out.push('## Real-world case studies')
    if (memo.pattern.principle) {
      out.push(escapeMarkdown(memo.pattern.principle))
      out.push('')
    }

    if (memo.examples.worked.length) {
      out.push('**WHAT WORKED**')
      memo.examples.worked.forEach((e) => {
        const yr = e.year ? ` (${escapeMarkdown(String(e.year))})` : ''
        out.push(
          `- **${escapeMarkdown(e.company)}**${yr}: ${escapeMarkdown(e.story)}`,
        )
      })
      out.push('')
    }

    if (memo.examples.failed.length) {
      out.push('**WHAT FAILED**')
      memo.examples.failed.forEach((e) => {
        const yr = e.year ? ` (${escapeMarkdown(String(e.year))})` : ''
        out.push(
          `- **${escapeMarkdown(e.company)}**${yr}: ${escapeMarkdown(e.story)}`,
        )
      })
      out.push('')
    }

    if (memo.pattern.why_it_works) {
      out.push(`*${escapeMarkdown(memo.pattern.why_it_works)}*`)
      out.push('')
    }
    out.push('---')
    out.push('')
  }

  if (memo.next_steps?.length) {
    out.push('## Next steps')
    memo.next_steps.forEach((step) => {
      if (step) out.push(`- [ ] ${escapeMarkdown(step)}`)
    })
    out.push('')
    out.push('---')
    out.push('')
  }

  const exportedDate = formatDate(new Date().toISOString())
  if (exportedDate) {
    out.push(`*Exported from Delfyy · ${exportedDate}*`)
  }

  return out.join('\n')
}
