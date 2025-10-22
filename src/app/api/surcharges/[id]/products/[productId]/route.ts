import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
    productId: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const surchargeId = params.id;
    const productId = params.productId;

    await prisma.productSurcharge.delete({
      where: {
        surcharge_id_product_id: {
          surcharge_id: surchargeId,
          product_id: productId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing product from surcharge:', error);
    return NextResponse.json({ error: 'Failed to remove product from surcharge' }, { status: 500 });
  }
}
