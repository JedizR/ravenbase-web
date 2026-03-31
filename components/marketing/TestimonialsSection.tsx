// TODO: Replace placeholder testimonials with real user quotes before launch

const TESTIMONIALS = [
  {
    ref: "REF-0088",
    quote: "I've kept notes for 11 years across four different apps. Ravenbase is the first thing that made them feel like one coherent story.",
    role: "Software Engineer, 4 years of notes",
  },
  {
    ref: "REF-2301",
    quote: "The meta-document feature alone is worth it. I can synthesize a decade of research on any topic in under a minute.",
    role: "Independent researcher, 8 years of notes",
  },
  {
    ref: "REF-7725",
    quote: "I stopped worrying about losing context between projects. Ravenbase holds everything — I just ask.",
    role: "Product Manager, 2 years of notes",
  },
]

export function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-heading" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="testimonials-heading" className="sr-only">Testimonials</h2>
        <div className="text-center mb-16">
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
            ◆ HALL_OF_RECORDS
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.ref} className="bg-card border border-border rounded-2xl p-6 space-y-4 flex flex-col">
              <blockquote className="flex-1 text-sm text-foreground leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <footer className="space-y-1">
                <p className="text-xs font-mono text-muted-foreground tracking-wider">{t.ref}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </footer>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
