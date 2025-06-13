import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

export function TranscriptsLoading() {
  return (
    <div className="flex flex-col space-y-6">
      {/* Tabs skeleton */}
      <div className="border-b border-border">
        <nav className="flex space-x-1 pb-4" aria-label="Tabs">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
              <Badge variant="outline" className="ml-1">
                <Skeleton className="h-3 w-4" />
              </Badge>
            </div>
          ))}
        </nav>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Client</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Start Time</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Duration</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 