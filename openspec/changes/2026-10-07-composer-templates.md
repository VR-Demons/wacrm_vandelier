# SDD Plan: Composer Template Sender Unification

## 1. Proposal
**Problem:** 
1. The user states that in the "Ventana cerrada" case, there's no way to insert "named params". Currently, the inputs are labeled "Parámetro 1", "Parámetro 2", etc., because Meta only supports positional `{{1}}` variables. The user wants actual named parameters so they know what they are filling in.
2. In the "Ventana abierta" case, the user cannot send a formal "Plantilla aprobada" message (using the API that attaches the configured global image and buttons). Instead, clicking a template just pastes raw text into the composer with `{{1}}` placeholders.
3. The global template image should be sent automatically when a template requires it, across BOTH window states.

**Intent:** 
- Unify the Template Sender UI into the main Composer as an attachment panel for the "Ventana abierta" state, while keeping it as the main UI for the "Ventana cerrada" state.
- Implement true "named parameters" by allowing users to define parameter names during template creation (e.g., `{{nombre}}`, `{{fecha}}`) or editing, storing the mapping in `variablesMap`, and converting them to Meta's required `{{1}}`, `{{2}}` format under the hood.

## 2. Specification
**Template Creation (Named Params):**
- The template creation form will allow `{{nombre}}`, `{{fecha}}` style variables.
- Before sending to Meta, the backend will extract these names, replace them with `{{1}}`, `{{2}}`, and store the mapping `{"body_1": "nombre", "body_2": "fecha"}` in the `variablesMap` column.

**Composer UI Unification:**
- **Window Open:** Add a "Plantilla" button to the composer toolbar. Clicking it opens a panel (similar to Location/Contact) containing the `<TemplateSender />`. The legacy pill buttons that just pasted text will be removed.
- **Window Closed:** The composer restricts text input and forces the `<TemplateSender />` to be visible, just like before, but utilizing the unified design.

## 3. Design
**A. Named Parameters Engine (`src/lib/templates.ts` & `createTemplate`):**
- Update `VARIABLE_REGEX` or add a new parser to capture named variables `\{\{\s*([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ\s]+)\s*\}\}`.
- When creating a template, extract the unique names in order, replace them with `{{1}}`, `{{2}}`, and generate the `variablesMap` JSON to save to the database.

**B. Composer Panel (`src/components/inbox/composer.tsx`):**
- Add `"template"` to the `AttachPanel` type.
- Add a toolbar button for Templates.
- Inside the active panel rendering, if `panel === "template"`, render `<TemplateSender />`.
- Adjust `<TemplateSender />` to fit the panel style (remove outer borders, integrate properly).

**C. Syncing:**
- If a template is synced from Meta and has no mapping, `generateVariablesMap` will still fallback to "Parámetro 1", but new templates created from the CRM will have beautiful named parameters.

## 4. Tasks
- [ ] Task 1: Update `src/lib/templates.ts` to support parsing and replacing named variables.
- [ ] Task 2: Update `createTemplate` API and `TemplatesClient` UI to instruct the user to use named variables (`{{nombre}}`).
- [ ] Task 3: Refactor `Composer` to include the `TemplateSender` as a panel when the window is open.
- [ ] Task 4: Ensure `TemplateSender` sends the template using the unified endpoint, implicitly attaching the configured `organization.logo`.
