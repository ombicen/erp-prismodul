import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, supplierId } = body;

    if (!productId || !supplierId) {
      return NextResponse.json(
        { error: 'productId and supplierId are required' },
        { status: 400 }
      );
    }

    // Start a transaction to ensure atomic updates
    await prisma.$transaction(async (tx) => {
      // Set all product suppliers for this product to is_primary = false
      await tx.productSupplier.updateMany({
        where: {
          product_id: productId,
        },
        data: {
          is_primary: false,
        },
      });

      // Set the selected supplier to is_primary = true
      await tx.productSupplier.updateMany({
        where: {
          product_id: productId,
          supplier_id: supplierId,
        },
        data: {
          is_primary: true,
        },
      });

      // Update the product's primary_supplier_id
      // Find the ProductSupplier ID first
      const productSupplier = await tx.productSupplier.findFirst({
        where: {
          product_id: productId,
          supplier_id: supplierId,
        },
      });

      if (productSupplier) {
        await tx.product.update({
          where: { id: productId },
          data: {
            primary_supplier_id: productSupplier.id,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting primary supplier:', error);
    return NextResponse.json(
      { error: 'Failed to set primary supplier' },
      { status: 500 }
    );
  }
}
