import type { ReactNode } from 'react'

type ChildrenProps = { children: ReactNode }

export function H1({ children }: ChildrenProps) {
  return <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{children}</h1>
}

export function H2({ children }: ChildrenProps) {
  return <h2 className="text-lg md:text-xl font-semibold tracking-tight">{children}</h2>
}

export function P({ children }: ChildrenProps) {
  return <p className="text-sm md:text-base leading-relaxed">{children}</p>
}

export function Muted({ children }: ChildrenProps) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}
