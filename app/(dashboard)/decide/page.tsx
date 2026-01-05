import Image from 'next/image'
import { checkAccess } from '@/lib/utils/check-access'
import { PaywallModal } from '@/components/paywall-modal'
import { DecideInputShell } from '@/components/decide-input-shell'

export default async function DecidePage() {
  const access = await checkAccess()

  if (!access.canCreateDecision) {
    return <PaywallModal isOpen={true} onClose={() => {}} />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center py-8 sm:py-16">
      <div className="flex flex-col items-center gap-4 sm:gap-6 text-center w-full max-w-2xl">
        <Image
          src="/delfyylogo.svg"
          alt="Delfyy"
          width={120}
          height={22}
          style={{ height: 'auto' }}
          priority
          className="sm:w-[140px]"
        />
        <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-zinc-100">
          What decision are you stuck on?
        </h1>
      </div>

      <div className="mt-6 sm:mt-12 w-full max-w-2xl">
        <DecideInputShell />
      </div>
    </div>
  )
}
