import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function DataSettingsLoading() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
      <Separator />
      <Skeleton className="h-4 w-32 mb-2" />
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  )
}