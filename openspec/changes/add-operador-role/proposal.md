<Proposal: Add Operador Role>
## Intent

We need to introduce a new "Operador" role for team members to limit their access to essential CRM functions (Inbox, Pipeline, Contacts) while keeping administrative sections (Results, Agent, Lab, Settings) restricted to owners and administrators. This prevents unauthorized access to settings or sensitive data by support staff.

## Scope

### In Scope
- Update team invitation/creation UI at "Ajustes > Equipo" to include a role selector (Administrador vs. Operador).
- Implement role-based navigation rendering in the AppNav UI to hide restricted links from Operadores.
- Add server-side session checks in Next.js layouts/pages to redirect Operadores from restricted routes back to `/inbox`.
- Ensure data is shared across roles (conversations, contacts, pipeline).
- Map existing "member" users to the "Administrador" role functionally (with full UI access but restricted org settings).

### Out of Scope
- Granular permissions per individual feature within the allowed tabs.
- Multi-tenant data segregation (all users in the org share the same data).

## Capabilities

### New Capabilities
- `user-roles`: Defines the different roles (Owner, Administrador, Operador), their access levels, and route protections within the organization.

### Modified Capabilities
- None

## Approach

Leverage the existing `better-auth` organization plugin. We will manage roles for members to distinguish between the existing access (Administrador) and the new restricted access (Operador). On the frontend, the navigation component will read the session's role to render allowed links. On the backend, Next.js server components/layouts will check the role and enforce a redirect to `/inbox` for unauthorized paths.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| App Navigation UI | Modified | Hide links for restricted routes based on role |
| Protected route layouts | Modified | Add server-side checks to redirect `operador` to `/inbox` |
| `Ajustes > Equipo` UI | Modified | Add role selector when inviting/adding users |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incomplete route protection | Medium | Enforce checks at layout level rather than individual pages, ensuring sub-routes are protected. |
| Existing member disruption | Low | Ensure existing members default to Administrador access to maintain current privileges. |

## Rollback Plan

Revert the UI changes in the navigation and team settings, and remove the layout redirect checks.

## Dependencies

- `better-auth` organization plugin

## Success Criteria

- [ ] A new user can be invited/created as an "Operador".
- [ ] An Operador logging in only sees Bandeja, Pipeline, and Contactos in the navigation.
- [ ] Direct navigation to restricted routes by an Operador results in a redirect to `/inbox`.
- [ ] Existing non-owner members retain their current full UI access as Administrador.
