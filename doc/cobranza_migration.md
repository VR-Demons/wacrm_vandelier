# Cobranza Module Migration & Deployment Guide

This document outlines the steps required to safely migrate the production database and deploy the new `Cobranza` module to the Vocero CRM environment.

## 1. Database Schema Migration

The module introduces three new tables: `collectionRecord`, `collectionUpload`, `collectionRun`, `collectionSendLog`, and `collectionWorkflowConfig`.

Run the following SQL script directly on the production database to create the required tables:

```sql
-- 1. Tablas principales de Cobranza
CREATE TABLE IF NOT EXISTS "collection_record" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"contact_id" varchar(64),
	"folio" varchar(64) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"product_type" varchar(64) NOT NULL,
	"phone" varchar(64) NOT NULL,
	"personalidad" varchar(64) NOT NULL,
	"total_amount" integer NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"status" varchar(64) DEFAULT 'active' NOT NULL,
	"payment_due_date" timestamp,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "collection_upload" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"user_id" varchar(64) NOT NULL,
	"product_type" varchar(64) NOT NULL,
	"upload_type" varchar(64) NOT NULL,
	"record_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "collection_run" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"organization_id" varchar(64) NOT NULL,
	"run_type" varchar(64) NOT NULL,
	"total_eligible" integer NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"status" varchar(64) DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "collection_send_log" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"run_id" varchar(64) NOT NULL,
	"record_id" varchar(64) NOT NULL,
	"contact_id" varchar(64),
	"channel" varchar(64) NOT NULL,
	"status" varchar(64) DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "collection_workflow_config" (
	"organization_id" varchar(64) PRIMARY KEY NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"flow_preventivo" boolean DEFAULT true NOT NULL,
	"flow_payday" boolean DEFAULT true NOT NULL,
	"flow_atrasado" boolean DEFAULT true NOT NULL,
	"flow_email" boolean DEFAULT false NOT NULL,
	"template_preventivo" varchar(128),
	"template_payday" varchar(128),
	"template_atrasado" varchar(128),
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- 2. Foreign Keys & Indexes
DO $$ BEGIN
 ALTER TABLE "collection_record" ADD CONSTRAINT "collection_record_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "collection_record" ADD CONSTRAINT "collection_record_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "collection_upload" ADD CONSTRAINT "collection_upload_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "collection_upload" ADD CONSTRAINT "collection_upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "collection_run" ADD CONSTRAINT "collection_run_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "collection_send_log" ADD CONSTRAINT "collection_send_log_run_id_collection_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."collection_run"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "collection_send_log" ADD CONSTRAINT "collection_send_log_record_id_collection_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."collection_record"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "collection_workflow_config" ADD CONSTRAINT "collection_workflow_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_collection_record_org_folio" ON "collection_record" USING btree ("organization_id","folio");
```

## 2. Environment Variables configuration

Before restarting the application on Coolify (or your deployment server), you must append the new environment variables so the server recognizes them and enables the module.

Add the following to your `.env` configuration:

```bash
# Enable the Collection Management Module (Cobranza)
COBRANZA="on"

# API Key used by n8n or external triggers to execute batch runs
COBRANZA_API_KEY="your-secure-random-string-here"

# Optional: SMTP Configuration for email delivery fallback
COBRANZA_SMTP_HOST="smtp.gmail.com"
COBRANZA_SMTP_PORT=465
COBRANZA_SMTP_USER="billing@yourdomain.com"
COBRANZA_SMTP_PASS="app-password"
COBRANZA_SMTP_FROM="billing@yourdomain.com"
```

*Note: Replace `COBRANZA_API_KEY` with a strong random secret. You will configure this same secret in your n8n workflow.*

## 3. Deployment via Coolify

1. Ensure the code changes are pushed to your `main` branch.
2. In Coolify, trigger a new deployment for the `vocero-crm` application.
3. Once the deployment finishes, the build will use the updated `pnpm typecheck` and `Next.js` build.
4. Verify the dashboard has the new **Cobranza** navigation item visible on the sidebar.

## 4. Setup in n8n (Webhooks)

The Batch Engine relies on external cron-triggers from n8n to start the daily process logic.

1. Open n8n and create a new Workflow.
2. Add a **Cron** or **Schedule Trigger** node to run every morning (e.g., 9:00 AM).
3. Connect an **HTTP Request** node to it:
   - **Method**: `POST`
   - **URL**: `https://your-crm-url.com/api/cobranza/batch`
   - **Authentication**: Generic Credential Type -> Header Auth
     - *Header Name*: `Authorization`
     - *Value*: `Bearer <YOUR_COBRANZA_API_KEY>`
   - **Body Type**: JSON
   - **JSON / Body Parameters**:
     ```json
     {
       "orgId": "your-organization-id-here",
       "runType": "preventivo"
     }
     ```
     *(Note: `runType` can be `preventivo`, `payday`, `atrasado`, or `email`)*
4. Duplicate the HTTP Node for the different run flows if you wish to run them at different times, or parameterize them.
5. Save and Activate the workflow.

## 5. Verification Steps

1. **Dashboard Check**: Go to the CRM Dashboard. You should see `Cobranza` in the sidebar and `Cobranza` in Settings.
2. **Template Check**: Go to Settings -> Plantillas and ensure you have WhatsApp templates approved for `preventivo`, `payday`, and `atrasado` flows.
3. **Module Config**: Go to `Cobranza` -> Panel and enable the `Habilitar automatización de cobranza` toggle. Select the approved templates for each flow.
4. **Data Upload**: Upload a test Excel file in `Cobranza` -> `Subir Excel`.
5. **Dry Run**: You can test the batch endpoint using curl with `"dryRun": true` in the body payload to see what it would do without actually sending messages.

```bash
curl -X POST https://your-crm-url.com/api/cobranza/batch \
  -H "Authorization: Bearer <YOUR_COBRANZA_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"orgId": "org_xxxx", "runType": "preventivo", "dryRun": true}'
```
