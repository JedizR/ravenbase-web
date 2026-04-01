import { Skeleton } from "@/components/ui/skeleton"

export default function NotificationsLoading() {
  return (
    <div className="p-6 max-w-2xl space-y-8">
      {/* Page header skeleton */}
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      {/* Toggle section skeleton */}
      <div>
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="bg-card rounded-2xl border border-border px-6 py-4 space-y-0">
          {/* Toggle row 1 */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="w-10 h-6 rounded-full" />
          </div>
          {/* Toggle row 2 */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <Skeleton className="w-10 h-6 rounded-full" />
          </div>
          {/* Toggle row 3 */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-52" />
              </div>
            </div>
            <Skeleton className="w-10 h-6 rounded-full" />
          </div>
        </div>
      </div>

      {/* Preview section skeleton */}
      <div>
        <Skeleton className="h-4 w-36 mb-4" />
        <div className="space-y-4">
          {/* Preview card 1 */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="w-20 h-8 rounded-full" />
            </div>
            <Skeleton className="h-24 rounded-xl" />
          </div>
          {/* Preview card 2 */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
              <Skeleton className="w-20 h-8 rounded-full" />
            </div>
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
