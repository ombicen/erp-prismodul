/*
  Warnings:

  - You are about to drop the column `target_id` on the `pricing_rules` table. All the data in the column will be lost.
  - You are about to drop the column `target_type` on the `pricing_rules` table. All the data in the column will be lost.
  - Added the required column `product_id` to the `pricing_rules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pricing_rules" DROP COLUMN "target_id",
DROP COLUMN "target_type",
ADD COLUMN     "base_price" DECIMAL(10,2),
ADD COLUMN     "final_price" DECIMAL(10,2),
ADD COLUMN     "margin_percentage" DECIMAL(10,2),
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "valid_from" TIMESTAMP(3),
ADD COLUMN     "valid_to" TIMESTAMP(3),
ALTER COLUMN "discount_type" DROP NOT NULL,
ALTER COLUMN "discount_type" SET DEFAULT '%',
ALTER COLUMN "discount_value" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
