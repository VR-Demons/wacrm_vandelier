<whatsapp-templates Specification>
## Purpose

Configuration and processing of WhatsApp template messages, including mapping them to CRM pipeline stages. Enables business logic to trigger template messages and automatically synchronize CRM state.

## Requirements

### Requirement: Template to Pipeline Stage Mapping

The system MUST allow users to map a WhatsApp template to a specific CRM pipeline stage via the template settings UI.

#### Scenario: Mapping Template to Stage

- GIVEN an admin user is on the template settings UI
- WHEN the user selects a pipeline stage for a template
- THEN the system MUST save the `pipelineStageId` for that template in the database
- AND display the saved mapping in the UI

#### Scenario: Removing Template Stage Mapping

- GIVEN a template mapped to a pipeline stage
- WHEN the user unsets or clears the mapped pipeline stage
- THEN the system MUST nullify the `pipelineStageId` for that template
- AND update the UI accordingly

### Requirement: Automated Pipeline Progression

The system MUST automatically advance a lead's pipeline stage when a template message is dispatched, if that template is mapped to a pipeline stage.

#### Scenario: Advancing Pipeline Stage

- GIVEN a lead and a template mapped to a pipeline stage
- WHEN a request is made to send that template to the lead
- THEN the system MUST use the CRM state machine (`stage-history.ts`) to advance the lead's pipeline stage
- AND record the progression correctly in the lead's history

#### Scenario: Unmapped Template Dispatch

- GIVEN a lead and a template NOT mapped to a pipeline stage
- WHEN a request is made to send that template to the lead
- THEN the system MUST dispatch the template
- AND NOT alter the lead's pipeline stage
</whatsapp-templates Specification>
