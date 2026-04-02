"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { AnimatedGraph } from "./AnimatedGraph"

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-visible"
    >
      {/* Subtle radial gradient behind graph area for visual depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/4 right-0 w-150 h-150 bg-gradient-radial from-accent/8 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-100 h-100 bg-gradient-radial from-primary/5 via-transparent to-transparent blur-2xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="flex flex-col gap-6">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs font-mono text-muted-foreground tracking-wider uppercase"
            >
              ◆ EPISODIC_MEMORY_LAYER
            </motion.p>

            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight text-foreground text-balance"
            >
              What happened, where, and when.{" "}
              <span className="text-primary">Always.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-lg text-muted-foreground max-w-md"
            >
              Years of scattered notes → one structured memory. Ravenbase captures,
              structures, and surfaces everything you&apos;ve ever known.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="rounded-full h-12 px-8 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 shadow-md hover:shadow-lg">
                <Link href="/register">Start for free →</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-12 px-6 hover:bg-secondary transition-colors duration-200">
                <a href="#how-it-works">How it works ↓</a>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-xs font-mono text-muted-foreground tracking-wider"
            >
              ◆ NO_CREDIT_CARD_REQUIRED
            </motion.p>
          </div>

          {/* Graph */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex items-center justify-center overflow-visible"
            aria-hidden="true"
          >
            <AnimatedGraph className="w-full max-w-lg h-auto" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
