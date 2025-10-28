/*
  Warnings:

  - You are about to drop the column `scope_id` on the `surcharges` table. All the data in the column will be lost.
  - You are about to drop the column `scope_type` on the `surcharges` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."surcharges_scope_type_scope_id_idx";

-- AlterTable
ALTER TABLE "surcharges" DROP COLUMN "scope_id",
DROP COLUMN "scope_type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'product';

-- CreateTable
CREATE TABLE "product_surcharges" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "surcharge_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_surcharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_surcharges" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "surcharge_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_surcharges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_surcharges_product_id_surcharge_id_key" ON "product_surcharges"("product_id", "surcharge_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_surcharges_supplier_id_surcharge_id_key" ON "supplier_surcharges"("supplier_id", "surcharge_id");

-- AddForeignKey
ALTER TABLE "product_surcharges" ADD CONSTRAINT "product_surcharges_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_surcharges" ADD CONSTRAINT "product_surcharges_surcharge_id_fkey" FOREIGN KEY ("surcharge_id") REFERENCES "surcharges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_surcharges" ADD CONSTRAINT "supplier_surcharges_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_surcharges" ADD CONSTRAINT "supplier_surcharges_surcharge_id_fkey" FOREIGN KEY ("surcharge_id") REFERENCES "surcharges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
