# Archive Report: Contact Extended Data by Folio

**Change**: `2026-10-07-contact-folio-extended-data`  
**Date**: 2026-10-07  
**Status**: Archived  
**Store Mode**: Hybrid (OpenSpec + Engram)  

## Executive Summary

The `2026-10-07-contact-folio-extended-data` change has been implemented, verified, and completed.
Extended contact portfolio data is stored in a dedicated `contact_folio` table with composite index `(organization_id, folio)` for atomic upsert operations, referencing `contact.id` with PostgreSQL foreign key `ON DELETE CASCADE`. Ingestion normalizes Mexican phone numbers to 12-digit format (`52...`) matching CRM contacts. The UI in Inbox (`ContactPanel`) and Contacts (`ContactsClient`) strictly restricts presentation to Folio number, Fecha de Exigibilidad, and Producto via a sealed DTO serializer.

All 741 tests across 79 test suites passed, and the Next.js production build succeeded with 0 errors.

## Synced Specs

- `openspec/specs/contact-folios/spec.md` (Domain: `contact-folios` - 6 requirements, 10 scenarios)
  - Requirement: Folio-Driven Separate Table Storage
  - Requirement: Multi-Folio Support per Contact
  - Requirement: Automatic Phone Normalization (+52 Completion)
  - Requirement: Restricted UI Presentation in Bandeja / Detalles
  - Requirement: Restricted UI Presentation in Contactos
  - Requirement: Cascade Deletion on Contact Removal

## Artifacts Summary

- **Proposal**: `proposal.md`
- **Design**: `design.md`
- **Tasks**: `tasks.md` (100% completed)
- **Delta Spec**: `specs/contact-folios/spec.md`
- **Verification Report**: `verify-report.md` (Verdict: PASS)
- **Archive Report**: `archive-report.md`

## Archive Destination

- `openspec/changes/archive/2026-10-07-contact-folio-extended-data/`
