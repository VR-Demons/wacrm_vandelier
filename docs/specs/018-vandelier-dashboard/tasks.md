# Tasks: Vandelier Dashboard Migration

## Phase 1: Foundation (Agent A)
- [x] Add `xlsx` dependency (`pnpm add xlsx`).
- [x] Update `tailwind.config.ts` with keyframes and animations (`blob`, `fade-in`, `fade-in-up`).
- [x] Create `app/vandelier/layout.tsx` and `app/vandelier/page.tsx` skeletons.
- [x] Create `src/types/vandelier.ts` with `BackendRow` interface.

## Phase 2: Services & Logic (Agent B)
- [x] Create `src/services/vandelier/n8n.ts` with fetch wrappers for `datatable` and `n8n-workflow` webhooks.
- [x] Create `src/utils/vandelier/excelParser.ts` incorporating SheetJS logic, heuristics, and data formatting.

## Phase 3: Core UI (Agent C)
- [x] Implement `src/components/vandelier/Accordion.tsx`.
- [x] Implement `src/components/vandelier/Header.tsx` with n8n toggle switch.
- [x] Implement `src/components/vandelier/LandingPage.tsx` with animated blob backgrounds.
- [x] Implement informational dashboards (`KpiDashboard.tsx`, `FlowChart.tsx`, `SpecialCases.tsx`).

## Phase 4: Data Interactivity & Assembly (Agent D)
- [x] Implement `src/components/vandelier/Uploader.tsx` with drag/drop states and validation UI.
- [x] Implement `src/components/vandelier/ReportsDashboard.tsx` utilizing the uploader and parsing logic.
- [x] Implement `src/components/vandelier/DatabaseViewer.tsx` with server fetching, sorting, pagination, and inline editing.
- [x] Assemble all components in `app/vandelier/page.tsx`, managing the Landing vs Dashboard state transitions and wiring the `refreshTrigger`.

## Phase 5: Deployment & Configuration (Agent E)
- [x] Identify required environment variables for the integration (e.g. n8n URLs or API keys like `GEMINI_API_KEY`).
- [x] Use the `coolify-vandelier` MCP server to inject the environment variables into the `vocero-crm` application (UUID: `sdsq2f1w9vr19q8gjyhej8r1`).
- [x] Ensure `vocero-db` (UUID: `j50x3ripjw61f1euvaut3o9u`) requires no changes.
- [ ] After pushing code to `main`, wait for Coolify's auto-deploy, then use `diagnose_app` to verify `vocero-crm` is `running:healthy`.
