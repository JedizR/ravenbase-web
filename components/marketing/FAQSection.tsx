"use client"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

const FAQ_ITEMS = [
  {
    id: "privacy",
    question: "Is my data private and secure?",
    answer:
      "Your data is encrypted at rest and in transit. We do not train AI models on your notes. You can export or delete everything at any time — no lock-in.",
  },
  {
    id: "vs-chatgpt",
    question: "How is this different from ChatGPT's memory feature?",
    answer:
      "ChatGPT memory is a black box that summarizes what it chooses to remember. Ravenbase stores every entry verbatim, builds a typed knowledge graph, and cites sources in every response. You control what gets structured.",
  },
  {
    id: "pricing",
    question: "How much does it cost?",
    answer:
      "Ravenbase has a generous free tier. Paid plans unlock higher ingestion limits, larger knowledge graphs, and priority processing. See the pricing page for current rates.",
  },
  {
    id: "technical",
    question: "Do I need technical skills to use Ravenbase?",
    answer:
      "No. Paste text, drag files, forward emails — no commands, no schemas, no setup. The knowledge graph builds itself.",
  },
]

export function FAQSection() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-20 md:py-28 bg-secondary/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <p className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
            ◆ FREQUENTLY_ASKED
          </p>
          <h2 id="faq-heading" className="font-serif text-3xl sm:text-4xl text-foreground">
            Questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-base font-medium text-foreground hover:no-underline text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
