"use client"

import { motion } from "framer-motion"

const TESTIMONIALS = [
  {
    id: "REF-0042",
    quote:
      "247 research papers, 3 years of reading notes — all queryable in under a second. I found a connection between two papers I'd completely forgotten about.",
    name: "Dr. Ananya Sharma",
    role: "ML Research Lead, DeepMind",
    delay: 0,
  },
  {
    id: "REF-0088",
    quote:
      "Ravenbase caught a contradiction between our Q2 strategy doc and the Q4 investor deck. That kind of drift is invisible until someone gets burned by it.",
    name: "Marcus Lindgren",
    role: "VP of Product, Series B Startup",
    delay: 0.1,
  },
  {
    id: "REF-0117",
    quote:
      "My thesis bibliography built itself from 4 years of reading notes. The meta-document feature synthesized 180 sources into a 3-page literature review draft in 40 seconds.",
    name: "Priya Okonkwo",
    role: "PhD Candidate, Stanford NLP Lab",
    delay: 0.2,
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" as const },
  }),
}

export function TestimonialsSection() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="py-20 md:py-28 bg-secondary/30"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
            ◆ HALL_OF_RECORDS
          </p>
          <h2
            id="testimonials-heading"
            className="font-serif text-3xl sm:text-4xl text-foreground"
          >
            Trusted by researchers, builders, and thinkers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <motion.blockquote
              key={t.id}
              custom={t.delay}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={cardVariants}
              className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="space-y-4">
                <p className="font-mono text-xs text-muted-foreground tracking-wider">
                  {t.id}
                </p>
                <p className="text-sm text-foreground leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
              <footer className="mt-6 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
