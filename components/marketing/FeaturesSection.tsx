"use client"

import { motion } from "framer-motion"
import { Inbox, FileText, Network } from "lucide-react"

const FEATURES = [
  {
    icon: Inbox,
    label: "MEMORY_INBOX",
    title: "Memory Inbox",
    description:
      "Conflicts become conversations, not silent overwrites. Review AI-detected contradictions and resolve them with a keystroke.",
  },
  {
    icon: FileText,
    label: "META_DOCUMENTS",
    title: "Meta-Documents",
    description:
      "Years of context → one perfect document. AI-generated synthesis that cites every source from your knowledge graph.",
  },
  {
    icon: Network,
    label: "KNOWLEDGE_GRAPH",
    title: "Knowledge Graph",
    description:
      "Concepts connected across time, not just semantics. Navigate every entity, date, and relationship you've ever captured.",
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.12, ease: "easeOut" as const },
  }),
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
            ◆ SYSTEM_MODULES
          </p>
          <h2 id="features-heading" className="font-serif text-3xl sm:text-4xl text-foreground">
            Built for long-term thinkers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={cardVariants}
              className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 cursor-default"
            >
              <p className="text-xs font-mono text-muted-foreground tracking-wider">
                ◆ {feature.label}
              </p>
              <feature.icon className="size-8 text-primary" aria-hidden="true" />
              <h3 className="font-serif text-xl text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
