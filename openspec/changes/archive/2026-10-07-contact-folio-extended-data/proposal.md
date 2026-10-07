# Proposal: Contact Extended Data by Folio

## Intent

Extend contact data in the CRM without polluting the core `contact` table by introducing a dedicated, manageable table (`contact_folio`) primarily driven by `Folio`. This allows a single contact (linked by phone number) to have multiple active or historical folios (e.g., loans, leases), while accommodating national Mexican phone numbers (automatically prefixing `+52` when the length is 10 digits). In the UI, a focused detail view will be added to the Contactos section and the Bandeja / Detalles menu, strictly displaying only the relevant financial summary fields: **Folio(s)**, **Fecha de Exigibilidad**, and **Producto** (Préstamo / Arrendamiento).

## Scope

### In Scope
- **Database Schema**: A new `contact_folio` table in Drizzle ORM linked to `organization` (tenant-scoped) and optionally `contact` (by `contact_id` and normalized `phone`).
- **Folio-Driven Upserts**: Folios are unique per organization (`organization_id`, `folio`). New data inserts cleanly and existing folios update atomically.
- **Phone Normalization**: Automatic completion of 10-digit phone numbers assuming `+52` (`52` + 10 digits) to match WhatsApp CRM canonical contact phones.
- **REST Ingestion API**: `POST /api/contacts/folios` accepting single or batch records to insert and update extended data.
- **UI in Bandeja / Detalles menu**: In `ContactPanel` (`src/components/inbox/contact-panel.tsx`), display a clean "Folios / Cartera" card showing only Folio, Fecha de Exigibilidad, and Producto.
- **UI in Contactos section**: In `ContactsClient` (`src/components/contacts/contacts-client.tsx`), display a badge/preview for contacts with linked folios with a modal/popover showing only Folio, Fecha de Exigibilidad, and Producto.
- **Example Data Seeding / Linking**: Script to ingest and link the example folios (`796` and `966`) to contact phone `5521738363` (`525521738363`).

### Out of Scope
- Displaying sensitive financial attributes (Total, Mora, RFC, Personalidad) in the primary contact detail view (these are preserved in the database for backend logic and AI bot context, but hidden in the requested UI views).
- Manual editing/creation forms for folios from the UI (data arrives via API/import).

## Capabilities

### New Capabilities
- `contact-folios`: Manages extended contact records indexed by folio and linked by normalized phone number. Provides ingestion, querying, and restricted UI presentation.

## Approach

1. **Schema Separation**: Create `contact_folio` in `src/lib/db/schema.ts` with tenant isolation (`organization_id`). Store all payload attributes (`folio`, `cliente`, `fechaExigibilidad`, `producto`, `total`, `pagado`, `mora`, `phone`, `correo`, `contacto`, `rfc`, `personalidad`, `externalId`, `rawPayload`).
2. **Phone Normalization Module**: In `src/lib/phone.ts`, implement `normalizeContactPhone(rawPhone: string): string` that strips non-digits and pads 10-digit numbers with `52`.
3. **Ingestion Endpoint**: `POST /api/contacts/folios` parses input with Zod, normalizes phones, looks up existing contacts in the organization, and executes an `onConflictDoUpdate` on `(organization_id, folio)`.
4. **Data Delivery**: Include linked folios in `GET /api/contacts/[id]` (for `ContactPanel`) and in `GET /api/contacts` / dedicated endpoint (for `ContactsClient`).
5. **Restricted Detail Presentation**: Design a lightweight `<ContactFoliosList />` component displaying only Folio, Fecha de Exigibilidad, and Producto (with clean badge tags for "Préstamo" or "Arrendamiento").

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/db/schema.ts` | Modified | Add `contact_folio` table and relations |
| `src/lib/phone.ts` | Created | Phone completion & normalization logic (+52 rule) |
| `src/app/api/contacts/folios/route.ts` | Created | Ingestion & upsert API route |
| `src/app/api/contacts/[id]/route.ts` | Modified | Include linked folios in contact detail response |
| `src/components/inbox/contact-panel.tsx` | Modified | Render Folios section showing Folio, FechaExigibilidad, Producto |
| `src/components/contacts/contacts-client.tsx` | Modified | Render Folios badge and detail view for contacts |
| `scripts/seed-folios.ts` | Created | Standalone script to insert and test example data |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Phone mismatch between incoming folio and WhatsApp contact | Low | Normalizer handles 10-digit local, +52 international, and 521 Meta trunk. Dynamic join on phone ensures folios link even if contact is created after folio. |
| Over-exposing data in UI | Low | Explicit serializer and UI component restricted to render only `folio`, `fechaExigibilidad`, and `producto`. |
| Migration conflict on Coolify | Low | Standard `pnpm db:generate` produces migration run at container startup by `scripts/migrate.mjs`. |

## Rollback Plan

Revert git commit and drop `contact_folio` table. Core `contact` table is completely unaffected.

## Success Criteria

- [ ] `contact_folio` table created without affecting core `contact` schema.
- [ ] Ingesting folio with 10-digit phone `"5521738363"` automatically normalizes to `"525521738363"`.
- [ ] Multiple folios (`796` and `966`) correctly link to the same contact.
- [ ] Detailed view in Bandeja/Detalles displays ONLY Folio, Fecha de Exigibilidad, and Producto.
- [ ] Detailed view in Contactos displays ONLY Folio, Fecha de Exigibilidad, and Producto.
- [ ] Example records successfully inserted and verified against the deployed database structure.
