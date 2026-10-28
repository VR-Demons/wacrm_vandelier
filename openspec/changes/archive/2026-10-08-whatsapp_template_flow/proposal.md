## Intent

Enable external integrations (like n8n) to trigger WhatsApp template messages that automatically synchronize CRM state. This involves creating a specialized webhook endpoint that processes the template request, handles contact and folio upserts, progresses the lead's pipeline stage based on template configuration, and enqueues the message for delivery via Meta's template API.

## Scope

### In Scope
- Add a `pipelineStageId` column to the `template` database table.
- Update the template settings UI (`Ajustes / Plantillas`) to allow mapping templates to specific pipeline stages.
- Create a new public API endpoint (`api/public/v1/n8n/templates`) to process n8n batch payloads (upserting contacts, folios, advancing pipeline stages, and queueing template messages).
- Update the `process-outbox` cron job to handle `type: "template"` messages and dispatch them via Meta's template API.

### Out of Scope
- Modifying the generic text message endpoint (`api/public/v1/messages`).
- Changes to how templates are synced from Meta to the database.
- Building a UI for creating or editing template content (only pipeline mapping is in scope).

## Capabilities

### New Capabilities
- `whatsapp-templates`: Configuration and processing of WhatsApp template messages, including mapping them to CRM pipeline stages.

### Modified Capabilities
- `public-api`: Expanding the API to support the n8n template endpoint and adding template message support to the outbox queuing system.

## Approach

We will use the **Dedicated n8n Template Endpoint** approach. By isolating the n8n specific logic in `api/public/v1/n8n/templates/route.ts`, we cleanly handle business logic like contact creation, folio linkage, and pipeline progression using the CRM's state machine (`stage-history.ts`). The endpoint will then queue the message as `type: "template"` in the `outboxMessage` table, which the updated `process-outbox` cron will unpack and send.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/db/schema.ts` | Modified | Add `pipelineStageId` to `template` table |
| `src/app/api/templates/route.ts` & `[id]/route.ts` | Modified | Support updating `pipelineStageId` for templates |
| `src/components/settings/templates-client.tsx` | Modified | Add dropdown to map template to a pipeline stage |
| `src/app/api/internal/cron/process-outbox/route.ts` | Modified | Process `type: "template"` messages in the queue |
| `src/app/api/public/v1/n8n/templates/route.ts` | New | Webhook endpoint for n8n payload |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Data consistency issues with template names | Medium | Ensure n8n payload strictly matches DB template names. Fail gracefully if missing. |
| CRM history bypass | Low | Strictly use `recordLeadCreated` and `moveLeadToStage` from `stage-history.ts` for any pipeline changes. |
| Folio insertion collisions | Low | Use `onConflictDoNothing()` when upserting into `contactFolio`. |

## Rollback Plan

Revert the PR. Since `pipelineStageId` is nullable, code rollback is sufficient. Disable the n8n webhook on the n8n side if needed.

## Dependencies

- None

## Success Criteria

- [ ] Users can assign a pipeline stage to a WhatsApp template in settings.
- [ ] The new n8n endpoint successfully processes payloads, creating/updating contacts and their folios.
- [ ] Lead pipeline stages automatically progress when a mapped template webhook is received.
- [ ] Template messages are successfully queued and dispatched by the outbox cron.
