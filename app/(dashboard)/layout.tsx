import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/delfyylogo.svg"
              alt="Delfyy"
              width={100}
              height={18}
              className="h-auto"
              priority
            />
          </Link>
        </div>
      </header>
      <main className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  )
}
