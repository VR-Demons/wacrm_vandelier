<Proposal: 2026-10-07-public-api-crm>
## Intent

We need to provide a public web services API to allow external systems (like n8n) to integrate with the CRM. Specifically, this API will allow adding contacts, updating pipeline states, and sending/storing messages. The solution requires a new administrative API key system, proper sender identity for bot messages, and an asynchronous message queue to avoid hitting execution or rate limits.

## Scope

### In Scope
- New API endpoints under `src/app/api/public/v1/*` for contacts, pipeline, and messages (single and batch).
- New database table `api_key` for generic, admin-level organization auth (`x-api-key`).
- Async message sending queue (outbox pattern + cron or job queue) with configurable limits and delays.
- Support for `"api"` or `"bot"` sender identity on messages.
- Full operation manual with cURL examples.

### Out of Scope
- Granular API key permissions (single general admin key per org is sufficient).
- Enforcing `lossReason` on pipeline loss state via this public API (defaults or bypasses will be used).

## Capabilities

### New Capabilities
- `public-api`: Endpoints for contacts, pipelines, messages; API key authentication; rate-limited message sending queue.
- `public-api-manual`: Developer operation manual with cURL examples for the web service.

### Modified Capabilities
- None

## Approach

1. **Authentication**: Create an `api_key` table (linked to the workspace/organization). Middleware or API handlers will validate the `x-api-key` header against this table.
2. **Endpoints**: Implement `src/app/api/public/v1/...` routes using Next.js route handlers. These will support both single objects and arrays (batch) payloads.
3. **Queue Architecture**: Since Next.js serverless has execution limits, implement an outbox pattern. The bulk message endpoint will insert messages into an `outbox_messages` table (or similar) with status `pending`. A cron job (via Vercel Cron or similar) will process this queue sequentially, respecting configurable rate limits and delays to prevent blocking Meta.
4. **Data Modeling**: Update the message sender enum/schema to include `"api"` or `"bot"`. Update pipeline logic to allow optional `lossReason` when called from the public API context (bypassing the strict requirement).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/public/v1/*` | New | Public API route handlers |
| Database Schema | Modified | Add `api_key` table, add `"api"`/`"bot"` to message sender enum, add outbox table for queued messages |
| Message Sending Logic | Modified | Introduce queue/outbox mechanism for bulk messages |
| Pipeline Logic | Modified | Bypass `lossReason` requirement for public API requests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Serverless timeout on bulk sends | High | Implement the outbox pattern + cron job to process messages asynchronously instead of inline. |
| Meta API rate limiting | Medium | Introduce configurable wait/delay between sends in the queue processor. |

## Rollback Plan

Revert the database migrations (drop `api_key` and outbox tables, revert enum). Delete the `src/app/api/public/v1/` directory.

## Dependencies

- Cron job mechanism (e.g., Vercel Cron) for processing the message queue.

## Success Criteria

- [ ] External systems can authenticate using `x-api-key`.
- [ ] Contacts and pipeline states can be updated via single or batch payloads.
- [ ] Bulk messages are queued and sent asynchronously with a configurable delay.
- [ ] Bot messages correctly show `"api"` or `"bot"` origin.
- [ ] Comprehensive operation manual with cURL examples is available.
</Proposal: 2026-10-07-public-api-crm>
