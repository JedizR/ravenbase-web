import { Upload, Cpu, FileText } from "lucide-react"

const STEPS = [
  {
    number: "01",
    label: "UPLOAD",
    title: "Capture everything",
    description:
      "Drop in notes, chat exports, PDFs, or paste raw text. Ravenbase accepts any format without judgment.",
    icon: Upload,
  },
  {
    number: "02",
    label: "STRUCTURE",
    title: "Automatic structuring",
    description:
      "The AI extracts entities, dates, places, and relationships — building a typed knowledge graph from your raw material.",
    icon: Cpu,
  },
  {
    number: "03",
    label: "GENERATE",
    title: "Surface and synthesize",
    description:
      "Query your memory in natural language. Generate meta-documents. Get precisely cited answers across your entire history.",
    icon: FileText,
  },
]

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="workflow-heading"
      className="py-20 md:py-28 bg-secondary/30"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
            ◆ THE_PROTOCOL
          </p>
          <h2 id="workflow-heading" className="font-serif text-3xl sm:text-4xl text-foreground">
            Three steps to permanent memory
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <div key={step.number} className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-primary/30">{step.number}</span>
                <span className="text-xs font-mono text-muted-foreground tracking-wider">
                  ◆ {step.label}
                </span>
              </div>
              <step.icon className="size-6 text-primary" aria-hidden="true" />
              <h3 className="font-serif text-xl text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
