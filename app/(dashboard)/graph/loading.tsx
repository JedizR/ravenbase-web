import { Skeleton } from "@/components/ui/skeleton"

export default function GraphLoading() {
  return (
    <div className="flex flex-col h-full p-6 space-y-4">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-[600px] w-full rounded-2xl" />
    </div>
  )
}
