'use client'

import { getLabel, type Channel, type Tone } from './tone-policy'

type RenderDecisionViewInput = {
  memoMarkdown: string
  tone: Tone
  channel: Channel
}

function replaceHeading(line: string): string {
  if (line.startsWith('## The Call')) return '## ' + getLabel('the-call', 'calm-founder', 'app')
  if (line.startsWith('## Do next')) return '## ' + getLabel('do-next', 'calm-founder', 'app')
  if (line.startsWith('## Why this call')) return '## ' + getLabel('why-this-call', 'calm-founder', 'app')
  if (line.startsWith('## Decision Guardrails')) return '## ' + getLabel('decision-guardrails', 'calm-founder', 'app')
  if (line.startsWith('## The Pattern')) return '## ' + getLabel('the-pattern', 'calm-founder', 'app')
  if (line.startsWith('## Meta')) return ''
  return line
}

function rewriteConfidence(line: string): string {
  // Match "Tier (0.35): directional — rationale" or "Tier (0.35): directional - rationale"
  const tierMatch = line.match(/Tier\s*\([^)]*\)\s*:\s*([a-zA-Z_-]+)(.*)/i)
  if (!tierMatch) return line
  const tier = tierMatch[1].toLowerCase()
  const rest = tierMatch[2] || ''
  const label =
    tier === 'directional'
      ? getLabel('confidence-tier-directional', 'calm-founder', 'app')
      : tier === 'supported'
      ? getLabel('confidence-tier-supported', 'calm-founder', 'app')
      : tier === 'high'
      ? getLabel('confidence-tier-high', 'calm-founder', 'app')
      : getLabel('confidence-tier-default', 'calm-founder', 'app')
  // Preserve any dash-separated rationale
  return `${label}${rest}`
}

export function renderDecisionView({ memoMarkdown, tone, channel }: RenderDecisionViewInput): { markdown: string } {
  const lines = memoMarkdown.split('\n')
  const output: string[] = []

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Headings
    line = replaceHeading(line)

    // Confidence rewrite: look for the first content line after "## Confidence"
    if (line.startsWith('## Confidence')) {
      output.push(line)
      // copy following line if exists and rewrite
      const next = lines[i + 1]
      if (typeof next === 'string' && next.trim().length > 0) {
        output.push(rewriteConfidence(next))
        i += 1
      }
      continue
    }

    // Skip removed headings (Meta)
    if (line === '') {
      output.push(line)
      continue
    }

    output.push(line)
  }

  return { markdown: output.join('\n') }
}

