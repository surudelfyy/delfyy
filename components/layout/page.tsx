import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageProps = {
  children: ReactNode
  width?: 'narrow' | 'wide'
  className?: string
}

export function Page({ children, width = 'narrow', className }: PageProps) {
  const maxWidth = width === 'wide' ? 'max-w-5xl' : 'max-w-2xl'
  return (
    <main
      className={cn(
        'mx-auto w-full min-h-screen px-4 py-6 md:px-8 md:py-10 lg:px-10 lg:py-12',
        'space-y-8',
        maxWidth,
        className
      )}
    >
      {children}
    </main>
  )
}
