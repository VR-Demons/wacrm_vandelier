<Design: whatsapp_template_flow>
## Technical Approach

We will expose a new webhook endpoint for n8n that processes batched template message payloads. The endpoint will handle contact and folio upserts, resolve the requested template by name, advance the contact's pipeline stage (if the template is mapped to one), and enqueue the message. To support the staging logic, we add `pipelineStageId` to the `template` table and a `type` column to `outboxMessage`. The outbox processor will be updated to route template messages through the existing `sendTemplate` function.

## Architecture Decisions

### Decision: Outbox Queueing
**Choice**: Add a `type` column to `outboxMessage` and queue template sends instead of sending them inline.
**Alternatives considered**: Send the template inline during the n8n webhook request.
**Rationale**: Inline sending could hit rate limits or cause timeouts on large batches from n8n. The outbox pattern already exists for bulk text messages, so reusing it for templates ensures reliability and respects Meta's rate limits.

### Decision: Pipeline Mapping
**Choice**: Add `pipelineStageId` to the `template` table as a nullable reference.
**Alternatives considered**: Map stages via a separate configuration table or use naming conventions.
**Rationale**: Storing it directly on the template keeps the DB schema simple, naturally cascades on deletion (via `set null`), and makes it easy to return via the existing `GET /api/templates` endpoint for the UI.

### Decision: n8n Endpoint Isolation
**Choice**: Create a dedicated `/api/public/v1/n8n/templates` endpoint.
**Alternatives considered**: Modify the generic `/api/public/v1/messages` endpoint to handle templates and folios.
**Rationale**: The n8n payload contains highly specific business data (folios, lead progression) that would pollute the generic messaging endpoint. Isolation keeps both boundaries clean and easy to deprecate if the integration changes.

## Data Flow

```text
n8n ──(POST)──> /api/public/v1/n8n/templates
                       │
                       ├─> Upsert Contact & Folio
                       ├─> moveLeadToStage() (if mapped)
                       └─> Insert outboxMessage (type: "template")

[process-outbox cron] ──> Read outboxMessage
                       │
                       └─> sendTemplate() ──> Meta Graph API
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/db/schema.ts` | Modify | Add `pipelineStageId` to `template`. Add `type` to `outboxMessage`. |
| `src/server/whatsapp/templates.ts` | Modify | Update `serializeTemplate` to include `pipelineStageId`. |
| `src/app/api/templates/[id]/route.ts` | Create | Add `PATCH` endpoint to update `pipelineStageId` on a template. |
| `src/components/settings/templates-client.tsx` | Modify | Add pipeline stage selector dropdown to map templates to stages. |
| `src/app/api/internal/cron/process-outbox/route.ts` | Modify | Add branch to call `sendTemplate` when `msg.type === "template"`. |
| `src/app/api/public/v1/n8n/templates/route.ts` | Create | New webhook for n8n to process batches, upsert data, move leads, and enqueue. |

## Interfaces / Contracts

```typescript
// n8n Webhook Payload Contract
interface N8nTemplatePayload {
  records: Array<{
    phone: string;
    waUserId?: string; // Optional BSUID fallback
    name: string;
    folio: number;
    // ... folio fields
    templateName: string;
    templateLanguage?: string; // defaults to es_MX
    templateVariables?: Record<string, string>;
  }>;
}

// Outbox Payload for Templates
interface TemplateOutboxPayload {
  to: string; // contactId
  templateId: string;
  variables: Record<string, string>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `process-outbox` branch logic | Mock `sendTemplate` and verify it's called for `type: "template"`. |
| Integration | n8n Webhook | Call the endpoint with a mock payload, verify contact/folio upserts, and outbox insertion. |
| E2E | Template pipeline progression | Map a template, hit the webhook, verify `leadStageEvent` is created correctly in the DB. |

## Migration / Rollout

No data migration required. Schema changes involve adding nullable columns or columns with defaults (`pipelineStageId` on `template`, `type` on `outboxMessage` with a default of `"text"`). Code rollout is safe since new logic only runs on new webhook calls or new outbox messages.

## Open Questions

- None
</Design: whatsapp_template_flow>
