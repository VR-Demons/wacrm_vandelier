<Design: Public API & CRM Integrations>
## Technical Approach

We will expose a new suite of RESTful endpoints under `/api/public/v1/*` protected by a static API key (`x-api-key`). API keys will be scoped to an organization and manageable from a new "Desarrollador" tab in the dashboard settings. 

To bypass Next.js execution limits during batch message sends, we will implement the Outbox pattern. Messages will be saved to a new `outbox_message` table in a `pending` state. A Coolify Scheduled Task will routinely ping an internal cron endpoint (`/api/internal/cron/process-outbox`) protected by a `CRON_SECRET` to process this outbox and dispatch to WhatsApp sequentially, avoiding rate limit violations.

## Architecture Decisions

| Decision | Option Chosen | Tradeoff / Rationale |
|----------|---------------|----------------------|
| **API Authentication** | Static API Keys (hashed in DB) | **Rationale**: Simple to integrate with n8n/Make. Storing hashes (SHA-256) prevents leakage if the DB is compromised. Keys are generated and shown once. |
| **Batch Message Processing** | Outbox Pattern + Coolify Cron | **Rationale**: Vercel Cron is not available on Coolify. We must expose `POST /api/internal/cron/process-outbox` guarded by `CRON_SECRET` to be invoked by Coolify's `curl` task. |
| **Message Sender Identity** | Extend `origin` enum to `api`/`bot` | **Rationale**: Distinctly identifies messages sent by external integrations vs the internal AI (`ai`) or an operator (`operator`). |
| **Pipeline Loss Reason** | Default to `"otro"` for API requests | **Rationale**: The database enforces `loss_reason` for `lost` stages. Instead of relaxing the strict DB constraint, the API handler will default to `"otro"` if the external payload omits it. |

## Data Flow

```text
External System (n8n)
      │ (POST /api/public/v1/messages/batch)
      ▼
Public API Handler (validates x-api-key)
      │
      ▼
DB (outbox_message) <── inserts pending messages
      │
      ▲
Coolify Scheduled Task (curl)
      │ (POST /api/internal/cron/process-outbox)
      ▼
Internal API Handler (validates CRON_SECRET)
      │
      ▼
DB (outbox_message) ──▶ WhatsApp API (sends message) ──▶ DB (message)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/db/schema.ts` | Modify | Add `api_key` and `outbox_message` tables. Extend `message.origin` enum with `"api"` and `"bot"`. |
| `src/components/settings/settings-nav.tsx` | Modify | Add `Desarrollador` tab pointing to `/settings/developer`. |
| `src/app/(app)/settings/developer/page.tsx` | Create | UI for viewing and regenerating the organization API key. |
| `src/app/(app)/settings/developer/actions.ts` | Create | Server actions to generate/revoke API keys. |
| `src/lib/auth/api-key.ts` | Create | Utility to hash and validate the `x-api-key` header against the DB. |
| `src/app/api/public/v1/contacts/route.ts` | Create | Public endpoint for contact creation and retrieval. |
| `src/app/api/public/v1/pipeline/route.ts` | Create | Public endpoint to update a contact's lead stage. |
| `src/app/api/public/v1/messages/route.ts` | Create | Public endpoint to insert messages into the `outbox_message` queue. |
| `src/app/api/internal/cron/process-outbox/route.ts` | Create | Cron handler to process pending outbox messages, protected by `CRON_SECRET`. |

## Interfaces / Contracts

```typescript
// New schema definitions
export const apiKey = pgTable("api_key", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull().unique(),
  prefix: text("prefix").notNull(), // e.g., "sk_test_1234"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export const outboxMessage = pgTable("outbox_message", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  payload: jsonb("payload").notNull(), // { to, text, type, etc }
  status: text("status", { enum: ["pending", "processing", "sent", "failed"] }).notNull().default("pending"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  scheduledFor: timestamp("scheduled_for").notNull().defaultNow(),
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | API Key Utility | Verify SHA-256 hashing and matching functions work as expected. |
| Integration | Public API Auth | Send requests with missing, invalid, and valid `x-api-key` headers; ensure proper 401/200 HTTP responses. |
| Integration | Outbox Processor | Mock WhatsApp API; insert pending rows, trigger internal cron endpoint, verify rows update to `sent` and `message` records are created. |
| E2E | Coolify Cron | Hit `POST /api/internal/cron/process-outbox` with and without correct `CRON_SECRET` to verify rejection. |

## Migration / Rollout

No data migration required for existing tables (only adding new enums which Postgres supports natively via `ALTER TYPE ... ADD VALUE`). The new tables will require a standard drizzle migration. 
Coolify Scheduled Task must be configured post-deployment to run `curl -X POST https://<domain>/api/internal/cron/process-outbox -H "Authorization: Bearer $CRON_SECRET"` on a set interval (e.g., every minute).

## Open Questions

- [ ] Does the `/api/public/v1/contacts` endpoint need to support bulk upsert, or is single record operations enough for MVP?
- [ ] What is the exact delay/rate limit we want to enforce on the outbox processor? (e.g., 50 messages per minute max).
