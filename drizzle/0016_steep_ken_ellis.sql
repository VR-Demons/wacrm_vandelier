ALTER TABLE "template" ADD COLUMN "header" jsonb;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "footer" text;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "buttons" jsonb;--> statement-breakpoint
ALTER TABLE "template" ADD COLUMN "variables_map" jsonb;