<Tasks: 2026-10-07-public-api-crm>
## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~600-800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | DB schema & Settings UI | PR 1 | Base branch: main. Includes settings for delay limit and API key generation UI. |
| 2 | Public API Endpoints | PR 2 | Base branch: main. Includes contacts (single/bulk), pipeline, and messages. |
| 3 | Outbox Processor & Docs | PR 3 | Base branch: main. Includes cron route, Outbox logic, and Operations Manual. |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Update `src/lib/db/schema.ts` to add `api_key` and `outbox_message` tables.
- [x] 1.2 Update `src/lib/db/schema.ts` to extend `message.origin` enum with `"api"` and `"bot"`.
- [x] 1.3 Update `src/lib/db/schema.ts` to add `outbox_delay_limit` to `organization` or `workspace` settings table.
- [x] 1.4 Create `src/lib/auth/api-key.ts` with utility functions for SHA-256 hashing and API key validation.

## Phase 2: UI Implementation (Settings)

- [x] 2.1 Update `src/components/settings/settings-nav.tsx` to add "Desarrollador" tab routing to `/settings/developer`.
- [x] 2.2 Create `src/app/(app)/settings/developer/actions.ts` with server actions to generate/revoke API keys and update `outbox_delay_limit`.
- [x] 2.3 Create `src/app/(app)/settings/developer/page.tsx` with UI to manage API keys and a slider/input to configure `outbox_delay_limit`.

## Phase 3: Core Implementation (API Endpoints & Cron)

- [x] 3.1 Create `src/app/api/public/v1/contacts/route.ts` to support both single and bulk payload processing.
- [x] 3.2 Create `src/app/api/public/v1/pipeline/route.ts` to update lead stages (default `loss_reason` to `"otro"` when missing).
- [x] 3.3 Create `src/app/api/public/v1/messages/route.ts` to validate request and insert into `outbox_message` queue.
- [x] 3.4 Create `src/app/api/internal/cron/process-outbox/route.ts` to process outbox sequentially, enforcing `outbox_delay_limit`, protected by `CRON_SECRET`.

## Phase 4: Testing

- [x] 4.1 Write unit tests for `src/lib/auth/api-key.ts` (hashing logic).
- [x] 4.2 Write integration tests for API Auth validation (401/200).
- [x] 4.3 Write tests for `/api/public/v1/contacts` covering single vs bulk handling.
- [x] 4.4 Write integration tests for Outbox Processor cron endpoint validating rate limits and database updates.

## Phase 5: Documentation

- [x] 5.1 Create `Operations Manual.md` with API Docs and cURLs for all new public endpoints.

## Phase 6: Folios Management

- [x] 6.1 Create tests in `tests/unit/api-public-folios.test.ts` for Folios API endpoint.
- [x] 6.2 Create `src/app/api/public/v1/folios/route.ts` accepting POST (single/array payloads).
- [x] 6.3 Update `src/lib/auth/public-api.ts` to export `requirePublicApiKey`.
- [x] 6.4 Update `openspec/changes/2026-10-07-public-api-crm/operations-manual.md` to add Folios Management section.
- [x] 6.5 Verify implementation by running tests and build command.
