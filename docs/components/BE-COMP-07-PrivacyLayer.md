# COMP-07: PrivacyLayer

> **Component ID:** BE-COMP-07
> **Epic:** EPIC-08 — Polish & Production Hardening
> **Stories:** STORY-024, STORY-025, STORY-035, STORY-037
> **Type:** Backend (with frontend deletion UI)

---

## Goal

The PrivacyLayer owns GDPR-compliant cascade deletion and PII masking. It ensures that personal data is permanently deleted on request (cascade across all four data stores) and that PII is masked before being sent to external AI APIs. This component delegates to other adapters (Qdrant, Neo4j, Supabase) but owns the orchestration and sequencing logic.

---

## Product Requirements

1. **GDPR Cascade Deletion:** `DELETE /v1/account` enqueues an ARQ job that deletes all user data across Supabase Storage → Qdrant → Neo4j → PostgreSQL → Clerk account. The endpoint returns `202` immediately. Deletion must complete within 60 seconds.

2. **Deletion Order:** The cascade MUST run in this exact order: (1) Supabase Storage files, (2) Qdrant vectors, (3) Neo4j nodes+edges, (4) PostgreSQL tables, (5) Clerk account. PostgreSQL tables deleted in FK-safe order: `job_statuses`, `credit_transactions`, `meta_documents`, `conflicts`, `source_authority_weights`, `sources`, `system_profiles`, `users`.

3. **Partial Failure Handling:** If any step fails, the deletion continues to subsequent steps. Partial deletion is preferred over no deletion.

4. **Audit Logging:** Every deletion step is logged with `action=gdpr_deletion`, `step=storage|qdrant|neo4j|postgres|clerk`, `user_id`. A persistent audit trail (structured log entry with timestamps) is stored before PostgreSQL is deleted.

5. **Frontend Deletion Dialog:** Settings page has "Delete Account" button with `AlertDialog`. User must type "DELETE" to confirm. Post-deletion redirects to `/` with "Account deleted" toast.

6. **PII Masking (Presidio):** Before any LLM call (Meta-Doc, Chat, Graph extraction), Presidio masks PII entities: PERSON names, EMAIL_ADDRESS, PHONE_NUMBER, CREDIT_CARD, US_SSN, LOCATION.

7. **Deterministic PII Masking:** The same PII entity appearing in different chunks MUST map to the same pseudonym alias (e.g., "John Smith" → "Entity_000" consistently). Aliases are stored in Redis with key `pii:map:{job_id}`, TTL 1 hour.

8. **Entity Map Cleanup:** After job completion, the entity map is deleted from Redis (in a `finally` block).

9. **Masking Toggle:** `ENABLE_PII_MASKING=true` in production, `false` in dev. Gate all Presidio calls on this setting.

10. **PII Masking Performance:** Masking adds < 500ms to the generation pipeline.

11. **Data Export:** `GET /v1/account/export` creates a ZIP of all user data in all four stores, with a download link emailed to the user.

12. **Inactivity Archival:** Free-tier users inactive for 90 days are sent a warning email at 85 days. At 90 days, their data is archived (moved to cold storage) and accounts are soft-deleted.

---

## Criteria and Tests

| Criterion | Test |
|---|---|
| DELETE /v1/account returns 202 immediately | Call DELETE → 202 within 100ms |
| Cascade runs in correct order | Log shows: storage → qdrant → neo4j → postgres → clerk |
| All 4 stores empty after deletion | Query all 4 stores → zero records for user |
| Partial failure continues cascade | Mock Qdrant failure → Neo4j, Postgres, Clerk still deleted |
| Audit logs for each step | Structured logs contain action=gdpr_deletion + step |
| "Type DELETE" confirmation dialog works | Enter "DELETE" → button enabled → deletion triggered |
| Post-deletion: redirect to / with toast | Delete account → / with toast "Account deleted" |
| PII masked before LLM calls | "John Smith" in chunk → not in LLM API payload |
| Same PII → same alias across chunks | "John" in chunk 1 and chunk 5 → Entity_000 in both |
| Entity map in Redis with 1hr TTL | Check Redis key → TTL ~3600 seconds |
| Entity map deleted after job | Check Redis after job → key gone |
| Masking < 500ms overhead | Time masking 10 chunks → < 500ms |
| ENABLE_PII_MASKING=false bypasses masking | Set env false → "John Smith" sent to LLM as-is |
| Data export creates ZIP | Call export → receive ZIP with all user data |
| Inactivity warning at 85 days | Cron check → email sent at day 85 |
| Inactivity archive at 90 days | Cron check → data archived, accounts soft-deleted |

---

## Related Stories

| Story | Title | Type | Description |
|---|---|---|---|
| [STORY-024](../stories/EPIC-08-polish/STORY-024.md) | GDPR Account Deletion Cascade | Backend | Full cascade across 4 stores |
| [STORY-025](../stories/EPIC-08-polish/STORY-025.md) | PII Masking (Presidio) | Backend | Deterministic PII masking before LLM calls |
| [STORY-035](../stories/EPIC-08-polish/STORY-035.md) | Data Export | Backend | Multi-store ZIP export + email link |
| [STORY-037](../stories/EPIC-08-polish/STORY-037.md) | Cold Data Archival | Backend | Inactivity archival for Free-tier |

---

## Subcomponents

The PrivacyLayer decomposes into 3 subcomponents.

---

### SUBCOMP-07A: GDPR Cascade Deletion

**Stories:** STORY-024
**Files:** `src/workers/deletion_tasks.py`, `src/services/deletion_service.py`, `src/api/routes/account.py`, `tests/integration/api/test_gdpr_deletion.py`

#### Details
The `DELETE /v1/account` endpoint enqueues an ARQ job and immediately returns `202`. The `cascade_delete_account` task runs the deletion in strict order across all four data stores. Each step is logged and runs to completion even if earlier steps fail.

#### Criteria of Done
- [ ] `DELETE /v1/account` returns `202` and enqueues ARQ job immediately
- [ ] Cascade order: Supabase Storage → Qdrant → Neo4j → PostgreSQL → Clerk
- [ ] PostgreSQL tables deleted in FK-safe order
- [ ] Every step logged with `action=gdpr_deletion` and `step` name
- [ ] Audit trail stored before PostgreSQL deletion
- [ ] Partial failure: log + continue to next step
- [ ] Total time < 60 seconds for typical account
- [ ] `user_id` always from JWT — never from request body
- [ ] Integration test verifies all 4 stores empty after deletion

#### Checklist
- [ ] `DELETE /v1/account` route: `enqueue_job("cascade_delete_account", user_id=...)` then `return {"status": "queued"}`
- [ ] `cascade_delete_account` task: step-by-step with `log.info("gdpr_deletion.step_complete", step=...)`
- [ ] Supabase: `supabase.storage.from_("files").remove([...])` for all user files
- [ ] Qdrant: `qdrant.delete(collection, Filter(must=[FieldCondition(key="tenant_id", match=MatchValue(value=user_id))]))`
- [ ] Neo4j: `MATCH (n {tenant_id: $user_id}) DETACH DELETE n`
- [ ] PostgreSQL: FK-safe order (job_statuses → credit_transactions → meta_documents → conflicts → source_authority_weights → sources → system_profiles → users)
- [ ] Clerk: `clerk.users.delete_user(user_id)` via Clerk Python SDK
- [ ] Audit log entry stored to Redis or written to DB before PostgreSQL deletion

#### Testing
```bash
# GDPR deletion integration test:
uv run pytest tests/integration/api/test_gdpr_deletion.py -v

# Manual deletion test:
# 1. Seed data for test user
# 2. Call DELETE /v1/account with auth
# 3. Check logs: storage → qdrant → neo4j → postgres → clerk
# 4. Verify all 4 stores: 0 records for user_id
```

---

### SUBCOMP-07B: PII Masking (Presidio)

**Stories:** STORY-025
**Files:** `src/adapters/presidio_adapter.py`, `src/workers/metadoc_tasks.py`, `src/workers/graph_tasks.py`, `tests/unit/adapters/test_presidio_adapter.py`

#### Details
The `PresidioAdapter` runs deterministic PII masking on all text before it is sent to external LLM APIs. It uses Presidio's `AnalyzerEngine` and `AnonymizerEngine` to detect and replace PII entities. Cross-chunk consistency is maintained via a Redis-backed entity map. The entity map TTL is 1 hour and is deleted after job completion.

#### Criteria of Done
- [ ] Masks: PERSON, EMAIL_ADDRESS, PHONE_NUMBER, CREDIT_CARD, US_SSN, LOCATION
- [ ] Same entity in different chunks → same alias (deterministic, not random)
- [ ] Entity map stored in Redis: `pii:map:{job_id}`, TTL 3600 seconds
- [ ] Entity map deleted in `finally` block after job completes
- [ ] `ENABLE_PII_MASKING` setting gates all Presidio calls
- [ ] Masking adds < 500ms for 10 chunks (512 tokens each)
- [ ] Test asserts "John Smith" NOT in LLM payload

#### Checklist
- [ ] `presidio_analyzer` and `presidio_anonymizer` imports inside function (`# noqa: PLC0415`)
- [ ] `PresidioAdapter` extends `BaseAdapter`
- [ ] Entity map loaded from Redis first, then updated with new entities, then saved back
- [ ] Alias format: `Entity_{len(entity_map):03d}` (e.g., Entity_000, Entity_001)
- [ ] `AnalyzerEngine.analyze()` with `entities=self.ENTITY_TYPES`
- [ ] `AnonymizerEngine.anonymize()` with `OperatorConfig("replace", {"new_value": alias})`
- [ ] `finally: await redis.delete(f"pii:map:{job_id}")`
- [ ] Gate on `settings.ENABLE_PII_MASKING` in both metadoc and graph tasks
- [ ] Unit test: mock Anthropic call → assert no PII in request payload
- [ ] Consistency test: same entity in 2 chunks → same alias in both masked outputs

#### Testing
```bash
# PII masking tests:
uv run pytest tests/unit/adapters/test_presidio_adapter.py -v

# Critical:
uv run pytest tests/unit/adapters/test_presidio_adapter.py::test_pii_not_in_llm_payload -v

# Consistency:
uv run pytest tests/unit/adapters/test_presidio_adapter.py::test_cross_chunk_consistency -v

# Performance:
uv run pytest tests/unit/adapters/test_presidio_adapter.py::test_masking_performance -v
# Expected: < 500ms for 10 chunks

# Masking disabled test:
# ENABLE_PII_MASKING=false python -c "from src.adapters.presidio_adapter import ..."
# Verify: no masking occurs

make quality
```

---

### SUBCOMP-07C: Data Export + Inactivity Archival

**Stories:** STORY-035, STORY-037
**Files:** `src/workers/export_tasks.py`, `src/services/export_service.py`, `src/api/routes/account.py`, `src/workers/archival_tasks.py`, `src/services/archival_service.py`, `src/api/routes/admin.py`

#### Details
The data export feature (`GET /v1/account/export`) creates a ZIP containing all user data from PostgreSQL (JSON), Qdrant (JSON with embeddings), Neo4j (Cypher dump), and Supabase Storage (files). A download link is emailed to the user via Resend. The inactivity archival system runs as a CRON job (or regular task) that identifies Free-tier users inactive for 85+ days, sends a warning email at 85 days, and archives + soft-deletes at 90 days.

#### Criteria of Done (STORY-035)
- [ ] `GET /v1/account/export` enqueues ARQ job, returns `202` with job_id
- [ ] Export job creates ZIP with: PostgreSQL JSON dump, Qdrant JSON dump, Neo4j Cypher, Supabase files
- [ ] Download link emailed to user via Resend when export ready
- [ ] Export job cleanup: delete ZIP from temp storage after download link expires (24 hours)
- [ ] Export scoped to `tenant_id` from JWT — no cross-user data

#### Criteria of Done (STORY-037)
- [ ] CRON/task identifies Free-tier users inactive for 85+ days (no login, no ingestion)
- [ ] At 85 days: warning email sent via Resend with 5-day countdown
- [ ] At 90 days: user data moved to cold/archive storage, `User.is_active = False`
- [ ] Archived users cannot log in; data retained for 30 days then hard-deleted
- [ ] Pro/Team users exempt from archival regardless of inactivity
- [ ] Credit balance, subscription status preserved for archival state

#### Checklist (STORY-035)
- [ ] `enqueue_job("export_user_data", user_id=...)` → returns 202
- [ ] `export_user_data` task: collect from all 4 stores, zip, upload to temp URL
- [ ] PostgreSQL export: JSON-serialize all user tables filtered by tenant_id
- [ ] Qdrant export: fetch all vectors for tenant_id, JSON serialize
- [ ] Neo4j export: Cypher dump of all nodes/edges for tenant_id
- [ ] Supabase files: download all files from user's storage path
- [ ] Resend email: `resend.emails.send({to: user_email, html: download_link})`
- [ ] Cleanup: delete temp ZIP after 24 hours

#### Checklist (STORY-037)
- [ ] Query: `SELECT * FROM users WHERE tier='free' AND last_active_at < now() - interval '85 days' AND is_active=True`
- [ ] At 85 days: `resend.emails.send({template: "inactivity_warning_85", ...})`
- [ ] At 90 days: `User.is_active = False`, move data to cold storage path
- [ ] Cold storage: Supabase Storage path `archive/{user_id}/`, Qdrant collection `archive_memories`
- [ ] 30-day grace period: hard-delete after 30 days of archival
- [ ] Pro/Team check: skip archival if `user.tier in ('pro', 'team')`
- [ ] CRON schedule: daily at 00:00 UTC

#### Testing
```bash
# Export test:
curl -X POST http://localhost:8000/v1/account/export \
  -H "Authorization: Bearer TOKEN"
# Expected: 202 {"job_id": "..."}
# Check email: download link received

# Inactivity archival test:
# Seed user with last_active_at = 86 days ago
# Run archival task
# Check: email sent (85-day warning) or User.is_active=False (90-day)
```

---

## Credit Cost Reference

| Operation | Credits |
|---|---|
| Ingestion | 1/page |
| Meta-Doc Haiku | 18 |
| Meta-Doc Sonnet | 45 |
| Chat Haiku | 3 |
| Chat Sonnet | 8 |
| NL Graph Query | 2 |
| Signup bonus | +500 |
| Referral signup | +200 |
| Referral first upload | +200 |
