import type { ReactNode } from 'react'

type SectionTitleProps = {
  children: ReactNode
}

export function SectionTitle({ children }: SectionTitleProps) {
  return <h2 className="text-lg md:text-xl font-semibold tracking-tight">{children}</h2>
}

