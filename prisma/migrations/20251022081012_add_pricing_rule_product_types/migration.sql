-- DropForeignKey
ALTER TABLE "public"."pricing_rules" DROP CONSTRAINT "pricing_rules_product_id_fkey";

-- AlterTable
ALTER TABLE "pricing_rules" ADD COLUMN     "department_id" TEXT,
ADD COLUMN     "product_group_id" TEXT,
ADD COLUMN     "product_type" TEXT NOT NULL DEFAULT 'single',
ALTER COLUMN "product_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_product_group_id_fkey" FOREIGN KEY ("product_group_id") REFERENCES "product_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
