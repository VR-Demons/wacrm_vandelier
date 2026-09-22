# Plan: Vandelier Dashboard Implementation

## 1. Technical Design
The feature will live under the `app/vandelier` route in the Next.js project. We will port the React components and adapt them to Next.js App Router conventions (marking interactive components with `"use client"`).

### 1.1 State Management
The original SPA used a global `refreshTrigger` state in `App.tsx`. We will implement a standard React state in the main `vandelier/page.tsx` to hold this `refreshTrigger` and pass it down to `ReportsDashboard` and `DatabaseViewer`.

### 1.2 Tailwind Configuration
We must extend the current `tailwind.config.ts` to include custom animations (`blob`, `fade-in`, `fade-in-up`) used by the Vandelier UI.

### 1.3 Dependencies
We will install the `xlsx` library to handle Excel parsing on the client side.

## 2. Multi-Agent Strategy (Context Preservation)
To implement this efficiently and stay within context limits, we use a 4-agent deployment strategy.

### Agent A: Foundation & Architecture
- **Goal**: Set up Next.js routes, update Tailwind config, install dependencies, and setup basic types.
- **Scope**: `package.json`, `tailwind.config.ts`, `app/vandelier/layout.tsx`, `src/types/vandelier.ts`.

### Agent B: Data Services & Parsing
- **Goal**: Port the `n8n.ts` service and `excelParser.ts` logic.
- **Scope**: `src/services/vandelier/n8n.ts`, `src/utils/vandelier/excelParser.ts`.

### Agent C: Core UI Components
- **Goal**: Implement the structural and static UI components.
- **Scope**: `src/components/vandelier/Header.tsx`, `src/components/vandelier/Accordion.tsx`, `src/components/vandelier/LandingPage.tsx`, `src/components/vandelier/KpiDashboard.tsx`, `src/components/vandelier/FlowChart.tsx`, `src/components/vandelier/SpecialCases.tsx`.

### Agent D: Interactive Data Components
- **Goal**: Implement the complex logic components and assemble the final page.
- **Scope**: `src/components/vandelier/Uploader.tsx`, `src/components/vandelier/ReportsDashboard.tsx`, `src/components/vandelier/DatabaseViewer.tsx`, `app/vandelier/page.tsx`.

### Agent E: Deployment & Coolify Configuration
- **Goal**: Configure necessary environment variables for the new Vandelier integration on Coolify and verify deployment.
- **Scope**: `coolify-vandelier` MCP server (Application UUID: `sdsq2f1w9vr19q8gjyhej8r1`).
