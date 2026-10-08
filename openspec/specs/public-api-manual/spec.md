<public-api-manual Specification>
## Purpose

Provides a comprehensive developer operation manual for integrating external systems (like n8n) with the CRM public API, including detailed cURL examples.

## Requirements

### Requirement: Authentication Documentation

The manual MUST document how to authenticate requests using the `x-api-key` header.

#### Scenario: Authenticating a Request

- GIVEN a developer needs to authenticate
- WHEN reading the manual
- THEN they MUST see a cURL example like:
  `curl -H "x-api-key: YOUR_API_KEY" https://api.crm.example.com/api/public/v1/contacts`

### Requirement: Contact Management Documentation

The manual MUST document single and batch contact creation/updating with cURL examples.

#### Scenario: Documenting Single Contact Creation

- GIVEN a developer needs to add a contact
- WHEN consulting the manual
- THEN they MUST see a cURL example for a single contact:
  `curl -X POST -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '{"name": "John Doe", "phone": "+1234567890"}' https://api.crm.example.com/api/public/v1/contacts`

#### Scenario: Documenting Batch Contact Creation

- GIVEN a developer needs to add multiple contacts
- WHEN consulting the manual
- THEN they MUST see a cURL example for a batch payload:
  `curl -X POST -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '[{"name": "Alice", "phone": "+111"}, {"name": "Bob", "phone": "+222"}]' https://api.crm.example.com/api/public/v1/contacts/batch`

### Requirement: Pipeline State Documentation

The manual MUST provide examples of updating a contact's pipeline state.

#### Scenario: Documenting Pipeline State Update

- GIVEN a developer needs to change a pipeline state
- WHEN consulting the manual
- THEN they MUST see a cURL example:
  `curl -X PUT -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '{"contactId": "123", "state": "won"}' https://api.crm.example.com/api/public/v1/pipeline`

### Requirement: Message Queuing Documentation

The manual MUST explain the asynchronous queuing mechanism for messages and provide cURL examples for sending messages.

#### Scenario: Documenting Message Sending

- GIVEN a developer needs to send a message to a contact
- WHEN consulting the manual
- THEN they MUST see an explanation of the async queue
- AND a cURL example for sending a message:
  `curl -X POST -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '{"contactId": "123", "message": "Hello from n8n!"}' https://api.crm.example.com/api/public/v1/messages`

### Requirement: Folios Management Documentation

The manual MUST document single and batch folio creation/updating with cURL examples.

#### Scenario: Documenting Single Folio Upsert

- GIVEN a developer needs to add or update a folio for a contact
- WHEN consulting the manual
- THEN they MUST see a cURL example for a single folio:
  `curl -X POST -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '{"folio": "INV-001", "name": "Initial Invoice", "status": "pending", "contactPhone": "+1234567890"}' https://api.crm.example.com/api/public/v1/folios`

#### Scenario: Documenting Batch Folio Upsert

- GIVEN a developer needs to add or update multiple folios
- WHEN consulting the manual
- THEN they MUST see a cURL example for a batch payload:
  `curl -X POST -H "x-api-key: YOUR_API_KEY" -H "Content-Type: application/json" -d '[{"folio": "INV-002", "contactPhone": "+123"}, {"folio": "INV-003", "contactPhone": "+456"}]' https://api.crm.example.com/api/public/v1/folios`

### Requirement: Architecture Diagram

The manual MUST include a dynamic architecture diagram describing the database schema and web service interactions.

#### Scenario: Rendering the Architecture Diagram

- GIVEN a user views the API manual in the UI
- WHEN the page loads
- THEN it MUST display a dynamic architecture diagram rendered using MermaidJS.
</public-api-manual Specification>
