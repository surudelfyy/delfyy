import { checkAccess } from '@/lib/utils/check-access'
import { PaywallModal } from '@/components/paywall-modal'
import { DecideInputShell } from '@/components/decide-input-shell'
import { Logo } from '@/components/logo'

export default async function DecidePage() {
  const access = await checkAccess()

  if (!access.canCreateDecision) {
    return <PaywallModal isOpen={true} onClose={() => {}} />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center py-8 sm:py-16">
      <div className="flex flex-col items-center gap-4 sm:gap-6 text-center w-full max-w-2xl">
        <Logo width={120} className="text-foreground sm:w-[140px]" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          What decision are you stuck on?
        </h1>
      </div>

      <div className="mt-6 sm:mt-12 w-full max-w-2xl">
        <DecideInputShell />
      </div>
    </div>
  )
}
