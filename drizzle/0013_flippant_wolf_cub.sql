CREATE TABLE "collection_record" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"contact_id" text,
	"folio" text NOT NULL,
	"client_name" text NOT NULL,
	"phone" text,
	"email" text,
	"contact_name" text,
	"rfc" text,
	"personalidad" text,
	"product" text NOT NULL,
	"due_date" timestamp,
	"total_amount" integer,
	"late_amount" integer,
	"paid" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_run" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"run_type" text NOT NULL,
	"triggered_by" text NOT NULL,
	"total_eligible" integer DEFAULT 0 NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"total_failed" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"status" text DEFAULT 'running' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_send_log" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"record_id" text NOT NULL,
	"channel" text NOT NULL,
	"template_name" text,
	"wa_message_id" text,
	"status" text DEFAULT 'queued' NOT NULL,
	"error" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_upload" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"file_name" text NOT NULL,
	"upload_type" text NOT NULL,
	"product_type" text,
	"record_count" integer NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_workflow_config" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"flow_preventivo" boolean DEFAULT true NOT NULL,
	"flow_payday" boolean DEFAULT true NOT NULL,
	"flow_atrasado" boolean DEFAULT true NOT NULL,
	"flow_email" boolean DEFAULT false NOT NULL,
	"template_preventivo" text,
	"template_payday" text,
	"template_atrasado" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection_record" ADD CONSTRAINT "collection_record_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_record" ADD CONSTRAINT "collection_record_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_run" ADD CONSTRAINT "collection_run_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_send_log" ADD CONSTRAINT "collection_send_log_run_id_collection_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."collection_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_send_log" ADD CONSTRAINT "collection_send_log_record_id_collection_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."collection_record"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_upload" ADD CONSTRAINT "collection_upload_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_upload" ADD CONSTRAINT "collection_upload_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_workflow_config" ADD CONSTRAINT "collection_workflow_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cr_org_idx" ON "collection_record" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cr_org_folio_uq" ON "collection_record" USING btree ("organization_id","folio");