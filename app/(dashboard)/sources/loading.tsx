import { Skeleton } from "@/components/ui/skeleton"

export default function SourcesLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-4 w-64" />
      {/* Tab list skeleton */}
      <Skeleton className="h-10 w-80 max-w-full rounded-lg" />
      {/* Content area skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  )
}
