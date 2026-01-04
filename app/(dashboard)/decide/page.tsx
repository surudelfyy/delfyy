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
    <main className="min-h-screen bg-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center px-6 py-16 sm:py-20">
        <div className="flex flex-col items-center gap-6 text-center">
          <Image
            src="/delfyylogo.svg"
            alt="Delfyy"
            width={120}
            height={44}
            priority
          />
          <h1 className="text-3xl font-semibold text-zinc-100">
            What decision are you stuck on?
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl">
            A simple, focused intake. No dropdowns, no clutter — just describe
            the decision.
          </p>
        </div>

        <div className="mt-12 w-full">
          <DecideInputShell />
        </div>
      </div>
    </main>
  )
}
