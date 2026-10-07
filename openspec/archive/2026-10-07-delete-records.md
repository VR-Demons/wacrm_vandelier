# SDD Plan: Delete Conversations, Messages, and Contacts

## 1. Proposal
**Problem:** 
Currently, the CRM lacks the capability to permanently delete contacts, conversations, and individual messages. Users accumulate test data, spam, or simply need to purge specific records for privacy and housekeeping, but there is no UI or API endpoint to do so.

**Intent:** 
- Add functionality to delete a Contact, which will implicitly delete all their associated conversations, messages, leads, and pipeline history.
- Add functionality to delete a Conversation, which will implicitly delete all its messages.
- Add functionality to delete a specific Message within a conversation.
- Add an option in the workspace settings to delete ALL contacts at once (which cascades to wipe all conversations, messages, and leads), acting as a clean slate.
- Update the UI to expose these actions contextually (e.g., dropdowns in Inbox, Contacts List, and Message Thread) and globally in Settings.

## 2. Specification
**API Endpoints:**
- `DELETE /api/contacts/[id]`: Deletes the contact. The database schema's `ON DELETE CASCADE` on `lead`, `conversation`, and `booking` will cleanly remove all associated domain data. Returns `{ success: true }`.
- `DELETE /api/conversations/[id]`: Deletes the conversation. `ON DELETE CASCADE` removes all associated messages. Returns `{ success: true }`.
- `DELETE /api/conversations/[id]/messages/[messageId]`: Deletes a specific message. Returns `{ success: true }`.
- `DELETE /api/settings/contacts`: Deletes all contacts for the organization at once. `ON DELETE CASCADE` removes all associated domain data across the board. Returns `{ success: true }`.

**UI Components:**
- **Contacts Client (`src/components/contacts/contacts-client.tsx`)**: Add a "Delete" action in the row/card menu for each contact. Include a confirmation dialog warning that all history and leads will be lost.
- **Inbox Thread Header (`src/components/inbox/contact-panel.tsx` or similar)**: Add a "Delete Conversation" action inside a dropdown menu. Include a confirmation dialog warning that the chat history will be lost.
- **Message Thread (`src/components/inbox/message-thread.tsx`)**: Add a context menu or a small trash icon to each message bubble (perhaps revealed on hover) to delete individual messages. Include a confirmation step.
- **Settings Data Hygiene (`src/components/settings/...`)**: Add a "Danger Zone" section with a "Delete All Contacts & Data" button. Include a strict confirmation dialog (e.g., requiring the user to type "DELETE" or confirm explicitly to prevent accidental wipes).

**State Management (`use-events.ts` / Realtime):**
- Although Server Actions/API calls will delete the data, the UI should optimistically remove the deleted items from the local state or trigger a re-fetch, and optionally broadcast a deletion event so other connected clients sync the removal.

## 3. Design
**A. `src/app/api/contacts/[id]/route.ts` Updates:**
- Implement `export const DELETE = withAuth(async (session, req, ctx) => { ... })`.
- Execute `db.delete(schema.contact).where(scoped(..., eq(schema.contact.id, id)))`.

**B. `src/app/api/conversations/[id]/route.ts` Updates:**
- Implement `export const DELETE = withAuth(async (session, req, ctx) => { ... })`.
- Execute `db.delete(schema.conversation).where(scoped(..., eq(schema.conversation.id, id)))`.

**C. `src/app/api/conversations/[id]/messages/[messageId]/route.ts` Creation:**
- Create this new route file.
- Implement `export const DELETE = withAuth(async (session, req, ctx) => { ... })`.
- Execute `db.delete(schema.message).where(scoped(..., eq(schema.message.id, messageId)))`.

**D. `src/app/api/settings/contacts/route.ts` Creation:**
- Create this new route file for the bulk delete endpoint.
- Implement `export const DELETE = withAuth(async (session, req, ctx) => { ... })`.
- Execute `db.delete(schema.contact).where(eq(schema.contact.organizationId, session.organizationId))` to wipe all contacts for the workspace.

**E. UI Enhancements:**
- Extend the respective UI components using existing UI primitives (`button`, `DropdownMenu` / `Dialog` if they exist in `src/components/ui/` or `lucide-react` icons like `Trash2`).
- In the settings panel (e.g. `src/components/settings/hygiene-section.tsx`), add a "Danger Zone" block with a "Wipe All Data" button and a strict confirmation dialog.
- Add mutation logic (e.g., using standard Next.js `fetch` wrappers or existing hooks) to call the `DELETE` endpoints.
- Update the parent component's state to filter out the deleted entities so the UI updates instantly without requiring a full page refresh.

## 4. Tasks
- [x] Add `DELETE` handler to `src/app/api/contacts/[id]/route.ts`.
- [x] Add `DELETE` handler to `src/app/api/conversations/[id]/route.ts`.
- [x] Create `src/app/api/conversations/[id]/messages/[messageId]/route.ts` with `DELETE` handler.
- [x] Create `src/app/api/settings/contacts/route.ts` with `DELETE` handler for bulk wipe.
- [x] Update `src/components/contacts/contacts-client.tsx` to include the delete contact UI and confirmation dialog.
- [x] Update inbox components (`contact-panel.tsx` or similar) to include the delete conversation UI and confirmation dialog.
- [x] Update `src/components/inbox/message-thread.tsx` to include the delete message UI and confirmation dialog.
- [x] Add a "Danger Zone" section to the settings UI (e.g. hygiene-section) with a strict confirmation dialog for wiping all data.
- [x] Test cascade deletion logic manually to ensure no dangling foreign keys cause errors.
