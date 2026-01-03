'use client'

function SkeletonLine({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 bg-zinc-800 rounded animate-pulse ${width}`} />
}

function SkeletonCard() {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 space-y-2">
      <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
      <SkeletonLine />
      <SkeletonLine width="w-3/4" />
    </div>
  )
}

export function DecisionSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero skeleton */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
          <div className="h-6 w-20 bg-zinc-800 rounded-full animate-pulse" />
        </div>
        <div className="space-y-2">
          <SkeletonLine />
          <SkeletonLine width="w-4/5" />
        </div>
        <div className="h-3 w-48 bg-zinc-800 rounded animate-pulse mt-4" />
      </div>

      {/* Two column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-3">
          <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse mb-4" />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="lg:col-span-2 space-y-3">
          <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse mb-4" />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}


