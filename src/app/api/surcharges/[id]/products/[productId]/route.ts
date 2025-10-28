import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
    productId: string;
  }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const surchargeId = resolvedParams.id;
    const productId = resolvedParams.productId;

    // Find and delete the relationship
    await prisma.productSurcharge.deleteMany({
      where: {
        product_id: productId,
        surcharge_id: surchargeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing product from surcharge:', error);
    return NextResponse.json({ error: 'Failed to remove product from surcharge' }, { status: 500 });
  }
}
