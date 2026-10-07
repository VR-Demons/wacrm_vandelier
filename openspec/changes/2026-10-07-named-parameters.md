# SDD Plan: Support Native Named Parameters in Templates

## 1. Proposal
**Problem:** 
When sending templates synced from Meta that use "Named Parameters" (e.g. `{{nombre}}` instead of `{{1}}`), the system fails with error `(#132000) Number of parameters does not match the expected number of params`. This is because the backend regex only captures numerical variables (`\d+`), thus sending `0` parameters to Meta, causing a mismatch.

**Intent:** 
- Natively support Meta's named parameters in the WhatsApp Graph API payload.
- When parsing `template.body` for sending, detect named parameters like `{{nombre}}` and construct the payload using the `param_name` field as required by Meta's Cloud API (`{ type: "text", param_name: "nombre", text: "..." }`).
- Enhance validation and UI to natively display and process named parameters without forcing a positional fallback.

## 2. Specification
**Payload Construction (`buildTemplateComponents`):**
- Extract all unique variables from `template.body` in the order they appear.
- If a variable is numerical (e.g., `1`), send `{ type: "text", text: value }` as a positional parameter.
- If a variable is alphabetical (e.g., `nombre`), send `{ type: "text", param_name: "nombre", text: value }` as a named parameter.

**Validation (`sendTemplate`):**
- Extract all required variables from `template.body`.
- Ensure `input.variables` contains a valid mapping for every required variable. 

**UI (`template-sender.tsx`):**
- Present an input for every named or positional variable correctly.

## 3. Design
**A. `src/lib/templates.ts` Updates:**
- `extractAllVariables(body: string)`: Returns array of variable names `["1", "nombre"]`.
- `renderBody(body: string, variables: Record<string, string>)`: Update to support named variables replacement for local message saving.

**B. `src/server/whatsapp/templatePayload.ts` Updates:**
- Use `extractAllVariables(template.body)`.
- For each variable: check if it's a number (positional) or string (named), and build the corresponding Meta API parameter object.

**C. `src/server/whatsapp/templates.ts` (`sendTemplate`):**
- Instead of looping to `countVariables`, loop over `extractAllVariables`.
- Throw invalid error if any parameter is missing.

## 4. Tasks
- [ ] Task 1: Update `src/lib/templates.ts` with `extractAllVariables` and dictionary `renderBody`.
- [ ] Task 2: Update `buildTemplateComponents` in `src/server/whatsapp/templatePayload.ts` to output `param_name`.
- [ ] Task 3: Update `sendTemplate` in `src/server/whatsapp/templates.ts` to validate and process named variables properly.
- [ ] Task 4: Update UI (`template-sender.tsx`) to map native named variables natively.
