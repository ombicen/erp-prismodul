-- AlterTable
ALTER TABLE "products" ADD COLUMN     "enhet" TEXT,
ADD COLUMN     "varumärke" TEXT;

-- CreateTable
CREATE TABLE "surcharges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost_type" TEXT NOT NULL DEFAULT '%',
    "cost_value" DECIMAL(10,2) NOT NULL,
    "scope_type" TEXT NOT NULL DEFAULT 'local',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "surcharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_surcharges" (
    "id" TEXT NOT NULL,
    "surcharge_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_surcharges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_surcharges_surcharge_id_product_id_key" ON "product_surcharges"("surcharge_id", "product_id");

-- AddForeignKey
ALTER TABLE "product_surcharges" ADD CONSTRAINT "product_surcharges_surcharge_id_fkey" FOREIGN KEY ("surcharge_id") REFERENCES "surcharges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_surcharges" ADD CONSTRAINT "product_surcharges_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
