-- AlterTable (Add columns if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='surcharges' AND column_name='scope_type') THEN
    ALTER TABLE "surcharges" ADD COLUMN "scope_type" TEXT NOT NULL DEFAULT 'product';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='surcharges' AND column_name='scope_id') THEN
    ALTER TABLE "surcharges" ADD COLUMN "scope_id" TEXT;
  END IF;
END $$;

-- Data Migration: Migrate existing product_surcharges data to surcharges table (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='product_surcharges') THEN
    UPDATE "surcharges" s
    SET "scope_id" = ps."product_id"
    FROM "product_surcharges" ps
    WHERE s."id" = ps."surcharge_id";
  END IF;
END $$;

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "surcharges_scope_type_scope_id_idx" ON "surcharges"("scope_type", "scope_id");

-- DropTable (if exists)
DROP TABLE IF EXISTS "product_surcharges";
