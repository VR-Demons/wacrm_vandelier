# Public API Operations Manual

## Overview
This manual provides documentation for integrating external systems (such as n8n, Zapier, or custom applications) with the CRM Public API. The API allows external systems to manage contacts, update pipeline states, and queue messages for asynchronous sending.

## Authentication
All requests to the Public API must be authenticated using an API key (`x-api-key` header). You can generate and manage API keys from the "Desarrollador" tab in the dashboard settings (`/settings/developer`).

**Example: Authenticating a Request**
```bash
curl -H "x-api-key: YOUR_API_KEY" https://api.crm.example.com/api/public/v1/contacts
```

---

## Endpoints

### 1. Contact Management
The API provides endpoints to create or update contacts via single or batch payloads.

**Endpoint:** `POST /api/public/v1/contacts`

**Single Contact Creation Example**
```bash
curl -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "phone": "+1234567890"}' \
  https://api.crm.example.com/api/public/v1/contacts
```

**Batch Contact Creation Example**
To send multiple contacts at once, send a JSON array.
```bash
curl -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[{"name": "Alice", "phone": "+111"}, {"name": "Bob", "phone": "+222"}]' \
  https://api.crm.example.com/api/public/v1/contacts/batch
```
*(Note: Use `/api/public/v1/contacts` or `/api/public/v1/contacts/batch` as per your specific deployment's routing for batch).*

---

### 2. Pipeline State Updates
Allows updating the pipeline state for a contact, bypassing strict requirements such as `lossReason` (which defaults to "otro" when transitioning to a loss state if missing).

**Endpoint:** `PUT /api/public/v1/pipeline`

**Update Pipeline State Example**
```bash
curl -X PUT \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contactId": "123", "state": "won"}' \
  https://api.crm.example.com/api/public/v1/pipeline
```

---

### 3. Message Queuing (Asynchronous)
The CRM uses an outbox pattern for sending messages. Instead of sending messages immediately and risking execution timeouts or rate limits, the API queues them in an outbox. A background job processes the queue sequentially based on configured delay limits.

**Endpoint:** `POST /api/public/v1/messages`

**Sending a Message Example**
```bash
curl -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contactId": "123", "message": "Hello from n8n!"}' \
  https://api.crm.example.com/api/public/v1/messages
```
*Note: This endpoint returns an immediate `202 Accepted` or `200 OK` response with queue IDs, and sets the sender origin to `"api"` or `"bot"`.*

---

### 4. Folios Management
The API provides endpoints to ingest folios (financial or external records) associated with contacts. You can ingest a single folio or a batch of folios.

**Endpoint:** `POST /api/public/v1/folios`

**Single Folio Creation Example**
```bash
curl -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"Folio": 12345, "Telefono": "+1234567890", "Total": 1500.50, "Producto": "Prestamo Personal"}' \
  https://api.crm.example.com/api/public/v1/folios
```

**Batch Folio Creation Example**
To send multiple folios at once, send a JSON array.
```bash
curl -X POST \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[{"Folio": 1001, "Telefono": "+111", "Total": 200}, {"Folio": 1002, "Telefono": "+222", "Total": 500}]' \
  https://api.crm.example.com/api/public/v1/folios
```

---

## Integration Examples (n8n)

When using **n8n**, you can use the **HTTP Request** node to interact with this API.
- **Method:** Select `POST` or `PUT`.
- **URL:** Provide the full endpoint URL (e.g., `https://api.crm.example.com/api/public/v1/contacts`).
- **Authentication / Headers:** Add a header where Name is `x-api-key` and Value is your generated API key.
- **Body Content Type:** `JSON`.
- **Body Parameters:** Send the required JSON structure directly using expressions if mapping fields from a previous node.
