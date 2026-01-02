import { describe, it, expect } from 'vitest'
import { renderDecisionView } from '../render-decision-view'

const sample = `# Question

## The Call
Do X

## Confidence
Tier (0.35): directional — because reasons

## Do next
- Step 1

## Why this call
- Reason A

## Risks
- Risk A

## Assumptions
- Assumption

## Decision Guardrails
**Revisit if:** things

## The Pattern
**Principle:** principle text

## Meta
ignore me
`

describe('renderDecisionView', () => {
  it('rewrites headings and confidence line without dropping sections', () => {
    const { markdown } = renderDecisionView({ memoMarkdown: sample, tone: 'calm-founder', channel: 'markdown' })
    expect(markdown).toContain('## Decision')
    expect(markdown).toContain('## Next steps')
    expect(markdown).toContain('## Reasoning')
    expect(markdown).toContain('## When to revisit')
    expect(markdown).toContain('## The principle')
    expect(markdown).not.toContain('## Meta')
    expect(markdown).toContain('Medium confidence — because reasons')
  })

  it('keeps section order intact', () => {
    const { markdown } = renderDecisionView({ memoMarkdown: sample, tone: 'calm-founder', channel: 'markdown' })
    const order = [
      '## Decision',
      '## Confidence',
      '## Next steps',
      '## Reasoning',
      '## Risks',
      '## Assumptions',
      '## When to revisit',
      '## The principle',
    ]
    const positions = order.map((h) => markdown.indexOf(h))
    const sorted = [...positions].sort((a, b) => a - b)
    expect(positions).toEqual(sorted)
  })
})

