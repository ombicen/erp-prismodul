/*
  Warnings:

  - You are about to drop the column `supplier_price` on the `product_suppliers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."product_suppliers" DROP CONSTRAINT "product_suppliers_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_suppliers" DROP CONSTRAINT "product_suppliers_supplier_id_fkey";

-- AlterTable
ALTER TABLE "product_suppliers" DROP COLUMN "supplier_price",
ADD COLUMN     "base_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discount_type" TEXT NOT NULL DEFAULT '%',
ADD COLUMN     "discount_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "freight_cost" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "primary_supplier_id" TEXT;

-- CreateTable
CREATE TABLE "other_costs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cost_type" TEXT NOT NULL DEFAULT '%',
    "cost_value" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "other_costs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_primary_supplier_id_fkey" FOREIGN KEY ("primary_supplier_id") REFERENCES "product_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
