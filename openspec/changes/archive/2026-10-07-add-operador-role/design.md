## Technical Approach

We will introduce a new `"operador"` string value for the `role` column in the `member` table. The existing `"member"` role will map to the "Administrador" concept.
The `AppNav` component will filter out administrative routes (`/results`, `/agent`, `/lab`, `/settings`) if the user's role is `"operador"`.
Server-side layouts will enforce this restriction by checking the session and redirecting unauthorized users back to `/inbox`.
The Team creation UI (`Ajustes > Equipo`) will be updated to include a role selector that passes either `"member"` or `"operador"` to the creation API.

## Architecture Decisions

### Decision: Database Role Representation

**Choice**: Reuse the existing `"member"` string for "Administrador" and add `"operador"`.
**Alternatives considered**: Migrate existing `"member"` rows to `"admin"`.
**Rationale**: The `role` column in `member` is just text. By mapping `"member"` to "Administrador" in the UI, we avoid a database migration and gracefully support all existing users without touching their data.

### Decision: Enforcing Route Protection

**Choice**: Add `requireSession()` checks in the Next.js `layout.tsx` files for restricted routes (`/settings/layout.tsx`, `/agent/layout.tsx`, `/lab/layout.tsx`, `/results/layout.tsx`).
**Alternatives considered**: Use Next.js Middleware (`middleware.ts`).
**Rationale**: The repository currently does not use a middleware for auth (auth is handled directly via `withAuth` API wrappers and `requireSession` in server components). Adding checks in `layout.tsx` follows the existing pattern and natively protects all sub-routes of those sections.

### Decision: Role Assignment in Team API

**Choice**: Update `POST /api/settings/team` to accept an optional `role` parameter validated by Zod (`z.enum(["member", "operador"])`), defaulting to `"member"`.
**Alternatives considered**: Create a separate endpoint for operators.
**Rationale**: The logic for creating an account (better-auth internal signup + member row insertion) is identical; only the inserted string changes.

## Data Flow

    TeamClient (UI) ──(POST /api/settings/team)──→ API Route
         │                                            │
    (Selects Role)                              (Inserts role)
                                                      ↓
    AppNav (UI) ◄──(Reads session.role)─────────  DB `member`
    (Hides Links)                                     ↑
                                                      │
    App Layouts ◄──(Checks session.role)──────────────┘
    (Redirects)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/settings/team-client.tsx` | Modify | Add a Role dropdown/radio to the creation form. Render `"Administrador"` for `member` and `"Operador"` for `operador` in the list. |
| `src/app/api/settings/team/route.ts` | Modify | Update `createSchema` to parse `role`, and use it in the DB `insert` instead of hardcoding `"member"`. |
| `src/components/app-nav.tsx` | Modify | Filter `NAV` array and hide the settings link if `role === "operador"`. Update user info display to say `"Administrador"` or `"Operador"`. |
| `src/app/(app)/settings/layout.tsx` | Modify | Make component `async`, call `requireSession()`, and `redirect("/inbox")` if `role === "operador"`. |
| `src/app/(app)/agent/layout.tsx` | Create | New layout with `requireSession()` check to protect all `/agent` sub-routes from operators. |
| `src/app/(app)/lab/layout.tsx` | Create | New layout with `requireSession()` check to protect all `/lab` sub-routes from operators. |
| `src/app/(app)/results/layout.tsx` | Create | New layout with `requireSession()` check to protect all `/results` sub-routes from operators. |

## Interfaces / Contracts

```typescript
// Updated Schema in src/app/api/settings/team/route.ts
const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["member", "operador"]).default("member"),
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | API Role insertion | Send POST request with `role: "operador"` and verify it's correctly stored in DB. |
| E2E | Layout Protection | Log in as Operador, navigate manually to `/settings`, verify automatic redirect to `/inbox`. |
| E2E | UI Restrictions | Log in as Operador, verify AppNav only shows Bandeja, Pipeline, Contactos (and Citas). |

## Migration / Rollout

No migration required. Existing `"member"` roles map functionally to Administrador and retain their current access.

## Open Questions

- None
