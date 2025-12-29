import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type InlineProps = {
  children: ReactNode
  className?: string
}

export function Inline({ children, className }: InlineProps) {
  return <div className={cn('flex flex-wrap items-center gap-2 min-w-0', className)}>{children}</div>
}

