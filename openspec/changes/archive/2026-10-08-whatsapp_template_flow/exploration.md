## Exploration: whatsapp_template_flow

### Current State
Currently, `api/public/v1/messages` receives single or batched text messages and queues them in `outboxMessage`. The `process-outbox` cron reads these messages and sends them via `sendText()`. Templates are synced with Meta and stored in the `template` DB table, but they lack a configuration link to pipeline stages. Additionally, there is no native endpoint workflow mapping external n8n triggers to template messaging that automatically handles contact creation, folio upsertion, and pipeline state updates. 

### Affected Areas
- **`src/lib/db/schema.ts`**:
  The `template` table needs a new column `pipelineStageId` referencing `pipelineStage.id` to map the template to a target pipeline stage.
- **`src/app/api/templates/route.ts`** & **`src/app/api/templates/[id]/route.ts`** (New/Update):
  Backend logic needs to receive, store, and edit `pipelineStageId`. (An edit route needs to be created or overloaded to update just the stage on existing templates without triggering a Meta sync).
- **`src/components/settings/templates-client.tsx`**:
  The settings UI for templates must include a dropdown connecting a template to an existing pipeline stage, reading from available pipeline stages in the organization.
- **`src/app/api/internal/cron/process-outbox/route.ts`**:
  The cron must be updated to process `outboxMessage` records where `type === "template"`, unpacking `templateId` and `variables` and dispatching them through `sendTemplate()`.
- **`src/app/api/public/v1/n8n/templates/route.ts` (New Endpoint)**:
  This new endpoint handles the incoming n8n batch payload (`phone`, `templateName`, `folios`, `variables`).
  It will:
  1. Upsert the `contact` based on `phone`.
  2. Upsert folios into the `contactFolio` table.
  3. Look up the `template` by `templateName`.
  4. Perform lead progression: If the template has a configured `pipelineStageId`, check if the contact has an active lead. If so, move it (`moveLeadToStage`); if not, create it (`recordLeadCreated`), correctly utilizing `src/server/leads/stage-history.ts` for tracking.
  5. Fetch/create a `conversation` for the contact.
  6. Enqueue the message as `type: "template"` into `outboxMessage` containing the `templateId` and `variables`.

### Approaches
1. **Dedicated n8n Template Endpoint (Recommended)**
   - *Description*: Create `api/public/v1/n8n/templates/route.ts` explicitly tailored for the n8n flow logic (upserting contact, linking folios, advancing the pipeline, then queueing the template).
   - *Pros*: Isolates highly-specific integration requirements (like folio arrays and pipeline movements) away from generic message endpoints. Promotes clean scaling.
   - *Cons*: Adds a new specialized public endpoint.
   - *Effort*: Medium

2. **Extend Existing Messages API**
   - *Description*: Overload `api/public/v1/messages/route.ts` to accept `type: "template"` along with an optional `folios` array, embedding the pipeline stage shifting inside the loop.
   - *Pros*: Reuses the existing public URL.
   - *Cons*: Modifies a dumb outbox queueing endpoint into a complex, side-effect heavy controller (updating pipelines and handling folios).
   - *Effort*: Medium

### Recommendation
**Approach 1 (Dedicated n8n Template Endpoint)**. It separates the generic outgoing text logic from this highly specific n8n webhook, which handles business logic (pipeline transitions and folio tracking). We should still queue the template messages using the existing `outboxMessage` table by adding `"template"` type support in the process-outbox cron.

### Risks
- **Data consistency**: The flow depends on the `templateName` passed by n8n matching exactly with the database template names. Misalignments will skip the flow.
- **Lead Events Constraints**: We must ensure that any lead pipeline changes correctly pass through `stage-history.ts` (`recordLeadCreated` / `moveLeadToStage`) to guarantee history tracking isn't bypassed, adhering to strict CRM integrity rules.
- **Folio Collision**: Handling folios safely with `contactFolio` must resolve potential duplicate inserts gracefully using `onConflictDoNothing()`.

### Ready for Proposal
Yes. The orchestrator can proceed to `sdd-proposal`.
