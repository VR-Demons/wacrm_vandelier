<Tasks: Add Operador Role>
## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 lines |
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
| 1 | Add Operador Role | PR 1 | Single PR for all changes |

## Phase 1: API & DB Backend
- [x] 1.1 `src/app/api/settings/team/route.ts`: Update `createSchema` to validate `role: z.enum(["member", "operador"]).default("member")`.
- [x] 1.2 `src/app/api/settings/team/route.ts`: Pass `role` from payload into the DB insert query instead of hardcoding `"member"`.

## Phase 2: Core Implementation (Layout Protections)
- [x] 2.1 `src/app/(app)/settings/layout.tsx`: Make async, call `requireSession()`, and `redirect("/inbox")` if `session.member.role === "operador"`.
- [x] 2.2 `src/app/(app)/agent/layout.tsx`: Create new layout with `requireSession()` and redirect check for `operador`.
- [x] 2.3 `src/app/(app)/lab/layout.tsx`: Create new layout with `requireSession()` and redirect check for `operador`.
- [x] 2.4 `src/app/(app)/results/layout.tsx`: Create new layout with `requireSession()` and redirect check for `operador`.

## Phase 3: Integration & Wiring (UI Updates)
- [x] 3.1 `src/components/app-nav.tsx`: Filter the `NAV` array and settings link to exclude `/settings`, `/agent`, `/lab`, `/results` if `session.member.role === "operador"`.
- [x] 3.2 `src/components/app-nav.tsx`: Update the user's role display to show "Administrador" (for `"member"`) or "Operador" (for `"operador"`).
- [x] 3.3 `src/components/settings/team-client.tsx`: Update the team creation form to include a role selector (radio/dropdown) for "Administrador" vs "Operador".
- [x] 3.4 `src/components/settings/team-client.tsx`: Map `"member"` to "Administrador" and `"operador"` to "Operador" in the team member list rendering.

## Phase 4: Testing & Verification
- [x] 4.1 Verify `POST /api/settings/team` correctly saves `"operador"` to DB.
- [x] 4.2 Manually verify logging in as Operador restricts navigation in AppNav.
- [x] 4.3 Manually verify direct navigation to `/settings` as Operador redirects to `/inbox`.
