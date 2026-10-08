<public-api Specification>
## Purpose

Provides a core REST web services API allowing external systems to integrate with the CRM. Supports managing contacts, updating pipeline states, and queuing messages for asynchronous sending.

## Requirements

### Requirement: API Authentication

The system MUST authenticate public API requests using an administrative API key linked to a workspace/organization.

#### Scenario: Valid API Key

- GIVEN the request includes an `x-api-key` header with a valid admin key
- WHEN the public API endpoint is accessed
- THEN the system MUST authenticate the request and associate it with the correct workspace/organization
- AND proceed to process the request

#### Scenario: Invalid API Key

- GIVEN the request includes an invalid or missing `x-api-key` header
- WHEN the public API endpoint is accessed
- THEN the system MUST reject the request with a 401 Unauthorized error

### Requirement: Contact Management

The system MUST provide endpoints to create or update contacts via single or batch payloads.

#### Scenario: Single Contact Creation

- GIVEN a valid API key
- WHEN a valid contact payload is submitted to the contacts endpoint
- THEN the system MUST create or update the contact
- AND return a success response with the contact details

#### Scenario: Batch Contact Creation

- GIVEN a valid API key
- WHEN an array of contact payloads is submitted to the contacts endpoint
- THEN the system MUST create or update all valid contacts
- AND return a summary of successes and any failures

### Requirement: Pipeline State Updates

The system MUST provide an endpoint to update pipeline states for single or multiple contacts, bypassing strict requirements like `lossReason`.

#### Scenario: Updating Pipeline State

- GIVEN a valid API key
- WHEN a payload containing a contact ID and a new pipeline state is submitted
- THEN the system MUST update the pipeline state
- AND bypass the `lossReason` requirement if transitioning to a loss state

### Requirement: Message Queuing

The system MUST queue bulk messages asynchronously via an outbox pattern to avoid execution and rate limits.

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
</public-api Specification>
