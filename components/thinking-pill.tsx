'use client'

interface ThinkingPillProps {
  label: string
}

export function ThinkingPill({ label }: ThinkingPillProps) {
  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="bg-background border border-border rounded-xl px-6 py-4 shadow-sm min-w-[280px]">
        <p className="text-foreground font-medium text-center mb-3">{label}</p>
        <div className="flex justify-center gap-1.5">
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-dot-1" />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-dot-2" />
          <span className="w-2 h-2 bg-muted-foreground rounded-full animate-dot-3" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Applying the Delfyy framework to reach a defensible call.
      </p>
    </div>
  )
}
