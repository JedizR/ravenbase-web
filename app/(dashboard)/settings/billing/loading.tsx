import { Skeleton } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  )
}
