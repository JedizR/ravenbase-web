# Ravenbase — Component Registry

> Agent instruction: Every story belongs to a component. When implementing
> a story, read the relevant component spec to understand the full scope
> of what this component does and what architectural constraints apply.
> Do not let one component's concerns leak into another's files.

## Component Map

| Component | ID | FRs | Key Source Files | Stories |
|---|---|---|---|---|
| IngestionPipeline | BE-COMP-01 | FR-01, FR-02 | src/api/routes/ingest.py, src/services/ingestion_service.py, src/workers/ingestion_tasks.py, src/adapters/storage_adapter.py, src/adapters/docling_adapter.py, src/adapters/openai_adapter.py, src/adapters/moderation_adapter.py | 005, 006, 007, 008 |
| GraphEngine | BE-COMP-02 | FR-03, FR-04, FR-05, FR-06, FR-13 | src/services/graph_service.py, src/workers/graph_tasks.py, src/adapters/neo4j_adapter.py, src/adapters/llm_router.py, src/api/routes/graph.py | 009, 010, 012, 013, 029 |
| RetrievalEngine | BE-COMP-03 | FR-07, FR-08 | src/services/retrieval_service.py, src/adapters/qdrant_adapter.py | 015, 016 |
| GenerationEngine | BE-COMP-04 | FR-08, FR-12 | src/services/generation_service.py, src/workers/generation_tasks.py | 016, 026 |
| AuthSystem | BE-COMP-05 | FR-09 | src/api/dependencies/auth.py | 018 |
| CreditSystem | BE-COMP-06 | FR-10 | src/services/credit_service.py | 023 |
| PrivacyLayer | BE-COMP-07 | FR-11 | src/services/privacy_service.py, src/adapters/presidio_adapter.py | 024, 025 |
| LandingPage | FE-COMP-01 | — | app/(marketing)/page.tsx, components/marketing/*.tsx | 021 |
| PricingPage | FE-COMP-02 | — | app/(marketing)/pricing/page.tsx, components/marketing/Pricing*.tsx | 022 |
| OnboardingWizard | FE-COMP-03 | — | app/(dashboard)/onboarding/page.tsx, components/domain/OnboardingWizard.tsx | 019 |
| Omnibar | FE-COMP-04 | — | components/domain/Omnibar.tsx, hooks/use-omnibar.ts | 008, 020 |
| MemoryInbox | FE-COMP-05 | — | components/domain/MemoryInbox.tsx, components/domain/ConflictCard.tsx | 014 |
| GraphExplorer | FE-COMP-06 | — | components/domain/GraphExplorer.tsx, components/domain/GraphNodePanel.tsx | 011, 030 |
| Workstation | FE-COMP-07 | — | components/domain/Workstation.tsx, components/domain/MetaDocEditor.tsx | 017 |

---

## BE-COMP-01: IngestionPipeline

**Purpose:** Everything from file upload through indexed chunks.
Owns the full ingestion lifecycle from HTTP request to Qdrant upsert.

**Boundaries:**
- Owns: file validation, MIME detection, SHA-256 dedup, Supabase Storage,
  Docling parsing, chunking, OpenAI embedding, Qdrant upsert,
  content moderation, status transitions, rate limiting
- Does NOT own: entity extraction (BE-COMP-02), retrieval (BE-COMP-03),
  authentication (BE-COMP-05)

**Critical invariants:**
- tenant_id included in every Qdrant payload point
- Source status always transitions PENDING → PROCESSING → INDEXING → COMPLETED
- graph_extraction always enqueued after COMPLETED
- No ARQ retry on failure (no re-raise in except block)

---

## BE-COMP-02: GraphEngine

**Purpose:** Knowledge graph construction, exploration, conflict
detection and resolution, and natural language graph queries.

**Boundaries:**
- Owns: Neo4j writes (Concept MERGE, Memory CREATE), graph API endpoints,
  LLMRouter calls for entity extraction and Cypher generation,
  conflict detection worker, conflict resolution API
- Does NOT own: chunk retrieval for generation (BE-COMP-03),
  authentication (BE-COMP-05)

**Critical invariants:**
- Concept nodes use MERGE, never CREATE (deduplication by {name, tenant_id})
- All Cypher queries pass tenant_id as a parameter — never f-string
- Cypher generation validates output is read-only before executing
- Chunk failures in graph_extraction are logged and skipped — do not abort

---

## BE-COMP-03: RetrievalEngine

**Purpose:** Hybrid retrieval combining Qdrant semantic search with
Neo4j graph-neighbor boosting.

**Boundaries:**
- Owns: hybrid search logic, result ranking, profile-scoped filtering
- Does NOT own: LLM generation (BE-COMP-04), graph writes (BE-COMP-02)

**Critical invariants:**
- All Qdrant queries use _tenant_filter() — never bypass it
- Results always scoped to tenant_id from JWT

---

## BE-COMP-04: GenerationEngine

**Purpose:** LLM-driven document generation and conversational chat,
with PII masking and SSE streaming.

**Boundaries:**
- Owns: meta-document generation, chat session management,
  streaming SSE responses, citation attachment
- Does NOT own: retrieval (BE-COMP-03), privacy/PII masking (BE-COMP-07)

---

## BE-COMP-05: AuthSystem

**Purpose:** JWT validation, Clerk webhook handling, and the
require_user/verify_token_query_param FastAPI dependencies.

**Boundaries:**
- Owns: all JWT decode logic, Clerk JWKS client, webhook handler
- Does NOT own: any business logic — thin gateway only

**Critical invariants:**
- tenant_id always extracted from JWT sub claim
- Never accept user_id from request body or query params

---

## BE-COMP-06: CreditSystem

**Purpose:** Per-operation credit deduction with ledger tracking.

**Boundaries:**
- Owns: credit balance checks, deduction, CreditTransaction writes
- Integrates with all other components that call LLM or storage APIs

---

## BE-COMP-07: PrivacyLayer

**Purpose:** GDPR-compliant cascade deletion and PII masking.

**Boundaries:**
- Owns: cross-store deletion (PostgreSQL, Qdrant, Neo4j, Supabase),
  Presidio PII detection and masking
- Does NOT own: the stores themselves (delegates to adapters)

---

## FE-COMP-01: LandingPage

**Purpose:** SEO-optimized marketing landing page that converts visitors to signups.

**Boundaries:**
- Owns: Hero, How It Works, Features, Testimonials, FAQ, CTA, Footer
- Does NOT own: auth (BE-COMP-05), pricing logic (FE-COMP-02)

---

## FE-COMP-02: PricingPage

**Purpose:** Pricing tiers page with Stripe Checkout integration.

**Boundaries:**
- Owns: Pricing tiers (Free/Pro/Team), annual/monthly toggle, Stripe Checkout
- Does NOT own: billing webhook processing (BE-COMP-07)

---

## FE-COMP-03: OnboardingWizard

**Purpose:** First-experience wizard for new users — profile creation + optional first upload.

**Boundaries:**
- Owns: Multi-step wizard (profile name → file upload), redirect logic
- Does NOT own: ingestion pipeline (BE-COMP-01), auth (BE-COMP-05)

---

## FE-COMP-04: Omnibar

**Purpose:** Global keyboard-driven command interface (Cmd+K). Slash commands for quick text capture and profile switching.

**Boundaries:**
- Owns: /ingest text capture, /profile switching, command detection
- Does NOT own: ingestion pipeline (BE-COMP-01), profile management (BE-COMP-05)

---

## FE-COMP-05: MemoryInbox

**Purpose:** Keyboard-first conflict resolution interface with 3 resolution flows (Binary Triage, Conversational, Auto-resolved with Undo).

**Boundaries:**
- Owns: Conflict card UI, keyboard navigation (J/K/Enter/Backspace/C), optimistic updates
- Does NOT own: conflict detection worker (BE-COMP-02), conflict resolution API (BE-COMP-02)

---

## FE-COMP-06: GraphExplorer

**Purpose:** Cytoscape.js-based visual knowledge graph explorer with filtering, node detail panel, and mobile list fallback.

**Boundaries:**
- Owns: Graph visualization, node detail panel, filters, neighborhood expansion
- Does NOT own: graph API endpoints (BE-COMP-02), conflict detection (BE-COMP-02)

---

## FE-COMP-07: Workstation

**Purpose:** Meta-Document generation workspace with real-time SSE streaming, Markdown rendering, and export functionality.

**Boundaries:**
- Owns: Streaming editor, document history, prompt input, export (MD/PDF)
- Does NOT own: Meta-Doc generation pipeline (BE-COMP-04), retrieval (BE-COMP-03)
