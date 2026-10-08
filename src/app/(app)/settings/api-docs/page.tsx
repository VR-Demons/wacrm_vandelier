import React from "react";
import type { Metadata } from "next";
import { Mermaid } from "@/components/mermaid";

export const metadata: Metadata = {
  title: "API Docs - Configuración",
};

const architectureChart = `
flowchart TD
    Ext[External System <br> n8n / Zapier]
    API[Next.js Public API]
    DB[(PostgreSQL DB)]
    Cron[Coolify Scheduled Task]
    Worker[Internal /process-outbox]

    Ext -->|1. POST /contacts| API
    API -->|2. Upsert contacts| DB
    
    Ext -->|3. POST /folios| API
    API -->|4. Upsert folios| DB
    
    Ext -->|5. POST /messages| API
    API -->|6. Insert to outbox_message| DB
    
    Cron -->|7. POST to trigger queue| Worker
    Worker -->|8. Fetch & Delete message| DB
    Worker -->|9. Send message| Meta[WhatsApp API]
`;

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-2">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Public API Operations Manual
        </h1>
        <p className="text-text-2">
          This manual provides documentation for integrating external systems (such as n8n, Zapier, or custom applications) with the CRM Public API. The API allows external systems to manage contacts, update pipeline states, and queue messages for asynchronous sending.
        </p>
      </div>

      {/* Architecture Diagram */}
      <section className="space-y-4 pt-4">
        <h2 className="border-b pb-2 text-xl font-semibold tracking-tight">Architecture & Data Flow</h2>
        <Mermaid chart={architectureChart} />
      </section>

      {/* Authentication */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-xl font-semibold tracking-tight">Authentication</h2>
        <p className="text-text-2">
          All requests to the Public API must be authenticated using an API key (<code>x-api-key</code> header). You can generate and manage API keys from the Developer tab in the settings.
        </p>
        <div className="rounded-md bg-stone-900 p-4">
          <pre className="overflow-x-auto text-sm text-stone-300">
            <code>
              {`curl -H "x-api-key: YOUR_API_KEY" https://your-domain.com/api/public/v1/contacts`}
            </code>
          </pre>
        </div>
      </section>

      {/* Contact Management */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-xl font-semibold tracking-tight">1. Contact Management</h2>
        <p className="text-text-2">
          The API provides endpoints to create or update contacts via single or batch payloads.
        </p>
        
        <div className="space-y-3 pt-2">
          <h3 className="font-semibold">Endpoint: <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-sm text-brand-text">POST /api/public/v1/contacts</code></h3>
          <p className="text-sm font-medium">Single Contact Creation Example:</p>
          <div className="rounded-md bg-stone-900 p-4">
            <pre className="overflow-x-auto text-sm text-stone-300">
              <code>{`curl -X POST \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "phone": "+1234567890"}' \\
  https://your-domain.com/api/public/v1/contacts`}</code>
            </pre>
          </div>

          <p className="text-sm font-medium pt-3">Batch Contact Creation Example:</p>
          <div className="rounded-md bg-stone-900 p-4">
            <pre className="overflow-x-auto text-sm text-stone-300">
              <code>{`curl -X POST \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '[{"name": "Alice", "phone": "+111"}, {"name": "Bob", "phone": "+222"}]' \\
  https://your-domain.com/api/public/v1/contacts`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Pipeline State Updates */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-xl font-semibold tracking-tight">2. Pipeline State Updates</h2>
        <p className="text-text-2">
          Allows updating the pipeline state for a contact, bypassing strict requirements such as <code>lossReason</code> (which defaults to &quot;otro&quot; when transitioning to a loss state if missing).
        </p>
        
        <div className="space-y-3 pt-2">
          <h3 className="font-semibold">Endpoint: <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-sm text-brand-text">PUT /api/public/v1/pipeline</code></h3>
          <p className="text-sm font-medium">Update Pipeline State Example:</p>
          <div className="rounded-md bg-stone-900 p-4">
            <pre className="overflow-x-auto text-sm text-stone-300">
              <code>{`curl -X PUT \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"contactId": "123", "state": "won"}' \\
  https://your-domain.com/api/public/v1/pipeline`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Message Queuing */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-xl font-semibold tracking-tight">3. Message Queuing (Asynchronous)</h2>
        <p className="text-text-2">
          The CRM uses an outbox pattern for sending messages. Instead of sending messages immediately and risking execution timeouts or rate limits, the API queues them in an outbox. A background job processes the queue sequentially based on configured delay limits.
        </p>
        
        <div className="space-y-3 pt-2">
          <h3 className="font-semibold">Endpoint: <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-sm text-brand-text">POST /api/public/v1/messages</code></h3>
          <p className="text-sm font-medium">Sending a Message Example:</p>
          <div className="rounded-md bg-stone-900 p-4">
            <pre className="overflow-x-auto text-sm text-stone-300">
              <code>{`curl -X POST \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"contactId": "123", "message": "Hello from n8n!"}' \\
  https://your-domain.com/api/public/v1/messages`}</code>
            </pre>
          </div>
          <p className="text-sm text-text-3 italic">Note: This endpoint returns an immediate 202 Accepted or 200 OK response with queue IDs, and sets the sender origin to &quot;api&quot; or &quot;bot&quot;.</p>
        </div>
      </section>

      {/* Folios Management */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-xl font-semibold tracking-tight">4. Folios Management</h2>
        <p className="text-text-2">
          The API provides endpoints to ingest folios (financial or external records) associated with contacts. You can ingest a single folio or a batch of folios.
        </p>
        
        <div className="space-y-3 pt-2">
          <h3 className="font-semibold">Endpoint: <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-sm text-brand-text">POST /api/public/v1/folios</code></h3>
          <p className="text-sm font-medium">Single Folio Creation Example:</p>
          <div className="rounded-md bg-stone-900 p-4">
            <pre className="overflow-x-auto text-sm text-stone-300">
              <code>{`curl -X POST \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"Folio": 12345, "Telefono": "+1234567890", "Total": 1500.50, "Producto": "Prestamo Personal"}' \\
  https://your-domain.com/api/public/v1/folios`}</code>
            </pre>
          </div>
          
          <p className="text-sm font-medium pt-3">Batch Folio Creation Example:</p>
          <div className="rounded-md bg-stone-900 p-4">
            <pre className="overflow-x-auto text-sm text-stone-300">
              <code>{`curl -X POST \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '[{"Folio": 1001, "Telefono": "+111", "Total": 200}, {"Folio": 1002, "Telefono": "+222", "Total": 500}]' \\
  https://your-domain.com/api/public/v1/folios`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* n8n Integration */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-xl font-semibold tracking-tight">Integration Examples (n8n)</h2>
        <p className="text-text-2">
          When using <strong>n8n</strong>, you can use the <strong>HTTP Request</strong> node to interact with this API.
        </p>
        <ul className="list-inside list-disc space-y-1.5 text-text-2 ml-2">
          <li><strong>Method:</strong> Select <code>POST</code> or <code>PUT</code>.</li>
          <li><strong>URL:</strong> Provide the full endpoint URL.</li>
          <li><strong>Authentication / Headers:</strong> Add a header where Name is <code>x-api-key</code> and Value is your API key.</li>
          <li><strong>Body Content Type:</strong> <code>JSON</code>.</li>
          <li><strong>Body Parameters:</strong> Send the required JSON structure directly using expressions if mapping fields from a previous node.</li>
        </ul>
      </section>
    </div>
  );
}
