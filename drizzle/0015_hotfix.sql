ALTER TABLE "contact" ADD COLUMN IF NOT EXISTS "name_source" text DEFAULT 'perfil' NOT NULL;
