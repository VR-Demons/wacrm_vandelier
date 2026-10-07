## Purpose

Defines the requirements for storing, updating, linking, and presenting extended folio-driven financial data for CRM contacts.

## Requirements

### Requirement: Folio-Driven Separate Table Storage

The system MUST store extended contact information in a separate table (`contact_folio`) without mutating the core `contact` table schema.

#### Scenario: Storing new folio data
- GIVEN a payload containing `Folio: 796`, `Cliente: "Garciacano Garcia Diego"`, `FechaExigibilidad: "2026-10-01T06:00:00.000Z"`, `Producto: "PRESTAMO"`, and `Telefono: "5521738363"`
- WHEN the data is submitted to the ingestion endpoint
- THEN the record is stored in `contact_folio` with `folio = 796`
- AND all extra properties (`Total`, `Pagado`, `Mora`, `RFC`, etc.) are preserved in the database.

#### Scenario: Updating an existing folio
- GIVEN an existing record with `folio = 796` and `mora = 0`
- WHEN a payload is received with `Folio: 796` and `mora = 30`
- THEN the existing row is updated in place
- AND the `updatedAt` timestamp is updated.

---

### Requirement: Multi-Folio Support per Contact

The system MUST allow multiple folios to be linked to a single contact.

#### Scenario: Multiple folios for the same phone number
- GIVEN two records with different folios (`Folio: 796` and `Folio: 966`) having the same phone `"5521738363"`
- WHEN both records are ingested
- THEN both records exist independently in `contact_folio`
- AND both relate to the single contact representing that phone number.

---

### Requirement: Automatic Phone Normalization (+52 Completion)

The system MUST normalize phone numbers, completing 10-digit Mexican numbers to include the `52` country code prefix.

#### Scenario: 10-digit national number
- GIVEN an input phone `"5521738363"` (length 10)
- WHEN phone normalization is applied
- THEN the normalized phone is `"525521738363"`
- AND it matches a WhatsApp CRM contact whose phone/identity is `"525521738363"`.

#### Scenario: Number with country code or formatting
- GIVEN an input phone `"+52 55 2173 8363"` or `"5215521738363"`
- WHEN phone normalization is applied
- THEN all non-digits are stripped, any `521` trunk is normalized to `52`, resulting in `"525521738363"`.

---

### Requirement: Restricted UI Presentation in Bandeja / Detalles

In the Inbox details panel (`ContactPanel`), the system MUST display linked folios, strictly restricted to showing only the Folio, Fecha de Exigibilidad, and Producto.

#### Scenario: Viewing contact details in Bandeja
- GIVEN a conversation with a contact having folios `796` and `966`
- WHEN the operator opens the "Detalles" panel
- THEN a "Folios" section is displayed
- AND each item displays:
  - Folio: `#796`
  - Fecha de Exigibilidad: formatted date (e.g. `01/10/2026`)
  - Producto: `Préstamo`
- AND other fields (`Cliente`, `Total`, `Mora`, `RFC`, `Personalidad`) are NOT rendered in this view.

---

### Requirement: Restricted UI Presentation in Contactos

In the Contactos section (`ContactsClient`), the system MUST display linked folios for each contact, strictly restricted to showing only the Folio, Fecha de Exigibilidad, and Producto.

#### Scenario: Viewing contact in Contactos list
- GIVEN the Contactos list page
- WHEN a contact has linked folios
- THEN an indicator/badge (e.g. `2 folios`) is shown
- AND clicking or expanding the indicator reveals only the Folio, Fecha de Exigibilidad, and Producto for each folio.

---

### Requirement: Cascade Deletion on Contact Removal

The system MUST delete all associated `contact_folio` records in cascade whenever a contact is deleted (individually or via workspace bulk wipe).

#### Scenario: Deleting an individual contact deletes their folios
- GIVEN an existing contact with linked folios `796` and `966`
- WHEN the contact is deleted via `DELETE /api/contacts/[id]`
- THEN both folios `796` and `966` are deleted from `contact_folio` in cascade.

#### Scenario: Workspace bulk contact wipe deletes all linked folios
- GIVEN multiple contacts with linked folios in the workspace
- WHEN a workspace contact wipe is triggered via `DELETE /api/settings/contacts`
- THEN all `contact_folio` records associated with those contacts are purged in cascade.
