// Main Delfyy decision pipeline orchestrator. Coordinates all steps from input to Decision Card.
import type {
  ClassifierOutput,
  ConceptAtom,
  Decision,
  DecisionCard,
  GovernorOutput,
  InputContext,
  LensOutput,
  LensPack,
  PatternMatcherOutput,
  SynthesiserOutput,
} from '@/types'
import { synthesiserOutputSchema } from '@/lib/schemas/synthesiser'
import { renderDecisionCard } from '@/lib/utils/render-decision-card'
import { SYNTHESISER_SYSTEM_PROMPT, buildSynthesiserUserPrompt } from '@/prompts/synthesiser'
import { PATTERN_MATCHER_SYSTEM_PROMPT, buildPatternMatcherUserPrompt } from '@/prompts/pattern-matcher'

interface OrchestratorInput {
  decisionId: string
  question: string
  inputContext: InputContext
  atoms: ConceptAtom[]
}

interface OrchestratorResult {
  success: boolean
  decisionId: string
  classifierOutput?: ClassifierOutput
  lensOutputs?: LensOutput[]
  governorOutput?: GovernorOutput
  internalCard?: SynthesiserOutput
  displayCard?: DecisionCard
  error?: string
}

interface PipelineCallbacks {
  onProgress: (step: string, message: string) => void
  onError: (code: string, message: string) => void
}

function computeWasContested(lensOutputs: LensOutput[], governor: GovernorOutput): boolean {
  const stances = lensOutputs.map((l) => l.stance)
  const hasOppose = stances.includes('oppose')
  const hasSupport = stances.includes('support')
  const hasUnclear = stances.includes('unclear')
  return (hasOppose && hasSupport) || hasUnclear || governor.trigger_round_2
}

// TODO: Implement actual call
async function classifyDecision(question: string, context: InputContext): Promise<ClassifierOutput> {
  return {
    level: 'Product',
    dimension: 'go-to-market',
    secondary_dimensions: [],
    decision_mode: 'plan',
    context_tags: [],
    risk_flags: [],
    confidence: 0.5,
    follow_up_questions: [],
  }
}

// TODO: Implement actual call
async function compileLensPacks(
  classifierOutput: ClassifierOutput,
  atoms: ConceptAtom[]
): Promise<LensPack[]> {
  return [
    {
      lens: 'Customer',
      atoms: [],
    },
    {
      lens: 'Business',
      atoms: [],
    },
    {
      lens: 'Feasibility',
      atoms: [],
    },
  ]
}

// TODO: Implement actual call
async function evaluateLens(
  lens: LensPack,
  question: string,
  context: InputContext
): Promise<LensOutput> {
  return {
    lens: lens.lens,
    stance: 'mixed',
    summary: 'Placeholder evaluation summary.',
    supporting_points: [],
    counterpoints: [],
    assumptions: [],
    disconfirming_tests: [],
    open_questions: [],
    examples_in_pack: [],
    confidence: 'medium',
  }
}

// TODO: Implement actual call
async function runEvidenceGovernor(
  lensOutputs: LensOutput[],
  classifierOutput: ClassifierOutput
): Promise<GovernorOutput> {
  return {
    confidence_tier: 'directional',
    commitment_posture: 'test',
    confidence_score: 0.5,
    trigger_round_2: false,
    reasons: ['Placeholder governor reason'],
  }
}

// TODO: Implement actual Claude call
async function callSynthesiser(prompt: string): Promise<SynthesiserOutput> {
  const mock: SynthesiserOutput = {
    version: 1,
    recommended_call: {
      status: 'recommendation',
      choice: 'Run a small pilot with clear success metrics.',
      confidence_label: 'medium',
      confidence_score: 0.55,
    },
    confidence_reason: 'Moderate signal with unresolved risks.',
    top_reasons: [
      { reason: 'Customer pull', because: 'Early users asking for the feature' },
      { reason: 'Feasibility', because: 'Build is straightforward with current team' },
    ],
    tradeoffs: [
      { tradeoff: 'Speed vs polish', what_you_gain: 'Validation', what_you_risk: 'Rough UX' },
    ],
    assumptions: [
      { assumption: 'Target users will adopt pilots', why_it_matters: 'Adoption risk', confidence: 'medium' },
    ],
    key_risks: [{ risk: 'Low engagement', why_it_matters: 'Pilot inconclusive' }],
    revisit_signals: [{ signal: 'Engagement below target', why_it_matters: 'Pilot not validating' }],
    escape_hatch: { condition: 'Pilot misses KPIs', immediate_action: 'Pause rollout and interview users' },
    next_steps: [
      { step: 'Define pilot success metrics', expected_output: 'Clear KPI targets' },
      { step: 'Recruit 10 target users', expected_output: 'Pilot cohort' },
    ],
    four_views_summary: {
      customer_view: { summary: 'Customers show interest.', key_points: ['Inbound requests', 'Clear use case'] },
      business_view: { summary: 'Potential revenue but unproven.', key_points: ['Small pilot cost', 'Upside revenue'] },
      build_view: { summary: 'Feasible with current team.', key_points: ['No new infra', 'Low effort'] },
      evidence_view: { summary: 'Evidence moderate.', key_points: ['Early signals', 'Needs validation'] },
    },
    real_world_examples: {
      included: false,
      items: [],
    },
    safety_notes: [{ flag: 'Engagement risk', note: 'Watch for low usage' }],
    contest_summary: undefined,
  }

  return synthesiserOutputSchema.parse(mock)
}

// TODO: Implement actual Claude call
async function callPatternMatcher(prompt: string): Promise<PatternMatcherOutput> {
  return {
    principle: 'Test with small pilots to validate demand before full build.',
    where_worked: [
      { example: 'Product X', timeframe: '2021', lesson: 'Pilot showed demand', atom_id: 'atom-1' },
    ],
    where_failed: [
      { example: 'Product Y', timeframe: '2019', lesson: 'Pilot had no engagement', atom_id: 'atom-2' },
    ],
    mechanism: 'Pilots provide signal with limited cost; failure indicates low pull.',
  }
}

export async function runDecisionPipeline(
  input: OrchestratorInput,
  callbacks: PipelineCallbacks
): Promise<OrchestratorResult> {
  try {
    callbacks.onProgress('classifying', 'Understanding your decision...')
    const classifierOutput = await classifyDecision(input.question, input.inputContext)

    callbacks.onProgress('compiling', 'Gathering relevant insights...')
    const lensPacks = await compileLensPacks(classifierOutput, input.atoms)

    callbacks.onProgress('evaluating', 'Evaluating from three perspectives...')
    const lensOutputs = await Promise.all(
      lensPacks.map((lens) => evaluateLens(lens, input.question, input.inputContext))
    )

    callbacks.onProgress('governing', 'Checking confidence...')
    const governorOutput = await runEvidenceGovernor(lensOutputs, classifierOutput)
    const wasContested = computeWasContested(lensOutputs, governorOutput)
    void wasContested // placeholder use; preserved for future logic

    callbacks.onProgress('synthesising', 'Forming recommendation...')
    const synthPrompt = buildSynthesiserUserPrompt({
      userQuestion: input.question,
      classifierOutput,
      lensOutputs,
      governorOutput,
      examples: input.atoms,
    })
    void SYNTHESISER_SYSTEM_PROMPT // referenced to ensure availability; actual call TBD
    const internalCard = await callSynthesiser(synthPrompt)

    callbacks.onProgress('matching', 'Finding real-world examples...')
    const exampleAtoms = input.atoms.filter((a) => a.type === 'Example')
    const patternPrompt = buildPatternMatcherUserPrompt({
      input: {
        classifier_output: classifierOutput,
        recommended_choice: internalCard.recommended_call.choice,
        top_reasons: internalCard.top_reasons,
      },
      atoms: exampleAtoms,
    })
    void PATTERN_MATCHER_SYSTEM_PROMPT // referenced to ensure availability; actual call TBD
    const pattern = await callPatternMatcher(patternPrompt)

    callbacks.onProgress('rendering', 'Preparing your decision card...')
    const displayCard = renderDecisionCard({
      internal: internalCard,
      pattern,
      lensOutputs,
      governorOutput,
    })

    return {
      success: true,
      decisionId: input.decisionId,
      classifierOutput,
      lensOutputs,
      governorOutput,
      internalCard,
      displayCard,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    callbacks.onError('pipeline_error', message)
    return {
      success: false,
      decisionId: input.decisionId,
      error: message,
    }
  }
}

