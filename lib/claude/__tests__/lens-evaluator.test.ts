import { describe, test, expect } from 'vitest'
import { atoms } from '@/atoms'
import { classify } from '@/lib/claude/classifier'
import { evaluateLenses } from '@/lib/claude/lens-evaluator'
import { compileLensPacks } from '@/lib/delphi/lenspack-compiler'
import type { LensOutput } from '@/lib/schemas/lens'

// This suite hits the real Claude API and is skipped by default.
describe.skip('Lens Evaluator (integration)', () => {
  const maybeTest = process.env.ANTHROPIC_API_KEY ? test : test.skip

  maybeTest(
    'classify → compile lens packs → evaluate lenses',
    async () => {
      const question =
        'We want to launch a new SMB analytics add-on; should we bundle or sell separately?'

      const classifierOutput = await classify({
        question,
        context: {
          stage: 'scaling',
          goal: 'revenue',
        },
      })

      const lensPacks = compileLensPacks({ classifierOutput, atoms })

      const outputs = await evaluateLenses(
        {
          question,
          input_context: {},
          classifier_output: classifierOutput,
        },
        lensPacks
      )

      expect(outputs).toHaveLength(3)

      const validStances: LensOutput['stance'][] = ['support', 'oppose', 'mixed', 'unclear']

      for (const output of outputs) {
        expect(validStances).toContain(output.stance)
        expect(output.disconfirming_tests.length).toBeGreaterThan(0)
      }
    },
    60_000
  )
})

