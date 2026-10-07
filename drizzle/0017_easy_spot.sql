CREATE TABLE "contact_folio" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"folio" integer NOT NULL,
	"contact_id" text,
	"phone" text NOT NULL,
	"raw_phone" text,
	"cliente" text,
	"fecha_exigibilidad" timestamp with time zone,
	"producto" text,
	"total" numeric(14, 2),
	"pagado" boolean DEFAULT false NOT NULL,
	"mora" numeric(14, 2) DEFAULT '0',
	"correo" text,
	"contacto" text,
	"rfc" text,
	"personalidad" text,
	"external_id" integer,
	"raw_payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_folio" ADD CONSTRAINT "contact_folio_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_folio" ADD CONSTRAINT "contact_folio_contact_id_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contact_folio_org_folio_uq" ON "contact_folio" USING btree ("organization_id","folio");--> statement-breakpoint
CREATE INDEX "contact_folio_org_phone_idx" ON "contact_folio" USING btree ("organization_id","phone");--> statement-breakpoint
CREATE INDEX "contact_folio_org_contact_id_idx" ON "contact_folio" USING btree ("organization_id","contact_id");