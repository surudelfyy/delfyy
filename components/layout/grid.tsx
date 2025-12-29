import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type GridProps = {
  children: ReactNode
  cols?: '1' | '2' | '3'
  className?: string
}

export function Grid({ children, cols = '2', className }: GridProps) {
  const colsClass =
    cols === '1'
      ? 'grid-cols-1'
      : cols === '3'
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 md:grid-cols-2'
  return <div className={cn('grid gap-4 md:gap-6', colsClass, className)}>{children}</div>
}

