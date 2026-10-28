# Comprehensive Review & Architectural Audit: Vocero CRM Specifications

**Document Version**: 1.0.0  
**Target Repository**: `VRDemons/specs` (Vocero CRM / Vandelier AI)  
**Governance Framework**: Vocero CRM Constitution (v1.4.0)  
**Date of Audit**: September 2026  
**Auditor**: Senior Principal Systems Architect & AI Pair Programmer  

---

## 1. Executive Summary & Product Thesis

### 1.1 Mission & Value Proposition
**Vocero CRM** is an open-source (MIT), self-hosted, sovereign WhatsApp & multi-channel CRM augmented by a deterministic and LLM-driven AI agent pipeline. The project is specifically engineered for **AI Automation Agencies (AAA)** deploying dedicated instances for SMB client businesses under a strict **"One Instance = One Business"** topology.

Unlike generic SaaS CRMs (which impose monthly per-seat licensing, opaque data custody, and complex multi-tenant billing models) or raw bot frameworks (which lack CRM pipelines, human escalation, and agent evaluation tools), Vocero CRM bridges the gap by packaging:
1. A real-time, 4-column reactive inbox (SSE-driven, coexistence-aware, WhatsApp/Instagram/Messenger).
2. A kanban lead qualification pipeline with audit trails and deal valuations.
3. An autonomous, bounded AI assistant that operates within strict knowledge base constraints and deterministic handoff triggers.
4. An automated self-testing evaluation sandbox (**El Laboratorio**) that evaluates the agent before production handover.
5. An optional, pluggable universal booking engine and Meta Conversions API (CAPI) attribution engine.
6. A 15-minute deployment architecture designed for commodity Linux VPS environments via Docker Compose and Coolify.

```
                              ┌──────────────────────────────────────────────────────────────┐
                              │                    VOCERO CRM ARCHITECTURE                   │
                              └──────────────────────────────────────────────────────────────┘
                                                              │
                     ┌────────────────────────────────────────┼────────────────────────────────────────┐
                     ▼                                        ▼                                        ▼
      ┌─────────────────────────────┐          ┌─────────────────────────────┐          ┌─────────────────────────────┐
      │     Multi-Channel Core      │          │     Intelligence & Eval     │          │    Conversion & Growth      │
      ├─────────────────────────────┤          ├─────────────────────────────┤          ├─────────────────────────────┤
      │ • WhatsApp Cloud API        │          │ • OpenRouter LLM Gateway    │          │ • Universal Booking Engine  │
      │ • Coexistence Echoes        │          │ • Bounded Actions (Zod)     │          │   (Enlace Fijo/Zoom/Google) │
      │ • Instagram Direct (IGSID)  │          │ • Knowledge Base (QA+Block) │          │ • Meta CAPI Attribution     │
      │ • Messenger (PSID)          │          │ • El Laboratorio (6 Personas│          │ • Ad Origin & Creatives     │
      │ • Local Media Asset Storage │          │   + LLM Judge + Hard Assert)│          │ • Zero-Dependency Analytics │
      └─────────────────────────────┘          └─────────────────────────────┘          └─────────────────────────────┘
                     │                                        │                                        │
                     └────────────────────────────────────────┼────────────────────────────────────────┘
                                                              ▼
                                               ┌─────────────────────────────┐
                                               │   Sovereign Foundation      │
                                               ├─────────────────────────────┤
                                               │ • Next.js 15 Standalone     │
                                               │ • PostgreSQL 16 + Drizzle   │
                                               │ • Better Auth (Self-Hosted) │
                                               │ • AES-256-GCM Encryption    │
                                               └─────────────────────────────┘
```

---

## 2. Constitutional Governance & Architectural Tenets

The codebase is governed by the **Vocero CRM Constitution (v1.4.0)**, an immutable rulebook that resolves architectural conflicts in favor of sovereignty, security, and developer discipline.

### 2.1 The Nine Constitutional Principles

| Principle | Name | Mandate & Invariants | Architectural Implementation |
|---|---|---|---|
| **I** | **Seguridad de Datos Primero** *(No Negociable)* | Zero credential leakage to clients or logs. All credentials encrypted at rest. Tenant isolation enforced by default. | AES-256-GCM via `lib/crypto` (`ENCRYPTION_KEY`). Credentials only reveal `last4`. Timing-safe webhook tokens. |
| **II** | **Soberanía / Self-Hosted** *(Endurecido v1.4.0)* | Closed list of runtime dependencies: WhatsApp Cloud API + OpenRouter LLM. Optional connectors allowed *only* under 5 strict conditions. S3, external email, Stripe, and Google services prohibited in core. | Monolithic Next.js + PostgreSQL. Media stored on local disk volume (`/data/media`). Connectors (`zoom`, `google`) gated behind deployment flags. |
| **III** | **Multi-Tenancy Real** | Even with 1 instance = 1 business, all domain tables enforce `organization_id NOT NULL` and org-first composite indices. | Drizzle schema with `organization_id` foreign key cascade, scoped queries via `scoped()` helper. Future-proof for multi-tenant extensions. |
| **IV** | **Idempotencia en Integraciones** | All incoming webhooks, callbacks, and events must be idempotent. Retries must not duplicate records, triggers, or agent runs. | `wa_message_id UNIQUE`, partial unique indices on bookings, database-level deduplication (`ON CONFLICT DO NOTHING`). |
| **V** | **Calidad Verificable** *(No Negociable)* | "Done" requires clean typecheck, lint, build, unit tests, and live verification. Unverifiable items must be flagged explicitly. | Strict TypeScript (`noUncheckedIndexedAccess`), Vitest unit suites, Playwright E2E regression suites. |
| **VI** | **Specs Antes de Código** | Mandatory specification prior to coding. Three explicit development tracks: Full Cycle, Lightweight, or Exempt. | Specification directory `specs/` containing `spec.md`, `plan.md`, `data-model.md`, and contracts. |
| **VII** | **Trazabilidad de Decisiones** | Decisions made under incomplete information must be documented visibly (NEEDS CLARIFICATION / ADR). | Explicit rationale in specs and plans; historical ADR records (ADR-001, ADR-002). |
| **VIII** | **Foco Vertical** | Exclusively a CRM for WhatsApp/chat conversations and lead conversion. Bulk blasting, visual drag-and-drop builders, and web scrapers are out of scope. | Data model strictly mapped to contacts, conversations, 24-hour windows, leads, pipeline stages, and handoff states. |
| **IX** | **Verificación en Vivo** *(No Negociable)* | Observable behavior must be exercised as a real user before marking complete (browser via Playwright, channel mocks, local first). | Self-test scripts (`scripts/e2e-*.mjs`), in-memory mock harness (`wa-mock`, `ai-mock`, `graph-mock`). |

### 2.2 Specification Tracks (Principio VI)
The project categorizes all work into three tracks:
1. **Ciclo Completo (Full Cycle)**: `specify → plan → tasks → implement`. Mandatory whenever a change modifies the **database schema / migrations** or alters a **published external contract** (`/api/bot/*`, webhook endpoints, SSE, or shared DTOs).
2. **Carril Ligero (Lightweight Track)**: `spec.md → implement`. Applicable for new user-observable behavior that does *not* touch schema migrations or external contracts (e.g., `019-resultados` dashboard).
3. **Exento (Exempt Track)**: Trivial bug fixes, formatting, internal refactors without contract modifications, dependency bumps.

---

## 3. Spec-by-Spec Deep Dive & Technical Audit

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SPECIFICATION TIMELINE & TRACKS                                │
├───────┬───────────────────────────────┬───────────────┬──────────────────────┬────────────────────────┤
│ Spec  │ Feature Name                  │ Track         │ Schema Migration     │ Status                 │
├───────┼───────────────────────────────┼───────────────┼──────────────────────┼────────────────────────┤
│ 001   │ Vocero Core v1                │ Ciclo Completo│ Initial Core Schema  │ Baseline Implemented   │
│ 002   │ Diseño Atlas White-Label      │ Ciclo Completo│ Org Metadata         │ Implemented            │
│ 003   │ Paridad WhatsApp Inbox        │ Ciclo Completo│ `media_asset`        │ Implemented            │
│ 014   │ Canal Instagram               │ Ciclo Completo│ Channel / IGSID      │ Implemented            │
│ 015   │ Motor Agenda Universal        │ Ciclo Completo│ 5 New Tables (0009)  │ Ratified & Ready       │
│ 016   │ Atribución CAPI               │ Ciclo Completo│ 3 New Tables (0010)  │ Implemented & Verified │
│ 017   │ Canal Messenger               │ Ciclo Completo│ Credentials & PSID   │ Implemented            │
│ 018   │ Anuncio de Origen             │ Ciclo Completo│ `image_asset_id` (14)│ Implemented            │
│ 019   │ Resultados                    │ Ligero        │ None (Pure Reads)    │ Specified              │
└───────┴───────────────────────────────┴───────────────┴──────────────────────┴────────────────────────┘
```

---

### 3.1 Spec 001: Vocero Core (`001-vocero-core`)

#### Core Objectives
The genesis specification for Vocero CRM. Defines the complete baseline system:
- **3-Column Real-Time Inbox**: Conversations list (360px), message thread (flex-1), and contact details panel (320px). Powered by Server-Sent Events (SSE).
- **Contact & Kanban Pipeline**: Automated contact creation on inbound webhook (`wa_id`), default pipeline stages (Nuevo, En conversación, Interesado, Cliente [won], Perdido [lost]), and drag-and-drop lead stage persistence.
- **Autonomous AI Agent**: OpenRouter LLM gateway executing at most one structured action per turn (`none`, `reply`, `update_lead`, `move_stage`, `handoff`). Injects full Knowledge Base (QA pairs + free text blocks).
- **El Laboratorio**: Self-contained agent evaluation sandbox executing 6 scripted personas against the real agent pipeline, judged by an independent LLM judge (`verde`, `amarillo`, `rojo`) with automated score calculation (0–100) and one-click KB remediation.
- **WhatsApp Cloud API Wizard**: Direct setup (system user token) or Agency/Tech Provider mode (embedded signup callback override) with AES-256-GCM encryption and timing-safe webhook routing (`/api/webhooks/wa/[webhookToken]`).
- **Bounded Templates**: Template management supporting Meta approval synchronization and single-variable (`{{1}}`) sending outside the 24-hour service window.
- **Deployment**: 15-minute Coolify (Ruta A) or Docker Compose + Caddy (Ruta B) setups.

#### Architectural Highlights & Invariants
1. **Deterministic Handoff & Safety Catch**: Handoff triggers immediately if the customer requests a human, if the model elects to escalate, or on provider errors / closed 24h windows. A fallback regex inspects inbound text *before* LLM execution. Crucially, the regex strictly rejects false positives such as `"somos 4 personas"`.
2. **Debounce & Concurrency Mutex**: Inbound messages from the same sender within 6 seconds coalesce into a single turn (`debounce 6s`), preventing erratic multi-message replies. An in-process lock per `conversation_id` prohibits concurrent execution turns.
3. **Hard Sandbox Assertion**: Laboratorio test conversations (`is_test = true`) are strictly forbidden from contacting Meta's live API. The transport layer contains an explicit hard assertion (`if (isTest) throw new Error(...)`) verified by unit tests.

---

### 3.2 Spec 002: Rediseño Atlas White-Label (`002-diseno-atlas-white-label`)

#### Core Objectives
Overhauls the initial dark-themed aesthetic into a clean, modern, enterprise light theme inspired by Linear and Notion, and introduces full white-label capabilities:
- **Design Tokens**: Standardized CSS variables in `globals.css` mapped to Tailwind.
- **Self-Hosted Typography**: Geist font bundled and served locally via `next/font/google` at build time (no runtime external CDN calls, honoring Principle II).
- **4-Column Layout**: Navigation sidebar (224px) → Conversation list (360px) → Message thread (flex-1) → Collapsible contact & deal panel (320px) with state persistence in `localStorage`.
- **Pipeline Stepper**: Replaces static stage badges with an interactive vertical stepper allowing instant lead stage advancement.
- **Runtime White-Labeling**: Custom brand name and accent colors configured under `Ajustes → Marca`. Stored in `organization.metadata`.
- **WCAG AA Compliance**: Runtime color derivation algorithm (`src/lib/branding.ts`) calculates hover, soft, tint, and high-contrast text shades (`--accent-text`), ensuring strict compliance with 4.5:1 contrast ratios.

---

### 3.3 Spec 003: Paridad WhatsApp del Inbox (`003-paridad-inbox-whatsapp`)

#### Core Objectives
Bridges the operational gap between the CRM web application and native WhatsApp Business usage:
- **Coexistence Echo Ingestion (`smb_message_echoes`)**: Solves the critical operational hazard where a business owner replies directly from their physical phone's WhatsApp Business app. Ingests outgoing echo messages (`direction=out`, `origin=manual`, `status=sent`, badge 📱).
- **Automated Human Handoff**: An incoming echo immediately triggers a `manual_reply` handoff, instantly pausing the AI agent so it does not talk over the human business owner.
- **End-to-End Media Attachments**: Ingestion and dispatch of images (5 MB), audio/video (16 MB), documents (100 MB), geolocation, and contact cards.
- **Sovereign Local Media Storage**: Discards external cloud buckets (S3/R2). Media binary payloads are written directly to a local filesystem volume (`MEDIA_DIR=/data/media`) and exposed exclusively through an authenticated, org-scoped endpoint (`GET /api/media/[assetId]`).
- **Container File Permissions**: Implements a dedicated entrypoint script (`vocero-entrypoint.sh`) ensuring non-root container users (`vocero`) retain read/write permissions over Docker host-mounted volumes.

---

### 3.4 Spec 014: Canal de Instagram (`014-canal-instagram`)

#### Core Objectives
Transforms Vocero CRM from single-channel WhatsApp software into a multi-channel conversation platform:
- **ADR-001 Architectural Pattern**: Delivers multi-channel functionality directly in `main`, gated behind the `CHANNELS` environment flag. The database migration is permanently applied but remains dormant when the flag is disabled.
- **Domain Identity Schema**: Extends `contact` and `conversation` with a `channel` discriminator (`whatsapp` | `instagram`). Contact identity for Instagram is normalized to `ig:<IGSID>`. Composite unique index `(organization_id, channel, wa_identity)` prevents identity collision across channels.
- **Dual Ingestion Pipelines**:
  1. Direct Meta Graph webhook (`object: "instagram"`).
  2. Zernio Unified Social API webhook (`X-Zernio-Signature` HMAC verification).
- **24-Hour Policy Handling**: Outside Meta's standard 24-hour messaging window, outgoing operator messages utilize the official `HUMAN_AGENT` message tag.
- **Contract Stability**: Retains `/api/bot/context` outputting `waIdentity` without breaking changes to accommodate external autonomous orchestrators.

---

### 3.5 Spec 015: Motor de Agenda Universal (`015-motor-agenda-universal`)

#### Core Objectives & Constitutional Milestone
Introduces a high-integrity, automated meeting scheduling engine. It represents the defining event that prompted the **Constitutional Amendment 1.4.0**, establishing the strict framework for *Optional External Connectors*.

```
                               ┌────────────────────────────────────────────────────────┐
                               │           SCHEDULING ENGINE INTEGRITY GATES            │
                               └────────────────────────────────────────────────────────┘
                                                            │
                       ┌────────────────────────────────────┴────────────────────────────────────┐
                       ▼                                                                         ▼
        ┌─────────────────────────────┐                                           ┌─────────────────────────────┐
        │   Gate 1: Inviolable Offer  │                                           │   Gate 2: Atomic Database   │
        ├─────────────────────────────┤                                           ├─────────────────────────────┤
        │ • Customer requests slot.   │                                           │ • Two customers choose same │
        │ • Core calculates window    │                                           │   instant simultaneously.   │
        │   using weekly hours & tz.  │                                           │ • Both hit booking API.     │
        │ • Generated slots stored in │                                           │ • Postgres enforces:        │
        │   `offered_slot` table.     │                                           │   UNIQUE(org, scheduled_at) │
        │ • Booking validated against │                                           │   WHERE status IN           │
        │   exact epoch in table.     │                                           │   ('agendada', 'realizada') │
        │ • Unoffered slot = 422      │                                           │ • Winner commits.           │
        │   rejected by construction. │                                           │ • Loser receives 23505      │
        │                             │                                           │   mapped to 409 + fresh slot│
        └─────────────────────────────┘                                           └─────────────────────────────┘
```

#### Core Components & Schema Design
1. **Feature Flag `AGENDA`**: Default off. When off, all scheduling routes (`/api/calendar/*`, `/api/bookings/*`, `/api/bot/availability`, `/api/bot/bookings`) unconditionally return 404, and the agent prompt omits all scheduling tokens.
2. **Deterministic Availability Math**: Calculates weekly working hours, slot duration (10–240 min), buffer padding (0–120 min), minimum notice (0–72 h), and maximum lookahead (1–60 days). Timezone calculations leverage Node's native `Intl` API—zero external date-math library bloat.
3. **Inviolable Reservation Integrity (Gate 1)**: The system persists generated slots into `offered_slot`. A booking request cannot reserve an arbitrary timestamp; it must match an active `offered_slot` record by exact epoch.
4. **Race-Condition & Double-Booking Prevention (Gate 2)**: Enforced via a PostgreSQL partial unique index:
   ```sql
   CREATE UNIQUE INDEX booking_org_active_slot_uq 
   ON booking (organization_id, scheduled_at) 
   WHERE status IN ('agendada', 'realizada') AND is_test = false;
   ```
   Concurrent collisions trigger PostgreSQL error code `23505`, which the service gracefully converts into a `409 Conflict (slot_taken)` accompanied by fresh replacement options.
5. **Universal Connector Layer**:
   - `enlace-fijo`: Zero dependencies. Delivers the business's static meeting link.
   - `zoom`: Server-to-Server OAuth. Creates unique Zoom meetings per booking.
   - `google`: Google Calendar API + Google Meet link via customer's OAuth refresh token.
6. **Decoupled Fallback (`link_pending`)**: External provider communication occurs *after* the core database commit. If Zoom or Google is down or tokens expire, the booking remains committed with `link_pending = true`. The deal is never lost due to third-party outages.

---

### 3.6 Spec 016: Atribución de Anuncios y Conversions API (`016-atribucion-capi`)

#### Core Objectives
Enables data-driven advertising attribution for Click-to-WhatsApp (CTWA) campaigns:
- **The Core Problem**: Meta ad algorithms optimize purely for chat initiations. Without conversion feedback, ad spend attracts cheap, low-intent traffic rather than paying customers.
- **Feature Flag `ATRIBUCION`**: Default off. Completely silences CAPI endpoints and ad tabs when disabled.
- **Referral Capture**: Extracts ad referral metadata (`referral` object with `ctwa_clid`) from the initial message in a conversation.
- **Conversion Signaling via Meta Graph API**:
  - `QualifiedLead`: Emitted when the lead enters the stage designated by the business.
  - `Purchase`: Emitted when the lead transitions to a won stage (`kind = 'won'`), transmitting order value and currency. If deal value is unstated, it is emitted *without* value (never `value: 0`, which would train Meta's algorithm that sales are worthless).
- **Zero PII Transmission**: Strictly preserves customer privacy. Does not transmit phone numbers or names to Meta; attribution relies entirely on `ctwa_clid`.
- **Non-Blocking Post-Transition Hook**: CAPI requests execute asynchronously post-database commit, ensuring CRM UI updates are never delayed by Meta Graph network latency.

---

### 3.7 Spec 017: Canal de Messenger (`017-canal-messenger`)

#### Core Objectives
Extends the multi-channel infrastructure established in Spec 014 to Facebook Messenger:
- **Channel Identity**: Incorporates `messenger` into `contact.channel` and `conversation.channel`. Identity is mapped to Page-Scoped IDs (`fb:<PSID>`).
- **Dual Ingestion**:
  1. Native Meta Graph Webhook (`object: "page"`).
  2. Zernio Unified API Webhook.
- **Dual-Layer Ingestion Security**: Route-level secret verification token combined with cryptographic HMAC-SHA256 signature validation.
- **Messaging Guardrails**: Enforces 2000-byte text boundaries and utilizes the `HUMAN_AGENT` tag outside the 24-hour service window. Rejects binary uploads gracefully with structured error messages rather than unhandled server 500s.

---

### 3.8 Spec 018: De qué Anuncio Llegó Cada Conversación (`018-anuncio-de-origen`)

#### Core Objectives
Ported from Vocero Cloud (Spec 212), this feature decouples ad visibility from advertising attribution:
- **Strategic Evolution of Spec 016**: Spec 016 originally restricted ad referral capture exclusively to instances with `ATRIBUCION` enabled. Spec 018 rectifies this by establishing that knowing where a customer came from is a fundamental CRM usability requirement.
- **Passive Capture**: Referral headlines, source IDs, and creative URLs are captured for *all* WhatsApp conversations regardless of flag state. However, to honor privacy promises, `ctwa_clid` is completely stripped and nullified if `ATRIBUCION` is disabled.
- **SSRF-Guarded Creative Ingestion**: Downloads ad thumbnail assets from Meta's CDN to the local `/data/media` volume. Ingestion enforces strict guardrails:
  - Whitelisted Meta CDN hostnames only (`*.fbcdn.net`, `*.facebook.com`).
  - HTTPS only, default ports only, zero credential injection.
  - Max payload cap of 300 KB; SVG and HTML content types strictly rejected.
  - Single asset shared across multiple contacts originating from identical ad IDs.
- **Inbox UI Enhancements**: Adds ad origin pills, filter views ("Anuncios"), creative image cards in the details drawer, and automatic contact source classification.

---

### 3.9 Spec 019: Resultados (`019-resultados`)

#### Core Objectives
Provides a self-contained analytics and pipeline visibility dashboard:
- **Lightweight Track**: Operates strictly via read-only queries against existing tables (`lead`, `lead_stage_event`, `conversation`, `message`, `ad_attribution`, `booking`). Zero database migrations.
- **Sovereign Analytics (No External Ad Spend APIs)**: Rejects complex Marketing API integrations and manual ad cost inputs. All metrics derive organically from internal message and stage logs.
- **Four Decoupled KPI Panels**:
  1. *Sales & Pipeline Funnel*: Deals created, deals won, total revenue, closure rate, average deal cycle length, drop-off reasons.
  2. *AI Agent Efficiency*: Turn response rate, median response latency, handoff frequency broken down by trigger cause, appointment setting conversion.
  3. *Origin & Ad Creative Attribution*: Performance breakdown by organic vs. ad referral, linking creative thumbnails to revenue.
  4. *Pipeline Health & Stagnation ("Qué se está cayendo")*: Stale leads untouched for >7 days, failed deliveries in last 30 days, conversations with 20–24 hours elapsed in their service window.
- **Timezone Awareness**: Slices 30-day windows based on the business's operational timezone configured in the calendar settings.

---

## 4. Cross-Cutting Architectural Analysis & Matrix

### 4.1 Systemic Invariants Matrix

```
┌─────────────────────────┬───────────────────────────────┬─────────────────────────────────┬──────────────────────────────────┐
│ Feature Domain          │ Primary Security Invariant   │ Concurrency / Idempotency Gate  │ Fallback / Degradation Mode      │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ Inbound Webhooks        │ Timing-safe URL token segment │ `wa_message_id UNIQUE`          │ Log error, return 200 to prevent │
│ (WA, IG, Messenger)     │ + HMAC-SHA256 signature       │ in `message` table              │ Meta webhook unsubscription      │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ AI Agent Execution      │ Hard sandbox check (`isTest`) │ In-process mutex lock per       │ Robust JSON parser fallback →    │
│                         │ blocks external traffic       │ `conversation_id` + 6s debounce │ 2 retries → Handoff to human     │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ Universal Booking       │ Customer credentials encrypted│ Partial UNIQUE index:           │ `link_pending = true`; booking   │
│ Engine                  │ with AES-256-GCM in DB        │ `(org_id, scheduled_at)`        │ persists; manual UI retry button │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ Meta CAPI Attribution   │ Zero PII (no phone or names)  │ `ON CONFLICT DO NOTHING` on     │ Best-effort background dispatch; │
│                         │ sent to Meta Graph API        │ `meta_conversion_event` table   │ DB transaction never blocked     │
├─────────────────────────┼───────────────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ Ad Creative Ingestion   │ SSRF whitelist: Meta CDNs only│ In-process lock per ad ID;      │ Ingestion fails safely; card     │
│                         │ HTTPS, max 300 KB, no SVG     │ single `media_asset` shared     │ renders with fallback megaphone  │
└─────────────────────────┴───────────────────────────────┴─────────────────────────────────┴──────────────────────────────────┘
```

---

## 5. Architectural Critique, Edge Cases & Latent Hazards

While the specifications exhibit world-class engineering discipline, deep scrutiny reveals several edge cases, systemic trade-offs, and latent architectural risks that must be actively monitored.

### 5.1 In-Process State vs. Monolithic Scalability
- **The Constraint**: Debounce timers, conversation execution locks, Server-Sent Events fan-out (`EventEmitter`), and background creative downloads all execute **in-memory within a single Node.js process**.
- **The Risk**: This architecture operates flawlessly in the intended "One VPS = One Business" deployment model. However, if an agency attempts to run multiple Next.js container replicas behind a load balancer for high availability, the in-memory mutex fails. Concurrent webhooks could hit different replicas, violating the single-turn guarantee and allowing duplicate agent responses.
- **Recommendation**: Document this explicitly as an immutable deployment topology: **Vocero CRM must run as a single container instance per database**. If horizontal scaling is ever required, the mutex and event bus must transition to Redis or Postgres LISTEN/NOTIFY.

### 5.2 Storage Accumulation in `/data/media`
- **The Constraint**: Spec 003 and Spec 018 persist WhatsApp attachments, voice notes, and ad thumbnails to the local Docker volume (`/data/media`).
- **The Risk**: The specs explicitly declare automated purge routines as "Out of Scope" (`"purga programada del volumen de media queda fuera"`). For high-volume businesses receiving hundreds of images, audio notes, and PDF catalogs weekly, disk storage will experience linear, unbounded growth. On a typical 20 GB or 40 GB VPS, the host disk could eventually exhaust inodes or storage capacity, crashing PostgreSQL.
- **Recommendation**: Implement a lightweight background maintenance job or shell script that archives or purges media assets older than 90 days if disk threshold exceeds 85%.

### 5.3 Knowledge Base Context Window Saturation
- **The Constraint**: Spec 001 dictates that the AI agent inlines the entire Knowledge Base (all Q&A entries and text blocks) directly into the LLM system prompt on every turn (`"v1 inyecta el KB completo al prompt; RAG queda fuera de alcance"`).
- **The Risk**: While Spec 001 adds a frontend token counter warning the user when approaching limits, large knowledge bases will inflate token consumption, driving up inference costs on OpenRouter and risking LLM context truncation or hallucination.
- **Recommendation**: Maintain a strict hard cap in the KB editor UI (e.g., maximum 20,000 characters). For requirements exceeding this threshold, specify a lightweight pgvector / local SQLite vector search module.

### 5.4 Evolution of Ad Capture: Spec 016 vs. Spec 018 Reconciliation
- **The Discrepancy**: Spec 016 originally specified that incoming ad referrals would only be processed when the `ATRIBUCION` flag was active. Spec 018 subsequently enmended this to ensure ad origins are always captured and visible.
- **Validation**: Ensure that the codebase implements the enmended logic from Spec 018 cleanly: inbound referral parsing must occur globally, but the storage of the sensitive `ctwa_clid` token must strictly respect the `isAttributionEnabled()` guard.

---

## 6. Synthesis & Strategic Recommendations

### 6.1 Strengths of the Specification Suite
1. **Exemplary Constitutional Integrity**: The project strictly enforces architectural boundaries. The refusal to compromise sovereignty (rejecting external S3 buckets, Stripe billing, or SaaS auth dependencies) ensures the core product remains truly free and self-hosted.
2. **Deterministic Safety in AI Automation**: Rather than treating LLMs as unpredictable conversationalists, Vocero binds the agent to strict Zod-validated action schemas, regex safety catches, debounce coalescing, and rigorous sandbox guarantees.
3. **World-Class Test Rigor (El Laboratorio)**: The evaluation harness is a triumph of agentic system design. Simulating customer personas against the live pipeline and judging them with an independent evaluator solves the single greatest friction point in agency deployment: proving that the agent actually works before handing over the keys.
4. **Relentless Focus on Operator Reality**: Features like coexistence echo tracking (`smb_message_echoes`), ad creative thumbnail caching, and non-blocking CAPI signaling directly reflect real-world battle testing in commercial agency environments.

### 6.2 Implementation Readiness & Next Steps
- **Specs 001, 002, 003, 014, 016, 017, 018**: Fully specified, architected, and validated against the constitution.
- **Spec 015 (Motor de Agenda Universal)**: Constitutional amendment 1.4.0 ratified; 58 tasks detailed in `tasks.md`. Ready for final implementation review and verification.
- **Spec 019 (Resultados)**: Clean lightweight spec. Ready for implementation as soon as analytics views are prioritized.
