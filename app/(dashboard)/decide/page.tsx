import { checkAccess } from '@/lib/utils/check-access'
import { PaywallModal } from '@/components/paywall-modal'
import { DecideClient } from '@/components/decide-client'

export default async function DecidePage() {
  const access = await checkAccess()

  if (!access.canCreateDecision) {
    return <PaywallModal isOpen={true} onClose={() => {}} />
  }

  return <DecideClient />
}
