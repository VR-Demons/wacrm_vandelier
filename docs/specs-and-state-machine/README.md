# Vocero CRM & Cobranza Architecture Documentation (`/doc`)

This directory contains the complete technical analysis, entity relationship designs, state machine specifications, and Kanban UI models for Vocero CRM and its Collections (*Cobranza*) workflow.

---

## Index of Documents

### 1. [Architectural Review & Specifications Audit](01-vocero-specs-architectural-review.md)
* Comprehensive audit of all specification packages (`001-vocero-core` through `019-resultados`).
* Evaluation against the **Vocero CRM Constitution (v1.4.0)** and the 9 Core Principles.
* Analysis of the multi-channel evolution, universal booking engine (`015`), Meta CAPI attribution (`016`), passive ad origin capture (`018`), and zero-dependency analytics (`019`).
* Systematic trade-offs, security invariants, and scalability considerations.

### 2. [Contact, Conversation & Message Database Entity Design](02-contact-messages-data-model.md)
* Relational topology between `organization`, `contact`, `conversation`, `message`, `media_asset`, and `lead`.
* Normalized cross-channel resolution (`wa_identity`) for WhatsApp, Instagram (`ig:<IGSID>`), and Messenger (`fb:<PSID>`).
* Multi-tenant data isolation (`organization_id NOT NULL`) and composite unique indexes.
* Sovereign local media storage (`MEDIA_DIR=/data/media`) rejecting external cloud object stores (S3/R2).
* Complete Mermaid Entity-Relationship (ER) and class diagrams.

### 3. [Multi-Dimensional Contact State Machine](03-contact-state-machine.md)
* **Commercial Pipeline Funnel**: Active stages (`kind: 'open'`) transitioning to terminal anchors `won` or `lost`.
* **Database Check Constraint (`lse_loss_reason_ck`)**: Invariant requiring an audited reason when marking a lead as lost.
* **Conversational AI Handoff State Machine**: The 6 handoff triggers (`cliente`, `modelo`, `manual_reply`, `ventana`, `error`, `hostilidad`).
* **WhatsApp Coexistence Echoes**: Ingestion of `smb_message_echoes` with automated `manual_reply` pause to prevent AI from talking over the business owner.
* **Meta 24-Hour Policy Window**: Open (<20h), Expiring (20h–24h), and Closed (>24h requiring approved templates or `HUMAN_AGENT` tags).

### 4. [Kanban UI `kind` Implementation & Cobranza 5-Phase Pipeline](04-kanban-kind-and-cobranza-pipeline.md)
* Architectural meaning of `kind` (`open`, `won`, `lost`) in pipeline stages.
* Complete mapping to the **5 Collections (Cobranza) Phases**:
  1. **A tiempo** (`kind: 'open'`)
  2. **Faltan 5 días o menos** (`kind: 'open'`)
  3. **Día de pago** (`kind: 'open'`)
  4. **Pagado** (`kind: 'won'` — 🏆 Trophy anchor)
  5. **Con Mora** (`kind: 'lost'` — ❌ XCircle anchor)
* **Drag-and-Drop State Interception**: Immediate movement for active stages vs. required modal interception on drop into `Con Mora` (`LossReasonDialog`).
* **Stage Manager Immutability**: Protected terminal anchors vs. customizable intermediate stages.
* **Alternate UI Surfaces**: Pipeline pills in `LeadDrawer` and interactive vertical stepper in the Inbox details panel (`ContactPanel`).
