<Delta for public-api>
## ADDED Requirements

### Requirement: n8n Template Endpoint

The system MUST provide a specialized public API endpoint (`api/public/v1/n8n/templates`) for n8n to batch process WhatsApp templates, handling contact creation, folio linkage, pipeline progression, and queueing.

#### Scenario: Valid n8n Template Payload

- GIVEN a valid API key
- WHEN a valid n8n payload (with contacts, folios, and templates) is submitted
- THEN the system MUST upsert the contacts and folios
- AND advance the pipeline stage using `stage-history.ts` if a mapping exists
- AND enqueue the messages as `type: "template"` in the outbox
- AND return a success response

#### Scenario: Missing Template Match

- GIVEN a valid API key
- WHEN an n8n payload references a template name that does not exist in the database
- THEN the system MUST fail gracefully for that record without crashing the batch
- AND skip queueing the message for the missing template

## MODIFIED Requirements

### Requirement: Message Queuing

The system MUST queue bulk messages (including text and template messages) asynchronously via an outbox pattern to avoid execution and rate limits.
(Previously: The system MUST queue bulk messages asynchronously via an outbox pattern to avoid execution and rate limits.)

#### Scenario: Queuing Messages for Delivery

- GIVEN a valid API key
- WHEN a single or batch message payload is submitted
- THEN the system MUST insert the messages into the outbox queue with a `pending` status
- AND return an immediate 202 Accepted or 200 OK response with the queue IDs
- AND assign the sender identity as `"api"` or `"bot"`

#### Scenario: Async Message Processing

- GIVEN pending messages in the outbox queue
- WHEN the background cron job runs
- THEN the system MUST process the queue sequentially respecting configured rate limits and delays
- AND update the status to `sent` or `failed` accordingly
- AND dispatch template messages (`type: "template"`) via Meta's template API
</Delta for public-api>
