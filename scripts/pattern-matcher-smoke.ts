import { config } from 'dotenv'

config({ path: '.env.local' })
import { matchPatterns } from '@/lib/claude/pattern-matcher'
import type { ConceptAtom } from '@/lib/schemas/atoms'

async function main() {
  const exampleAtoms: ConceptAtom[] = [
    {
      id: 'example-1',
      source: 'Test Source',
      type: 'Example',
      purpose: 'Illustrate',
      claim: 'Company X launched paid-only and focused on high-intent users.',
      rationale: 'They avoided support burden and learned pricing fast.',
      lens: ['Business'],
      level: 'Product',
      dimension: 'Packaging',
      context: ['pricing', 'launch'],
    },
    {
      id: 'example-2',
      source: 'Test Source',
      type: 'Example',
      purpose: 'Illustrate',
      claim: 'Company Y launched free tier first and struggled with conversion.',
      rationale: 'Free users dominated support; paid conversion lagged.',
      lens: ['Business'],
      level: 'Product',
      dimension: 'Packaging',
      context: ['freemium', 'support'],
    },
  ]

  const out = await matchPatterns({
    classifierOutput: {
      level: 'Product',
      dimension: 'Packaging',
      secondary_dimensions: [],
      decision_mode: 'choose',
      context_tags: ['mvp'],
      risk_flags: [],
      confidence: 0.7,
      follow_up_questions: [
        { question: 'q1', why_it_matters: 'm1' },
        { question: 'q2', why_it_matters: 'm2' },
        { question: 'q3', why_it_matters: 'm3' },
      ],
    },
    recommendedChoice: 'Start paid-only with a clear trial.',
    topReasons: [
      { reason: 'Cleaner learning', because: 'You learn pricing and willingness to pay faster.' },
      { reason: 'Lower support load', because: 'You avoid a large low-intent free cohort.' },
    ],
    exampleAtoms,
  })

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 2))
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})

