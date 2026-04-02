import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-8 max-w-2xl p-6">
      {/* Section label + heading */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-56" />
      </div>
      {/* Card rows */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}
