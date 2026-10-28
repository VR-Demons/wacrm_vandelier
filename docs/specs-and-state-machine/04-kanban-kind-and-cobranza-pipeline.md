# Kanban UI `kind` Implementation & Cobranza 5-Phase Pipeline

**Document Version**: 1.0.0  
**Target Repository**: `VRDemons/specs` (Vocero CRM / Vandelier AI)  
**UI Implementation**: [`pipeline-client.tsx`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/pipeline-client.tsx), [`stage-manager.tsx`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/stage-manager.tsx), [`loss-reason-dialog.tsx`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/loss-reason-dialog.tsx), [`lead-drawer.tsx`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/lead-drawer.tsx)  
**Cobranza Workflows**: [`cobranza_migration.md`](file:///D:/AICode/VRDemons/wacrm_vandelier/docs/cobranza_migration.md)  

---

## 1. Overview & Pipeline Mapping

In Vocero CRM, the **`kind`** attribute of a pipeline stage categorizes its role in the commercial/financial lifecycle as either an active operational stage or a terminal anchor.

It is defined in the database schema ([`pipeline_stage.kind`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/lib/db/schema.ts#L205)) with three enum values:
* **`open`**: In-flight negotiation / collection stages.
* **`won`**: Successful closure (*Pagado* / Won Deal).
* **`lost`**: Dropped or delinquent opportunity (*Con Mora* / Lost Deal).

This model maps directly to the **5 Collections (Cobranza) Phases**:

```mermaid
graph LR
    subgraph Active Collection Lifecycle (kind: 'open')
        A["1. A tiempo"] --> B["2. Faltan 5 días o menos"]
        B --> C["3. Día de pago"]
    end

    C --> D["🏆 4. Pagado<br/>(kind: 'won')"]
    C --> E["❌ 5. Con Mora<br/>(kind: 'lost')"]
    B --> E
    A --> E
```

| Phase / Etapa | `kind` | Column Icon & Header | Function in the Pipeline |
|---|---|---|---|
| **A tiempo** | `open` | Standard text + card count pill | Account in good standing. Due date is comfortably in the future (> 5 days). |
| **Faltan 5 días o menos** | `open` | Standard text + card count pill | Critical window for automated AI payment reminders via WhatsApp. Corresponds to `flow_preventivo`. |
| **Día de pago** | `open` | Standard text + card count pill | Due date is today. High-priority focus for payment collection. Corresponds to `flow_payday`. |
| **Pagado** | `won` | 🏆 **`Trophy`** icon (`text-primary`) | **Terminal Success Anchor**: Payment confirmed. Recognized in revenue and closed. |
| **Con Mora** | `lost` | ❌ **`XCircle`** icon (`text-muted-foreground`) | **Terminal Delinquency Anchor**: Account defaulted / past due. Corresponds to `flow_atrasado`. Intercepted with required reason. |

---

## 2. Visual Badging & Display in the Kanban Board

In [`StageColumn`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/pipeline-client.tsx#L292-L340), each column header renders dynamically based on whether it is an in-flight phase, a completed payment, or a default:

```tsx
<div className="flex items-center justify-between px-3 py-2.5">
  <span className="flex items-center gap-1.5 text-[13.5px] font-bold tracking-tight">
    {/* 🏆 Pagado renders a trophy with brand accent color */}
    {stage.kind === "won" && <Trophy className="h-3.5 w-3.5 text-primary" />}
    
    {/* ❌ Con Mora renders a warning/muted status icon */}
    {stage.kind === "lost" && <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
    
    {/* Name: "A tiempo", "Faltan 5 días...", "Día de pago", "Pagado", "Con Mora" */}
    {stage.name}
  </span>
  <span className="rounded-full border border-border-strong bg-background px-2 py-0.5 font-mono text-[11px] text-text-3">
    {leads.length}
  </span>
</div>
```

### Real-Time Column Financial Totals
At the bottom of each column ([`StageFooter`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/pipeline-client.tsx#L343-L360)), the board calculates the total outstanding amount in real-time in integer cents (`amountCents`), avoiding floating-point rounding errors:
* **Columna "Día de pago"**: Shows total money due today (e.g. `$45,800.00 MXN en 12 cuentas`).
* **Columna "Pagado"**: Shows total collected revenue.
* **Columna "Con Mora"**: Shows total delinquent debt at risk.

---

## 3. Drag-and-Drop Interaction & Default Interception

Moving cards between columns using `@dnd-kit` is not a blind update. The UI inspects `destination.kind` **before** executing the move:

```mermaid
sequenceDiagram
    autonumber
    actor User as Gestor de Cobranza
    participant Board as Tablero Kanban (DndContext)
    participant Dialog as LossReasonDialog
    participant API as PATCH /api/pipeline/leads/:id
    participant DB as Postgres (lse_loss_reason_ck)

    User->>Board: Arrastra cliente a "Día de pago" o "Pagado"
    Board->>API: PATCH { stageId, position }
    API->>DB: Atomic moveLeadToStage()
    Board-->>User: Optimistic card placement confirmed

    User->>Board: Arrastra cliente a "Con Mora"
    Board->>Board: INTERCEPTA (la tarjeta no se mueve)
    Board->>Dialog: Abre modal "¿Por qué cayó en Mora?"
    alt Gestor cancela el modal
        Dialog-->>Board: Cancela
        Board-->>User: La tarjeta regresa a su columna original (sin parpadeo)
    alt Gestor selecciona motivo (ej. Sin liquidez, Promesa rota)
        Dialog->>API: PATCH { stageId, lossReason, lossNote }
        API->>DB: Atomic moveLeadToStage()
        Board-->>User: Confirma pase a "Con Mora"
    end
```

### Drag Interception Code
From [`pipeline-client.tsx`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/pipeline-client.tsx#L146-L155):
```tsx
const destino = stages.find((s) => s.id === overStage);
if (destino?.kind === "lost") {
  // Intercept move: Perder un trato / caer en mora exige motivo.
  // Se pregunta ANTES de mover: si el gestor cancela, la tarjeta ni siquiera parpadea.
  setPendingLoss({ leadId, stageId: overStage, name: lead.contact.name });
  return;
}

await moverLead(leadId, overStage);
```

When dropping into **`Con Mora`**, [`LossReasonDialog`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/loss-reason-dialog.tsx) presents the required options:
* `precio` (*Sin liquidez / Sin presupuesto*)
* `no_es_perfil` (*No reconoce la deuda*)
* `sin_presupuesto` (*Promesa rota*)
* `eligio_otro` (*Disputa comercial*)
* `nunca_contesto` (*Incontactable / Teléfono apagado*)
* `otro` (*Otro motivo*)

---

## 4. Immutability & Anchors in `StageManager`

When managing stages via the **Gestionar etapas** modal ([`stage-manager.tsx`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/stage-manager.tsx)):

* **`A tiempo`**, **`Faltan 5 días o menos`**, and **`Día de pago`** (`kind = 'open'`):
  - Can be renamed, reordered with arrow buttons (▲/▼), or deleted.
* **`Pagado`** (`kind = 'won'`) and **`Con Mora`** (`kind = 'lost'`):
  - Act as **permanent structural anchors**.
  - The delete trash button is hidden and replaced with immutable badges:
    ```tsx
    <Badge variant="success">pagado (won)</Badge>
    <Badge variant="secondary">con mora (lost)</Badge>
    ```
  - This guarantees that automated analytics ([Spec 019](file:///D:/AICode/VRDemons/specs/019-resultados/spec.md)) and audit logs will never break due to a missing terminal stage.

---

## 5. Alternate UI Representations of the 5 Phases

### 5.1 The Lead Drawer Quick-Switch Pills
Clicking any card on the board opens [`LeadDrawer`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/pipeline/lead-drawer.tsx#L233-L254), where stages are rendered as quick-action pills. Clicking a pill for **`Con Mora`** routes through the exact same `moverDesdeCajon` interception, enforcing the loss reason dialog.

### 5.2 The Inbox Collapsible Stepper
In the 4-column inbox details panel ([`contact-panel.tsx`](file:///D:/AICode/VRDemons/wacrm_vandelier/src/components/inbox/contact-panel.tsx#L270-L305)), the 5 phases render in the side drawer as an interactive vertical progress stepper:

```
  ● 1. A tiempo            (Done — brand solid dot)
  │
  ● 2. Faltan 5 días...    (Done — connected brand line)
  │
  ◉ 3. Día de pago         (Current active — glowing brand ring)
  │
  ○ 4. Pagado              (Future target — gray open circle)
  │
  ○ 5. Con Mora            (Alternative terminal anchor)
```

Clicking any step in this vertical trail allows the collections agent to immediately advance or update the contact's status directly while conversing on WhatsApp.
