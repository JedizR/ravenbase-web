# LandingPage

> **Component ID:** FE-COMP-01
> **Epic:** EPIC-07 — Marketing Site
> **Stories:** STORY-021
> **Type:** Frontend (Marketing Site)

---

## Goal

The Landing Page is the primary SEO surface and first impression for Ravenbase. It must communicate the product's value proposition within 10 seconds: a human-AI long-term memory system that never overwrites, always cites sources, and resolves contradictions. It converts visitors to signups via clear CTAs and trust-building social proof.

---

## Product Requirements

1. **Page Structure (top to bottom):** Header → Hero → How It Works → Features (3-column grid) → Feature Deep-Dive (2 alternating sections) → Testimonials → FAQ → CTA → Footer

2. **Hero Section:** Headline: "What happened, where, and when. Always." in Playfair Display. Subheadline: "Years of scattered notes → one structured memory". Animated knowledge graph mockup (~40 nodes, force-directed SVG). Two CTAs: primary "Start for free →" (links to `/register`), secondary "Watch demo" (scrolls to `#how-it-works`).

3. **How It Works Section:** 3-step workflow: Upload → Build Graph → Generate. Each step shown with icon + label.

4. **Features Grid:** 3-column grid: Memory Inbox card, Meta-Documents card, Knowledge Graph card. Each card uses mono label pattern (`◆ CONFLICT_RESOLUTION`, `◆ AI_GENERATION`, `◆ MEMORY_GRAPH`).

5. **Feature Deep-Dive Sections:** Two alternating left/right sections below the grid. Section 1: Memory Inbox product mockup (left) + explanatory copy (right). Section 2: Meta-Documents mockup (right) + explanatory copy (left). Each section has a `◆ FEATURE_NAME` mono label, benefit-focused h3, and 2–3 sentences.

6. **Testimonials Section:** `◆ HALL_OF_RECORDS` mono label. 3 testimonial cards in responsive grid. System-aesthetic naming: `REF-0088`, `REF-2301`, `REF-7725`. Each card: short quote, identifier in JetBrains Mono, role/context string. Placeholder copy pre-filled with `// TODO: replace with real testimonials` comment.

7. **FAQ Section:** 4 questions in shadcn/ui Accordion. Questions: (1) "Is my data private and secure?", (2) "How is this different from ChatGPT's memory feature?", (3) "How much does it cost?", (4) "Do I need technical skills to use Ravenbase?" Answers: 1–3 sentences each.

8. **CTA Section:** "Start building your second brain today." with primary "Start for free →" CTA.

9. **Footer:** Links to Privacy Policy, Terms of Service, Pricing. Social links.

10. **SEO Requirements:** `metadataBase` set in root layout, full OG + Twitter card tags, JSON-LD SoftwareApplication structured data, sitemap.xml and robots.txt, semantic HTML landmarks (`<header>`, `<main>`, `<section aria-labelledby>`, `<footer>`).

11. **Performance:** All images via `next/image` with `priority` on hero. `next/font` for all typefaces (no Google Fonts @import). Framer Motion scroll animations with `viewport={{ once: true }}`. Lighthouse mobile score > 90.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| All 9 sections render | Open / → visually confirm each section |
| Hero has two CTAs | Primary links to /register; secondary scrolls to #how-it-works |
| Hero headline correct | "What happened, where, and when. Always." in Playfair Display |
| Framer Motion scroll animations | Cards animate in on scroll (staggered reveal) |
| Mono labels used throughout | All section identifiers use ◆ LABEL_NAME pattern |
| FAQ accordion works | Click each question → answer expands |
| Mobile responsive | Resize to 375px → all sections adapt, no horizontal overflow |
| Lighthouse mobile > 90 | npx lighthouse --form-factor=mobile → all categories > 90 |
| Sitemap includes marketing routes | /sitemap.xml lists /, /pricing, /privacy, /terms |
| Robots.txt disallows dashboard | /robots.txt disallows /dashboard/ |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-021](../stories/EPIC-07-marketing/STORY-021.md) | Landing Page | Frontend | Full landing page with all 9 sections |

---

## Component Files

```
components/marketing/
  Header.tsx           — Site nav with logo + links
  HeroSection.tsx      — Hero with animated graph mockup
  WorkflowSection.tsx  — How It Works (Upload → Build Graph → Generate)
  FeaturesSection.tsx  — 3-column features grid
  FeatureDeepDive.tsx  — 2 alternating left/right sections
  TestimonialsSection.tsx — 3 REF-XXXX placeholder cards
  FAQSection.tsx       — shadcn Accordion, 4 questions
  CTASection.tsx       — CTA with primary button
  Footer.tsx            — Legal links + social

app/
  (marketing)/page.tsx  — Full page composing all sections
  sitemap.ts            — 4 marketing routes
  robots.ts             — Disallow dashboard routes
```

## Visual Patterns

### Hero Animation (CSS/Framer Motion)
The animated graph mockup is a simplified SVG force-directed visualization (~40 nodes) showing Concept and Memory nodes connected by edges. Use CSS animation or a lightweight Framer Motion variant — NOT full Cytoscape (too heavy for landing page).

```tsx
// Simplified animated graph — decorative only, not interactive
<div className="relative w-full h-96">
  <svg viewBox="0 0 800 400" className="w-full h-full">
    {/* Decorative nodes with CSS animation */}
    {nodes.map((node, i) => (
      <motion.circle
        key={node.id}
        cx={node.x}
        cy={node.y}
        r={node.type === "concept" ? 12 : 8}
        fill={node.type === "concept" ? "var(--primary)" : "var(--accent)"}
        animate={{ cx: node.x + Math.sin(i) * 20, cy: node.y + Math.cos(i) * 20 }}
        transition={{ repeat: Infinity, duration: 3 + i * 0.5, yoyo: true }}
      />
    ))}
  </svg>
</div>
```

### Testimonial Card Pattern
```tsx
<article className="bg-card border border-border rounded-2xl p-6 space-y-4">
  <blockquote className="text-foreground italic">
    "Ravenbase changed how I think about my knowledge. It's like having a librarian who remembers everything."
  </blockquote>
  <footer className="flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">REF-0088</p>
      <p className="text-xs text-muted-foreground">Knowledge Manager · Tech Co.</p>
    </div>
  </footer>
</article>
```

### Pricing Card (reuse on landing or pricing page)
```tsx
<div className={`
  bg-card rounded-2xl border p-6
  ${isPopular ? "border-primary border-2" : "border-border"}
`}>
  <h3 className="font-serif text-xl">{plan.name}</h3>
  <p className="text-3xl font-bold mt-2">${plan.price}<span className="text-sm text-muted-foreground">/mo</span></p>
  <ul className="space-y-2 mt-4">
    {plan.features.map(f => (
      <li key={f} className="text-sm flex items-center gap-2">
        <Check className="w-4 h-4 text-primary" /> {f}
      </li>
    ))}
  </ul>
  <Button className="w-full mt-6 rounded-full" variant={isPopular ? "default" : "outline"}>
    {plan.cta}
  </Button>
</div>
```
