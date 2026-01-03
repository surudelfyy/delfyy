import { marked } from 'marked'

interface DecisionMemoDoc {
  decision: string
  confidence_tier: string
  confidence_reason?: string
  reasoning?: string
  assumptions?: string[]
  trade_offs?: string
  risks?: string[]
  next_steps?: string[]
  review_trigger?: string
  escape_hatch?: string
  principle?: string
  where_worked?: string
  where_failed?: string
  mechanism?: string
}

export interface DecisionDocument {
  id: string
  question: string
  created_at: string
  decision_card: DecisionMemoDoc
}

export function generateDocumentMarkdown(decision: DecisionDocument): string {
  const memo = decision.decision_card
  const date = new Date(decision.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const sections: string[] = []

  // Title
  sections.push(`# ${decision.question}\n`)

  // Decision
  sections.push(`**Decision:** ${memo.decision}\n`)

  // Confidence
  const confidence = memo.confidence_reason
    ? `**Confidence:** ${memo.confidence_tier} — ${memo.confidence_reason}`
    : `**Confidence:** ${memo.confidence_tier}`
  sections.push(`${confidence}\n`)

  sections.push(`---\n`)

  // Reasoning
  if (memo.reasoning) {
    sections.push(`## Reasoning\n${memo.reasoning}\n`)
  }

  // Assumptions
  if (memo.assumptions?.length) {
    sections.push(`## Assumptions`)
    sections.push(memo.assumptions.map((a) => `- ${a}`).join('\n'))
    sections.push('')
  }

  // Trade-offs
  if (memo.trade_offs) {
    sections.push(`## Trade-offs\n${memo.trade_offs}\n`)
  }

  // Risks
  if (memo.risks?.length) {
    sections.push(`## Risks`)
    sections.push(memo.risks.map((r) => `- ${r}`).join('\n'))
    sections.push('')
  }

  // Next Steps (checkboxes)
  if (memo.next_steps?.length) {
    sections.push(`## Next Steps`)
    sections.push(memo.next_steps.map((s) => `- [ ] ${s}`).join('\n'))
    sections.push('')
  }

  // Review Trigger
  if (memo.review_trigger) {
    sections.push(`## When to Revisit\n${memo.review_trigger}\n`)
  }

  // Escape Hatch
  if (memo.escape_hatch) {
    sections.push(`## Escape Hatch\n${memo.escape_hatch}\n`)
  }

  sections.push(`---\n`)

  // Precedent
  const hasPrecedent =
    memo.principle || memo.where_worked || memo.where_failed || memo.mechanism
  if (hasPrecedent) {
    sections.push(`## Precedent\n`)
    if (memo.principle) sections.push(`${memo.principle}\n`)
    if (memo.where_worked)
      sections.push(`**What worked:** ${memo.where_worked}\n`)
    if (memo.where_failed)
      sections.push(`**What failed:** ${memo.where_failed}\n`)
    if (memo.mechanism) sections.push(`*${memo.mechanism}*\n`)
    sections.push(`---\n`)
  }

  // Footer with backlink
  sections.push(
    `*Decision made with [Delfyy](https://askdelfyy.com) · ${date}*`,
  )

  return sections.join('\n')
}

export async function copyAsDocument(
  decision: DecisionDocument,
): Promise<boolean> {
  const markdown = generateDocumentMarkdown(decision)

  try {
    const html = await marked.parse(markdown, { breaks: true })

    if (typeof ClipboardItem !== 'undefined') {
      const htmlString = await Promise.resolve(html)
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([markdown], { type: 'text/plain' }),
          'text/html': new Blob([htmlString], { type: 'text/html' }),
        }),
      ])
      return true
    }
  } catch {
    // fall through to plain text copy
  }

  try {
    await navigator.clipboard.writeText(markdown)
    return true
  } catch {
    return false
  }
}
