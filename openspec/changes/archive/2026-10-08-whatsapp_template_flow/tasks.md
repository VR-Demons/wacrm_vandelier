## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~250-300 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Entire feature | PR 1 | Single cohesive PR. |

## Phase 1: Foundation & DB Schema

- [x] 1.1 Update `src/lib/db/schema.ts` to add `pipelineStageId` (nullable reference) to the `template` table.
- [x] 1.2 Update `src/lib/db/schema.ts` to add `type` (default `"text"`) to the `outboxMessage` table.

## Phase 2: Core API & Logic

- [x] 2.1 Update `src/server/whatsapp/templates.ts` to include `pipelineStageId` in `serializeTemplate`.
- [x] 2.2 Create `src/app/api/templates/[id]/route.ts` with a `PATCH` endpoint to update `pipelineStageId` on a given template.
- [x] 2.3 Modify `src/app/api/internal/cron/process-outbox/route.ts` to add a branch that routes outbox messages to `sendTemplate` when `msg.type === "template"`.

## Phase 3: Integration & Webhook

- [x] 3.1 Create `src/app/api/public/v1/n8n/templates/route.ts` with a `POST` handler to process batched n8n payloads, upsert contact/folio records, advance lead stages, and insert into `outboxMessage` with type `"template"`.

## Phase 4: Frontend UI

- [x] 4.1 Modify `src/components/settings/templates-client.tsx` to add a pipeline stage selector dropdown to map templates to stages.

## Phase 5: Testing

- [x] 5.1 Write unit tests for `process-outbox` branch logic to verify it calls `sendTemplate` for template messages.
- [x] 5.2 Write integration tests for the n8n webhook verifying contact/folio upserts and outbox insertion.
- [x] 5.3 Write e2e tests for template pipeline progression (verifying `leadStageEvent` creation).
