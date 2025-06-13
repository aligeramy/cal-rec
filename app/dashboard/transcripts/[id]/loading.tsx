import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="space-y-6">
        {/* Meeting Information skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Client Information */}
            <div className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
            
            {/* Host Information */}
            <div className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
            </div>

            {/* Meeting Details */}
            <div className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div>
                  <Skeleton className="h-3 w-18 mb-1" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Time and Status Information skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Time Information */}
            <div className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </div>
            
            {/* Status Information */}
            <div className="p-6">
              <Skeleton className="h-4 w-36 mb-4" />
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div>
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recording Section skeleton (optional) */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
        
        {/* Transcript and Notes skeleton */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="p-6 space-y-6">
            {/* PDF Toolbar skeleton */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </div>
            </div>

            {/* Meeting Details Section skeleton */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-16" />
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>

            {/* Transcript Content skeleton */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-32" />
                <div className="flex space-x-2">
                  <div className="flex items-center space-x-1 mr-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                  <Skeleton className="h-7 w-16" />
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 text-sm border">
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" style={{ width: `${Math.random() * 40 + 60}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Section skeleton */}
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-7 w-16" />
              </div>
              <div className="bg-muted/50 rounded-lg border max-h-[500px] overflow-y-auto">
                <div className="p-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" style={{ width: `${Math.random() * 30 + 70}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 