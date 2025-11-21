'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-[140px] py-[24px] min-w-[1000px]">
        <Skeleton className="h-9 w-32 mb-[24px]" />
        {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="w-full h-10 mb-4 rounded" />
        ))}
      </div>
    </div>
  )
}

