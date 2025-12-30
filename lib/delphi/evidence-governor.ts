import type { LensOutput } from '@/lib/schemas/lens'
import type { ClassifierOutput } from '@/lib/schemas/classifier'
import type { GovernorOutput } from '@/lib/schemas/governor'

export interface GovernorInput {
  lensOutputs: LensOutput[]
  classifierOutput: ClassifierOutput
}

const BASE_CONFIDENCE = 0.5

export function runEvidenceGovernor(input: GovernorInput): GovernorOutput {
  const { lensOutputs, classifierOutput } = input

  let score = BASE_CONFIDENCE
  const reasons: string[] = []

  const hasUnclear = lensOutputs.some((lens) => lens.stance === 'unclear')
  const hasSupport = lensOutputs.some((lens) => lens.stance === 'support')
  const hasOppose = lensOutputs.some((lens) => lens.stance === 'oppose')
  const conflict = hasSupport && hasOppose

  const missingDisconfirming = lensOutputs.some(
    (lens) => !lens.disconfirming_tests || lens.disconfirming_tests.length === 0
  )

  const totalAssumptions = lensOutputs.reduce(
    (sum, lens) => sum + (lens.assumptions?.length ?? 0),
    0
  )

  // Downgrades
  if (hasUnclear) {
    score -= 0.15
    reasons.push("-0.15: at least one lens stance is 'unclear'")
  }

  if (conflict) {
    score -= 0.20
    reasons.push("-0.20: conflict present (support + oppose)")
  }

  if (classifierOutput.risk_flags.length > 0) {
    score -= 0.10
    reasons.push(`-0.10: classifier risk_flags present (${classifierOutput.risk_flags.length})`)
  }

  if (missingDisconfirming) {
    score -= 0.10
    reasons.push('-0.10: missing disconfirming_tests in at least one lens')
  }

  if (totalAssumptions > 6) {
    score -= 0.05
    reasons.push(`-0.05: total assumptions ${totalAssumptions} (>6)`)
  }

  // Upgrade
  const allSupport = lensOutputs.length > 0 && lensOutputs.every((lens) => lens.stance === 'support')
  if (allSupport) {
    score += 0.15
    reasons.push('+0.15: all lenses stance support')
  }

  // Clamp
  const confidence_score = Math.max(0, Math.min(1, score))

  // Tier mapping
  let confidence_tier: GovernorOutput['confidence_tier']
  if (confidence_score >= 0.75) {
    confidence_tier = 'high'
  } else if (confidence_score >= 0.55) {
    confidence_tier = 'supported'
  } else if (confidence_score >= 0.35) {
    confidence_tier = 'directional'
  } else {
    confidence_tier = 'exploratory'
  }

  // Posture mapping
  let commitment_posture: GovernorOutput['commitment_posture']
  if (classifierOutput.decision_mode === 'diagnose') {
    commitment_posture = 'test'
  } else {
    if (confidence_tier === 'high') {
      commitment_posture = 'proceed'
    } else if (confidence_tier === 'supported') {
      commitment_posture = 'proceed_cautiously'
    } else if (confidence_tier === 'directional') {
      commitment_posture = 'test'
    } else {
      commitment_posture = 'explore'
    }
  }

  const trigger_round_2 =
    confidence_score < 0.4 || (hasSupport && hasOppose)

  reasons.push(
    `final: score ${confidence_score.toFixed(2)}, tier ${confidence_tier}, posture ${commitment_posture}, trigger_round_2 ${trigger_round_2}`
  )

  return {
    confidence_tier,
    commitment_posture,
    confidence_score,
    trigger_round_2,
    reasons,
  }
}

