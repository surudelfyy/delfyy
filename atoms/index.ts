import { loadAtoms } from '@/lib/atoms/loader'
import sampleAtoms from './sample.json'
import firstPrinciplesAtoms from './first-principles.json'
import goodStrategyBadStrategyAtoms from './good-strategy-bad-strategy.json'
import theCruxAtoms from './the-crux.json'
import blueOceanStrategyAtoms from './blue-ocean-strategy.json'
import blitzscalingAtoms from './blitzscaling.json'
import druckerInnovationAtoms from './drucker-innovation-entrepreneurship.json'
import understandingPorterAtoms from './understanding-michael-porter.json'
import sevenPowersAtoms from './seven-powers.json'
import leanStartupAtoms from './lean-startup.json'
import playingToWinAtoms from './playing-to-win.json'
import productStrategyAtoms from './product-strategy.json'
import saasPlaybookAtoms from './saas-playbook.json'
import noBsStrategyAtoms from './no-bs-strategy.json'
import productBookAtoms from './product-book.json'
import leanProductPlaybookAtoms from './lean-product-playbook.json'
import productManagementPracticeAtoms from './product-management-practice.json'
import conversionRateOptimizationGuideAtoms from './conversion-rate-optimization-guide.json'
import productMarketFitGuideAtoms from './product-market-fit-guide.json'
import escapingBuildTrapAtoms from './escaping-the-build-trap.json'
import continuousDiscoveryHabitsAtoms from './continuous-discovery-habits.json'
import productBacklogGuideAtoms from './product-backlog-guide.json'
import featurePrioritizationGuideAtoms from './feature-prioritization-guide.json'
import productRoadmapGuideAtoms from './product-roadmap-guide.json'
import abTestingGuideAtoms from './ab-testing-guide.json'
import aiProductPlaybookAtoms from './ai-product-playbook.json'
import buildingAiProductsAtoms from './building-ai-products.json'
import aiEngineeringAtoms from './ai-engineering.json'
import uxForAiAtoms from './ux-for-ai.json'
import successfulAiProductCreationAtoms from './successful-ai-product-creation.json'
import leanMarketingAtoms from './lean-marketing.json'
import marketingMadeSimpleAtoms from './marketing-made-simple.json'
import productLeadershipAtoms from './product-leadership.json'
import moveAtoms from './move.json'
import monetizingInnovationAtoms from './monetizing-innovation.json'
import pricingStrategyGuideAtoms from './pricing-strategy-guide.json'
import gtmStrategyGuideAtoms from './go-to-market-strategy-guide.json'
import obviouslyAwesomeAtoms from './obviously-awesome.json'
import thinkLikeUxResearcherAtoms from './think-like-ux-researcher.json'
import designEverydayThingsAtoms from './design-everyday-things.json'
import designThinkingAtoms from './design-thinking.json'
import usabilityTestingGuideAtoms from './usability-testing-guide.json'
import innovatorsDilemmaAtoms from './innovators-dilemma.json'
import innovatorsSolutionAtoms from './innovators-solution.json'
import workingBackwardsAtoms from './working-backwards.json'
import everythingStoreAtoms from './everything-store.json'
import zeroToOneAtoms from './zero-to-one.json'
import subscribedAtoms from './subscribed.json'
import economicMoatsAtoms from './economic-moats.json'
import ltvAtoms from './ltv.json'
import runningLeanAtoms from './running-lean.json'
import tractionAtoms from './traction.json'
import crossingChasmAtoms from './crossing-chasm.json'
import fourStepsAtoms from './four-steps.json'
import thinkingInBetsAtoms from './thinking-in-bets.json'

// Load and validate all atoms from JSON files
export const atoms = loadAtoms([
  ...sampleAtoms,
  ...firstPrinciplesAtoms,
  ...goodStrategyBadStrategyAtoms,
  ...theCruxAtoms,
  ...blueOceanStrategyAtoms,
  ...blitzscalingAtoms,
  ...druckerInnovationAtoms,
  ...understandingPorterAtoms,
  ...sevenPowersAtoms,
  ...leanStartupAtoms,
  ...playingToWinAtoms,
  ...productStrategyAtoms,
  ...saasPlaybookAtoms,
  ...noBsStrategyAtoms,
  ...productBookAtoms,
  ...leanProductPlaybookAtoms,
  ...productManagementPracticeAtoms,
  ...conversionRateOptimizationGuideAtoms,
  ...productMarketFitGuideAtoms,
  ...escapingBuildTrapAtoms,
  ...continuousDiscoveryHabitsAtoms,
  ...productBacklogGuideAtoms,
  ...featurePrioritizationGuideAtoms,
  ...productRoadmapGuideAtoms,
  ...abTestingGuideAtoms,
  ...aiProductPlaybookAtoms,
  ...buildingAiProductsAtoms,
  ...aiEngineeringAtoms,
  ...uxForAiAtoms,
  ...successfulAiProductCreationAtoms,
  ...leanMarketingAtoms,
  ...marketingMadeSimpleAtoms,
  ...productLeadershipAtoms,
  ...moveAtoms,
  ...monetizingInnovationAtoms,
  ...pricingStrategyGuideAtoms,
  ...gtmStrategyGuideAtoms,
  ...obviouslyAwesomeAtoms,
  ...thinkLikeUxResearcherAtoms,
  ...designEverydayThingsAtoms,
  ...designThinkingAtoms,
  ...usabilityTestingGuideAtoms,
  ...innovatorsDilemmaAtoms,
  ...innovatorsSolutionAtoms,
  ...workingBackwardsAtoms,
  ...everythingStoreAtoms,
  ...zeroToOneAtoms,
  ...subscribedAtoms,
  ...economicMoatsAtoms,
  ...ltvAtoms,
  ...runningLeanAtoms,
  ...tractionAtoms,
  ...crossingChasmAtoms,
  ...fourStepsAtoms,
  ...thinkingInBetsAtoms,
])

