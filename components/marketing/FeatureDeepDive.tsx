import type { ReactNode } from "react"

interface DeepDiveSection {
  id: string
  label: string
  heading: string
  body: string
  imageLeft: boolean
  mockup: ReactNode
}

const SECTIONS: DeepDiveSection[] = [
  {
    id: "inbox-dive",
    label: "MEMORY_INBOX",
    heading: "Capture without friction, review with intent",
    body: "The Memory Inbox separates capture from processing. Drop in anything — the AI structures it later. You stay in flow while Ravenbase quietly organizes everything you throw at it.",
    imageLeft: true,
    mockup: (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
        <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ MEMORY_INBOX</p>
        <div className="space-y-2">
          {["React vs Vue conflict — 94% match", "Job title update — 91%", "Framework preference — 88%"].map((item) => (
            <div key={item} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />
              <span className="text-xs text-foreground">{item}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <div className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-mono">ACCEPT</div>
          <div className="px-3 py-1.5 bg-secondary border border-border rounded-full text-xs font-mono">KEEP_OLD</div>
        </div>
      </div>
    ),
  },
  {
    id: "metadoc-dive",
    label: "META_DOCUMENTS",
    heading: "Synthesis documents that cite their sources",
    body: "Every meta-document is generated from your actual knowledge graph. Every claim links back to a specific memory entry. Export to PDF for sharing, print for archiving.",
    imageLeft: false,
    mockup: (
      <div className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
        <p className="text-xs font-mono text-muted-foreground tracking-wider">◆ META_DOCUMENT</p>
        <div className="space-y-2">
          <div className="h-4 bg-foreground/10 rounded w-3/4" />
          <div className="h-3 bg-foreground/10 rounded w-full" />
          <div className="h-3 bg-foreground/10 rounded w-5/6" />
          <div className="h-3 bg-foreground/10 rounded w-4/5" />
        </div>
        <div className="mt-3 p-2 bg-accent/30 rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">SOURCES (3) →</p>
          <p className="text-[10px] text-muted-foreground mt-1">notes_2022.md · chat_export.json · resume_2023.pdf</p>
        </div>
      </div>
    ),
  },
]

export function FeatureDeepDive() {
  return (
    <section aria-labelledby="deep-dive-heading" className="py-20 md:py-28 bg-secondary/30">
      <h2 id="deep-dive-heading" className="sr-only">Feature Deep-Dive</h2>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-24">
        {SECTIONS.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className={`flex flex-col gap-12 items-center ${
              section.imageLeft ? "md:flex-row" : "md:flex-row-reverse"
            }`}
          >
            <div className="w-full md:w-1/2">{section.mockup}</div>
            <div className="w-full md:w-1/2 space-y-4">
              <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                ◆ {section.label}
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl text-foreground">{section.heading}</h3>
              <p className="text-base text-muted-foreground leading-relaxed">{section.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
