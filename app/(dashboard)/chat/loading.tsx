import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <div className="flex h-[100dvh]">
      {/* Session sidebar skeleton */}
      <aside className="w-64 p-4 space-y-3 border-r border-border hidden md:flex flex-col">
        <Skeleton className="h-6 w-32" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </aside>

      {/* Message area skeleton */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Messages area */}
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-20 w-3/4 rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-16 w-2/3 rounded-2xl ml-auto" />
        </div>

        {/* Input bar skeleton */}
        <div className="p-4 border-t border-border">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </main>
    </div>
  )
}
