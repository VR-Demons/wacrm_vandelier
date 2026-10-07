## Purpose

Defines the roles within an organization (Owner, Administrador, Operador), their access levels, and route protections, ensuring restricted data access for support staff.

## Requirements

### Requirement: Role Assignment in Team Creation

The system MUST allow inviting or adding users with a specific role (`Administrador` or `Operador`) in the team settings UI.

#### Scenario: Inviting a new user as an Operador

- GIVEN the user is an Owner or Administrador navigating to "Ajustes > Equipo"
- WHEN the user invites a new member
- THEN they can select "Operador" as the role for the new member
- AND the invited member is created with the "Operador" role

#### Scenario: Existing members default to full access

- GIVEN an existing member user without a explicitly restricted role
- WHEN they access the system
- THEN they functionally retain "Administrador" access levels

### Requirement: UI Visibility Based on Role

The App Navigation UI MUST conditionally render links based on the authenticated user's role.

#### Scenario: Operador views navigation

- GIVEN a user with the "Operador" role is logged in
- WHEN they view the app navigation
- THEN they only see links for Bandeja (Inbox), Pipeline, and Contactos
- AND they do NOT see links for Results, Agent, Lab, or Ajustes (Settings)

#### Scenario: Administrador views navigation

- GIVEN a user with the "Administrador" or "Owner" role is logged in
- WHEN they view the app navigation
- THEN they see all available links including Results, Agent, Lab, and Ajustes

### Requirement: Server-Side Route Protection

The system MUST enforce server-side session checks to prevent unauthorized access to restricted routes based on the user's role.

#### Scenario: Operador attempts to access a restricted route

- GIVEN a user with the "Operador" role is logged in
- WHEN they directly navigate to a restricted route (e.g., `/settings` or `/agent`)
- THEN the system redirects them to `/inbox`

#### Scenario: Operador attempts to access an allowed route

- GIVEN a user with the "Operador" role is logged in
- WHEN they navigate to an allowed route (e.g., `/inbox`, `/pipeline`, or `/contacts`)
- THEN the page loads successfully

#### Scenario: Administrador attempts to access a restricted route

- GIVEN a user with the "Administrador" or "Owner" role is logged in
- WHEN they navigate to a restricted route (e.g., `/settings`)
- THEN the page loads successfully
