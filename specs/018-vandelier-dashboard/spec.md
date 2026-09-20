# Spec: Vandelier AI Dashboard Integration

## 1. Context & Motivation
The `vocero-crm` project requires the integration of the "Vandelier AI Dashboard" functionality from an external React+Vite SPA (`vandelierai.com`). This module acts as a specialized control panel for the management and monitoring of automated collection processes (cartera de cobranza), interfacing tightly with an `n8n` automation backend.

## 2. Goals
- **UI/UX Parity**: Replicate the exact look and feel of the original Vandelier dashboard.
  - **Landing Page**: Dark theme (`bg-slate-900`) with ambient, softly glowing colored orbs (`animate-blob`).
  - **Dashboard**: Light theme (`bg-slate-50`) focusing on high contrast, readable typography, and card-based containment using an **accordion pattern** for major modules.
- **Functionality Parity**:
  - **Data Ingestion**: Client-side parsing of `.xls`, `.xlsx`, and `.csv` files using `xlsx` (SheetJS) and robust heuristics to identify columns dynamically.
  - **Data Management**: A data grid (`DatabaseViewer`) with client-side pagination, sorting, and inline editing.
  - **Monitoring**: Read-only KPI, FlowChart, and Special Cases components.
  - **System Control**: A global toggle switch (with confirmation modal) to activate/deactivate the n8n bot workflow.
- **Next.js Adaptation**: Migrate from Vite SPA routing to the Next.js App Router (e.g., under `/vandelier`).

## 3. Out of Scope
- Migrating the n8n backend itself; we will continue to use the existing `n8n.vandelierai.com` webhooks.
- Rewriting the Excel parsing logic from scratch; the goal is a direct port of the proven heuristics.

## 4. Requirements & Architecture
- **Routing**: `app/vandelier/page.tsx` will host the Landing Page, transitioning to the main dashboard.
- **Data Model**: Adopt the `BackendRow` interface for standardization.
- **Integration**: `n8n` service calls should be wrapped in standard Next.js utility functions or Server Actions if security requires, though client-side fetch is acceptable if matching the original architecture.
