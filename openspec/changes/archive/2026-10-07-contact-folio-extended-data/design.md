# Design: Contact Extended Data by Folio

## Technical Approach

We introduce a separate, dedicated PostgreSQL table `contact_folio` managed via Drizzle ORM. This keeps the core `contact` entity lightweight while allowing flexible financial and operational records to attach to contacts via normalized phone numbers.

Each folio record stores the full operational payload (including `Cliente`, `Total`, `Mora`, `RFC`, etc.), but the client serializer and UI components strictly filter and display only the three requested fields:
1. **Folio**
2. **Fecha de Exigibilidad**
3. **Producto** (Préstamo / Arrendamiento)

## Architecture Decisions

### Decision: Dedicated `contact_folio` Table vs. `ficha` JSONB
- **Choice**: Create a separate relational table `contact_folio`.
- **Alternatives considered**: Storing under `contact.ficha` JSONB.
- **Rationale**: The user specifically requested a "different manageable table" that is "primary driven by folio" and supports "the same contact with many folios". JSONB inside `contact` cannot enforce unique folio constraints, efficient indexing, or independent atomic upserts across multiple folios. A dedicated table provides clean relational integrity and tenant isolation.

### Decision: Folio-Driven Identity & Upsert Strategy
- **Choice**: Multi-column unique index on `(organization_id, folio)`.
- **Alternatives considered**: Synthetic ID primary key with manual lookups.
- **Rationale**: Allows atomic PostgreSQL `ON CONFLICT (organization_id, folio) DO UPDATE` so ingestion can safely run repeatedly without duplicating folios.

### Decision: Phone Normalization Contract (+52 Rule)
- **Choice**: Implement `normalizeContactPhone(raw: string): string`:
  1. Strip all non-digit characters (`+`, spaces, hyphens).
  2. If length === 10 (national Mexican phone, e.g. `5521738363`), prefix `52` -> `525521738363`.
  3. If length === 13 and starts with `521`, apply `normalizeMx` -> `52...`.
  4. Store both `phone` (canonical e.g. `525521738363`) and `rawPhone` (`5521738363`).
- **Rationale**: WhatsApp CRM identifies Mexican contacts canonical as `52...` (without `+`). Completing 10-digit numbers to `52` ensures 100% seamless matching with existing contacts.

### Decision: UI Presentation Filter
- **Choice**: Create a dedicated React component `<ContactFoliosSummary folios={...} />` and serialize a sanitized DTO:
  ```ts
  export type ContactFolioSummaryDto = {
    id: string;
    folio: number;
    fechaExigibilidad: string | null;
    producto: string | null;
  };
  ```
- **Rationale**: Guarantees that only the three required fields reach the detail rendering, preventing accidental exposure of financial totals, moral status, or internal IDs.

### Decision: Cascade Deletion Policy
- **Choice**: Foreign key constraint with `{ onDelete: "cascade" }`.
- **Alternatives considered**: `set null` or application-level manual deletes.
- **Rationale**: The user explicitly requested that extended data must be deleted in cascade when deleting a contact. Enforcing this at the PostgreSQL constraint level ensures zero orphan records whether a contact is removed individually or via workspace bulk wipe.

---

## Data Model & Schema

```typescript
// src/lib/db/schema.ts
export const contactFolio = pgTable(
  "contact_folio",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    folio: integer("folio").notNull(),
    contactId: text("contact_id")
      .references(() => contact.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(), // Normalizado: 525521738363
    rawPhone: text("raw_phone"),    // Entrada original: 5521738363
    cliente: text("cliente"),
    fechaExigibilidad: timestamp("fecha_exigibilidad", { withTimezone: true }),
    producto: text("producto"),     // PRESTAMO / ARRENDAMIENTO
    total: numeric("total", { precision: 14, scale: 2 }),
    pagado: boolean("pagado").notNull().default(false),
    mora: numeric("mora", { precision: 14, scale: 2 }).default("0"),
    correo: text("correo"),
    contacto: text("contacto"),
    rfc: text("rfc"),
    personalidad: text("personalidad"),
    externalId: integer("external_id"),
    rawPayload: jsonb("raw_payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("contact_folio_org_folio_uq").on(t.organizationId, t.folio),
    index("contact_folio_org_phone_idx").on(t.organizationId, t.phone),
    index("contact_folio_org_contact_id_idx").on(t.organizationId, t.contactId),
  ]
);
```

---

## Data Flow

```
External System / JSON Import
            │
            ▼ (POST /api/contacts/folios)
┌──────────────────────────────────────────────┐
│ Ingestion & Normalizer                        │
│ 1. Parse Zod Schema (array or single object) │
│ 2. normalizeContactPhone(telefono) (+52)     │
│ 3. Match existing contact in organization    │
│ 4. Atomic upsert into contact_folio          │
└──────────────────────────────────────────────┘
            │
            ▼ PostgreSQL (contact_folio table)
            │
    ┌───────┴───────────────────────┐
    │                               │
    ▼                               ▼
GET /api/contacts/[id]          GET /api/contacts
(Bandeja / Detalles)            (Contactos Section)
    │                               │
    ▼                               ▼
ContactPanel                    ContactsClient
Render only:                    Render only:
- Folio                         - Folio
- FechaExigibilidad             - FechaExigibilidad
- Producto                      - Producto
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/db/schema.ts` | Modify | Define `contactFolio` table and relations |
| `src/lib/phone.ts` | Create | Phone normalization helper with +52 rule |
| `src/server/folios.ts` | Create | Database queries: `upsertFolios`, `getFoliosByContactId`, `getFoliosByPhone` |
| `src/app/api/contacts/folios/route.ts` | Create | Endpoint for batch or single folio upsert |
| `src/app/api/contacts/[id]/route.ts` | Modify | Include serialized `folios` in contact detail |
| `src/components/contacts/contact-folios.tsx` | Create | UI component rendering Folio, FechaExigibilidad, Producto |
| `src/components/inbox/contact-panel.tsx` | Modify | Embed Folios card in Bandeja details |
| `src/components/contacts/contacts-client.tsx` | Modify | Embed Folios indicator & modal/drawer |
| `scripts/seed-folios.ts` | Create | Migration script inserting example folios 796 & 966 |

---

## Example Data Ingestion & Resolution

Input records:
```json
[
  {
    "Folio": 796,
    "Cliente": "Garciacano Garcia Diego",
    "FechaExigibilidad": "2026-10-01T06:00:00.000Z",
    "Producto": "PRESTAMO",
    "Total": 9000,
    "Pagado": false,
    "Mora": 0,
    "Telefono": "5521738363",
    "Correo": "",
    "Contacto": "Pamela Chavez",
    "RFC": "",
    "Personalidad": "MORAL",
    "id": 4564
  },
  {
    "Folio": 966,
    "Cliente": "COQUILUB SA DE CV ",
    "FechaExigibilidad": "2026-10-01T06:00:00.000Z",
    "Producto": "PRESTAMO",
    "Total": 453077.91,
    "Pagado": false,
    "Mora": 0,
    "Telefono": "5521738363",
    "Correo": "",
    "Contacto": "Pamela Chavez",
    "RFC": "",
    "Personalidad": "MORAL",
    "id": 4565
  }
]
```

### Linking to Deployed CRM Contacts:
1. `Telefono` `"5521738363"` has length 10 -> completed to `"525521738363"`.
2. Lookup query against `contact` table finds contact where `phone = '525521738363'` or `wa_identity = '525521738363'`.
3. If the contact exists, `contactId` is linked immediately.
4. If the contact does not exist yet, folios remain stored with `phone = '525521738363'`. As soon as a conversation/contact is initiated with that phone number, the system automatically resolves and links the folios dynamically via phone index.
