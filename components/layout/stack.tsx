import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StackProps = {
  children: ReactNode
  size?: 4 | 6 | 8
  className?: string
}

export function Stack({ children, size = 6, className }: StackProps) {
  const spacing: Record<4 | 6 | 8, string> = {
    4: 'space-y-4',
    6: 'space-y-6',
    8: 'space-y-8',
  }
  return <div className={cn(spacing[size], className)}>{children}</div>
}
