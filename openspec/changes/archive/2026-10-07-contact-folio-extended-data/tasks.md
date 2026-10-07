# Tasks: Contact Extended Data by Folio

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~300 lines |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Not needed |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Folio Schema, Normalizer, Ingestion API | PR 1 | Database model, Drizzle migration, phone helper & API route |
| 2 | UI Integration & Example Data Verification | PR 1 | Contactos & Bandeja detail components, seeding script, verification |

---

## Phase 1: Database Schema & Core Utilities
- [x] 1.1 `src/lib/phone.ts`: Implement `normalizeContactPhone` utility that strips formatting and auto-prefixes `52` when the length is 10 digits. Add unit tests in `tests/unit/phone-normalizer.test.ts`.
- [x] 1.2 `src/lib/db/schema.ts`: Define `contactFolio` table with `organizationId`, `folio`, `contactId` referencing `contact.id` with `onDelete: "cascade"`, `phone`, `rawPhone`, `fechaExigibilidad`, `producto`, `total`, `mora`, `pagado`, `cliente`, `correo`, `rfc`, `personalidad`, `rawPayload`, and unique index on `(organizationId, folio)`.
- [x] 1.3 Generate database migration with `pnpm db:generate`.

## Phase 2: Ingestion & Backend Logic
- [x] 2.1 `src/server/folios.ts`: Implement `upsertContactFolios` to batch upsert folio records, resolving `contactId` against existing contacts using the normalized phone.
- [x] 2.2 `src/server/folios.ts`: Implement `getFoliosForContact` and `serializeFolioSummary` to return only `folio`, `fechaExigibilidad`, and `producto`.
- [x] 2.3 `src/app/api/contacts/folios/route.ts`: Create authenticated `POST` endpoint accepting single or array of folio objects with Zod validation.
- [x] 2.4 `src/app/api/contacts/[id]/route.ts`: Update `GET` handler to include `folios: ContactFolioSummaryDto[]` in the returned contact payload.

## Phase 3: UI Integration
- [x] 3.1 `src/components/contacts/contact-folios.tsx`: Create `<ContactFoliosList />` displaying only `Folio`, `FechaExigibilidad`, and `Producto` (with clean badge tags for Préstamo vs. Arrendamiento).
- [x] 3.2 `src/components/inbox/contact-panel.tsx`: Add "Folios / Cartera" card to Bandeja details rendering `<ContactFoliosList />`.
- [x] 3.3 `src/components/contacts/contacts-client.tsx`: Render folios indicator badge and detail popup/drawer in Contactos section.

## Phase 4: Example Data Seeding & Deployment
- [x] 4.1 `scripts/seed-folios.ts`: Create script to ingest the 2 example records (Folios 796 and 966, Telefono "5521738363"), verifying they match contact `525521738363`.
- [x] 4.2 Verify cascade deletion: deleting a test contact automatically removes their associated `contact_folio` records.
- [x] 4.3 Verify build (`pnpm build`) and unit tests (`pnpm test`).
- [x] 4.4 Commit, push to `origin main` to trigger Coolify deployment, and verify live database and UI.
