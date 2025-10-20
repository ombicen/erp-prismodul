import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export types for convenience
export type {
  Department,
  ProductGroup,
  Supplier,
  Product,
  ProductSupplier,
  Contract,
  CustomerPriceGroup,
  Campaign,
  PricingRule,
} from '@prisma/client';

// Extended types
export interface ProductWithDetails {
  id: string;
  code: string;
  name: string;
  product_group_id: string;
  purchase_price: number;
  sync_status: string;
  last_sync: Date | null;
  created_at: Date;
  product_group?: {
    id: string;
    name: string;
    code: string;
    department_id: string;
    created_at: Date;
  };
  department?: {
    id: string;
    name: string;
    code: string;
    created_at: Date;
  };
}
