# Vocero CRM - Project Analysis

## 1. Overview
Vocero CRM is an open-source (MIT), self-hosted WhatsApp CRM designed primarily for AI/automation agencies to deploy for their clients (one instance per business). It features a real-time inbox, a kanban sales pipeline, an integrated AI agent that can converse with customers using a knowledge base, and a "Laboratory" for testing the agent against simulated personas before going live.

## 2. Tech Stack
- **Frontend & Backend Framework:** Next.js 15 (App Router) with React 19 in a monolith architecture.
- **Language:** Strict TypeScript (`strict` + `noUncheckedIndexedAccess`).
- **Styling:** Tailwind CSS (custom design system, white-label accent color). Defaults to dark theme. Animated interactive backgrounds powered by `@tsparticles`.
- **Internationalization (i18n):** Custom lightweight React Context + Hook with separate JSON dictionaries (`es.json`, `en.json`), defaulting to Spanish.
- **Database:** PostgreSQL.
- **ORM:** Drizzle ORM (with versioned migrations in `drizzle/`).
- **Authentication:** Better Auth (with the organization plugin for multi-tenancy).
- **Validation:** Zod for all external inputs.
- **Real-time Updates:** Server-Sent Events (SSE) via `/api/events` (no WebSockets).
- **Testing:** Vitest (unit tests) and Playwright (E2E tests in `tests/e2e/`).
- **Deployment:** Multi-stage Dockerfile, optimized for Coolify or standard `docker compose` with Caddy for automatic HTTPS.

## 3. Core Architecture & Design Principles
The project strictly follows a **Constitution** (`.specify/memory/constitution.md`) that enforces several non-negotiable rules:
- **Self-Hosted Sovereignty:** The core application depends only on the WhatsApp Cloud API and an optional OpenRouter-compatible LLM provider. External third-party services (like Zoom or Google Calendar) are strictly implemented as optional connectors behind deployment flags.
- **Multi-Tenancy:** While each instance serves a single business, the data model is built with true multi-tenancy (`organization_id` on all domain tables) to ensure isolation and future-proofing.
- **Idempotency:** Webhooks and external events are processed idempotently (e.g., using unique constraints on `wa_message_id`).
- **Security:** Secrets and tokens are encrypted at rest using AES-256-GCM.
- **Spec-Driven Development:** Features must have a specification written before implementation, following different "lanes" depending on their impact on the data model or public contracts.

## 4. Key Features & Domain Model

### 4.1. Real-time Inbox
Manages WhatsApp, Instagram, and Messenger conversations. Messages are ingested idempotently. The system respects Meta's 24-hour messaging window and supports template messages for reopening conversations.
- **Key Tables:** `contact`, `conversation`, `message`, `media_asset`.

### 4.2. Kanban Pipeline (Leads)
Tracks contacts through customizable sales stages.
- **Key Tables:** `lead`, `pipeline_stage`, `lead_stage_event`.
- **Append-only History:** Stage movements are recorded immutably in `lead_stage_event` to enable historical reporting and analytics.

### 4.3. AI Agent & Laboratory
An in-process AI agent that uses the business's knowledge base to converse with leads, group messages, and hand off to a human when necessary.
- **Knowledge Base:** Stored in `kb_entry` (Q&A and free-text blocks).
- **Agent Profile:** Configured in `agent_profile`.
- **Laboratory:** Runs simulated conversations using predefined personas (e.g., angry customer, pricing asker) in a sandbox environment that never touches the real WhatsApp API. It evaluates the agent's readiness and records the results (`agent_test_run`, `agent_test_case`).

## 5. Extension Mechanisms

### 5.1. Bring Your Own Bot (BYOB)
Businesses can disable the built-in AI and connect their own external bot via a dedicated service API (`/api/bot/*`). This allows external bots to drive the conversation without the WhatsApp token ever leaving the CRM.

### 5.2. Optional Channels & Features (Feature Flags)
Features that are not required by all instances are hidden behind environment variables (ADR-001):
- **Channels:** Instagram and Messenger (`CHANNELS=whatsapp,instagram,messenger`).
- **Agenda Engine:** (`AGENDA=on`) Allows the agent to offer real calendar slots and book meetings using connectors (Fixed Link, Zoom, Google Calendar).
- **Ad Attribution:** (`ATRIBUCION=on`) Tracks leads coming from Click-to-WhatsApp ads and reports conversions back to Meta's Conversions API.

## 6. Development Workflow
The repository emphasizes a high bar for the definition of "Done". Features must pass strict type checking, linting, and automated tests. Most importantly, changes must be verified via end-to-end behavior tests (`pnpm test:e2e`) using an internal mock environment (wa-mock and ai-mock) before being considered complete.
