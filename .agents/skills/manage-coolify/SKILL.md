---
name: manage-coolify
description: "Manages the vocero-crm and vocero-db deployments using the coolify-vandelier MCP server."
---

# Manage Coolify

This skill provides context and instructions for managing the deployments of this project in Coolify.

## Project Context
- **App Name:** `vocero-crm`
- **Database Name:** `vocero-db`
- **MCP Server:** `coolify-vandelier`

## Instructions
When the user asks to deploy, check the status, restart, or diagnose the application or database, follow these steps:

1. **Use the `coolify-vandelier` MCP Server**: You have access to a suite of tools under this server. 
2. **Finding the Resources**: 
   - You can look up the application using `list_applications` to find the UUID for `vocero-crm`.
   - You can look up the database using `list_databases` to find the UUID for `vocero-db`.
   - The tool `diagnose_app` accepts a name directly (e.g., `vocero-crm`), which is a quick way to check its health.
3. **Common Actions**:
   - **Check Status**: Use `diagnose_app` or `get_application`.
   - **Deploy**: Note that deployments are **automatically triggered by GitHub push**. Only use the `deploy` tool to manually re-trigger a deployment if explicitly requested by the user. Use the resource UUID.
   - **Restart**: Use the `application` tool with `action: "restart"` or the `restart_project_apps` tool.
   - **Logs**: Use the `application_logs` or `logs` tools.
4. **Safety**: Destructive actions (delete, stop) should be confirmed with the user before execution.

## Tool Reference
- `diagnose_app`: Diagnoses an application by name or UUID.
- `deploy`: Triggers a deployment.
- `list_applications`: Lists all applications to retrieve UUIDs.
- `list_databases`: Lists all databases.
- `application_logs`: Retrieves the logs for a specific application UUID.
