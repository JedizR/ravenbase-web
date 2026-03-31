import Link from "next/link"
import { Upload, Network, Inbox, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section aria-labelledby="cta-heading" className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative bg-card border border-border rounded-2xl px-8 py-16 text-center overflow-hidden">
          <Upload   className="absolute top-6 left-6   size-6 text-muted-foreground/25" aria-hidden="true" />
          <Network  className="absolute top-6 right-6  size-6 text-muted-foreground/25" aria-hidden="true" />
          <Inbox    className="absolute bottom-6 left-6  size-6 text-muted-foreground/25" aria-hidden="true" />
          <FileText className="absolute bottom-6 right-6 size-6 text-muted-foreground/25" aria-hidden="true" />
          <div className="relative space-y-6">
            <h2 id="cta-heading" className="font-serif text-3xl sm:text-4xl lg:text-5xl text-foreground">
              Your knowledge, structured forever.
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Start building your permanent memory today. Free to try, no credit card required.
            </p>
            <Button asChild size="lg" className="rounded-full h-11">
              <Link href="/register">Start for free →</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
