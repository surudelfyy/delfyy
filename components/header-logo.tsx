'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export function HeaderLogo() {
  const pathname = usePathname()
  const isDecidePage = pathname === '/decide'

  if (isDecidePage) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-xl h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Dashboard
      </Link>
    )
  }

  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <Logo width={100} className="text-foreground" />
    </Link>
  )
}
