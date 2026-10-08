## Exploration: 2026-10-07-public-api-crm

### Current State
The application has a robust internal API under `src/app/api/` that is protected by user session authentication (`withAuth` using `Better Auth`). 
- **Contacts**: Are identified by `waIdentity` (or similar for IG/Messenger) and managed mainly through `src/server/inbox/identity.ts` (`getOrCreateContactByIdentity`) and `src/server/contacts.ts`.
- **Pipeline States (Leads)**: Managed via `src/server/leads/stage-history.ts` (`moveLeadToStage`). Changes to the pipeline stage are appended to the `lead_stage_event` table for historical tracking. The `lead` table maps `contactId` to `stageId`.
- **Conversations & Messages**: Managed via `src/server/inbox/send.ts`. Outbound messages are stored in `message` and routed through Meta's API depending on the conversation channel (`whatsapp`, `instagram`, `messenger`). 
- **Public API / Auth**: There is currently no `api_key` table or generic public API structure. External automations (like n8n) need static tokens that don't expire like UI sessions do.

### Affected Areas
- `src/lib/db/schema.ts` — Requires a new table (e.g. `api_key`) mapped to `organizationId` to store static integration tokens.
- `src/lib/api.ts` (or similar) — Requires a new middleware `withApiKey` to authenticate public requests.
- `src/app/api/public/v1/*` — New namespace for RESTful public endpoints:
  - `contacts/route.ts`
  - `contacts/[id]/pipeline/route.ts`
  - `contacts/[id]/messages/route.ts`
- `src/server/leads/stage-history.ts` & `src/server/inbox/send.ts` — Existing logic will be invoked by the new public routes.

### Approaches

#### 1. **Separate Public API Namespace (Recommended)**
   - **Description**: Create a dedicated `/api/public/v1/` namespace. Introduce a new `api_key` table to issue long-lived tokens per organization. Protect these routes with a `withApiKey` middleware (checking `x-api-key` header).
   - **Pros**: 
     - Complete isolation from UI session constraints.
     - Predictable REST conventions specifically designed for machine-to-machine interaction (like n8n).
     - Easier to version (e.g., `v1`).
     - Can batch requests (CRUD for multiple contacts) explicitly in these routes without complicating dashboard logic.
   - **Cons**: Requires creating new routes and a new auth middleware.
   - **Effort**: Medium

#### 2. **Reuse Existing Dashboard APIs with Dual Auth**
   - **Description**: Modify `withAuth` to allow both user sessions and `x-api-key` headers. Reuse the same endpoints the frontend uses.
   - **Pros**: Less duplicate routing code.
   - **Cons**: 
     - Dashboard APIs are often tailored for UI components (e.g. returning specific JSON shapes or HTML pieces) rather than strict generic REST.
     - Exposes internal API structure to public integrations.
     - Harder to manage batch operations if the UI doesn't need them.
   - **Effort**: Low to Medium

### Recommendation
Proceed with **Approach 1**. A separate `/api/public/v1/` namespace with its own `withApiKey` middleware is the industry standard for external integrations. It avoids coupling UI-specific payloads with machine-to-machine integrations. 
To support "singular and for multiple", endpoints like `POST /api/public/v1/contacts` can check if the body is an array or object, or we can expose a dedicated `/batch` endpoint. 

### Risks
- **Data Integrity**: Using `moveLeadToStage` requires ensuring a "lossReason" is provided when moving to a "lost" stage, otherwise the historical data becomes corrupt or the API returns 422. The public API must enforce this.
- **Message Origin Enum**: The `message` table's `origin` enum currently supports `["ai", "operator", "manual", "template"]`. We must decide whether to map API-sent messages to `operator` or `ai`, or add a new `api` enum value in a DB migration.
- **Idempotency**: External systems like n8n can retry on failure. The endpoints (especially sending messages or creating contacts) should handle retries gracefully without duplicating entities unnecessarily.

### Ready for Proposal
Yes. The orchestrator can proceed with proposing the schema changes (`api_key` table) and the new `/api/public/v1/` route structures to the user.
