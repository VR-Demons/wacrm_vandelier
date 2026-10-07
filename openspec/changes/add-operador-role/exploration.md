## Exploration: Add a new user type "Operador"

### Current State
- The system currently uses `better-auth` with the `organization` plugin.
- The user who registers the instance gets the `owner` role ("Propietario").
- Team accounts created via `Ajustes > Equipo` are hardcoded to receive the `member` role (displayed in UI as "Miembro").
- Currently, there are NO role-based visibility restrictions in the frontend navigation (`AppNav`); all users see all sidebar sections (Bandeja, Pipeline, Contactos, Resultados, Agente, Laboratorio, Ajustes).
- However, the server-side API endpoints for certain settings (e.g., `api/settings/team`, `api/settings/branding`) strictly check `if (session.role !== "owner")` to prevent non-owners from modifying them.
- The user request refers to the current type as "Administrador (admin)". In the codebase, this corresponds to the current `member` role, which acts as an admin because it has full UI access.

### Affected Areas
- `src/components/app-nav.tsx` — Needs to conditionally hide `Resultados`, `Agente`, `Laboratorio`, and `Ajustes` if the user is an "Operador".
- `src/app/(app)/results/page.tsx`, `src/app/(app)/agent/page.tsx`, `src/app/(app)/lab/page.tsx`, `src/app/(app)/settings/layout.tsx` — Server components need to check the session role and redirect `operador` users to `/inbox` (or show a 403) to prevent direct URL access.
- `src/app/api/settings/team/route.ts` — The POST endpoint must accept a `role` parameter instead of hardcoding `"member"`.
- `src/components/settings/team-client.tsx` — The creation form needs a select/radio to let the owner choose between "Administrador" and "Operador" when creating a teammate. The member list UI must correctly display the new roles.
- `src/lib/db/schema.ts` — The `role` column in the `member` table is currently `text().default("member")`. We don't need to change the DB structure, but we will store new values.

### Approaches

1. **Option A: Explicit `admin` and `operador` Roles**
   - Update the UI to allow selecting `admin` (Administrador) or `operador` (Operador).
   - In access checks, treat both `owner`, `admin`, and legacy `member` as having full UI access, while `operador` is restricted.
   - Pros: Aligns exactly with the user's terminology ("admin"). Clean semantics.
   - Cons: Slight disconnect with `better-auth`'s default `member` role, but since it's just a string, it's easily managed.

2. **Option B: Reuse `member` for Administrador and add `operador`**
   - Keep the existing `member` string in DB but rename its UI label to "Administrador".
   - Add `operador` as the restricted role.
   - Pros: No need to handle legacy `member` vs new `admin` logic. Existing users seamlessly become "Administradores".
   - Cons: The string "member" internally meaning "Administrador" is slightly counter-intuitive.

### Recommendation
**Option B (Reuse `member` as Administrador)** is recommended for simplicity, or **Option A** if strict DB string semantics are desired. We will treat `owner`, `admin`, and `member` as having full access, and `operador` as having restricted access.

To implement:
1. Update `team-client.tsx` to include a Role selector (Administrador vs Operador).
2. Update `team/route.ts` to accept the role and insert it.
3. Update `app-nav.tsx` to filter the `NAV` array: `if (role === 'operador')` remove the restricted items.
4. Add authorization checks at the top of the restricted Next.js server pages to redirect `operador` to `/inbox`.

### Risks
- Users manually typing URLs for restricted routes (e.g., `/settings`) could access them if we only hide the UI links. **Mitigation:** We MUST add server-side checks in the Page/Layout components for those routes.
- Existing team members with the `member` role need to retain their full access, so they must be treated as "Administradores" in the new logic.

### Ready for Proposal
Yes. The orchestrator can proceed to the Propose phase to define the implementation details.
