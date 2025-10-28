import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string; supplierId: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const surchargeId = resolvedParams.id;
    const supplierId = resolvedParams.supplierId;

    // Find and delete the relationship
    await prisma.supplierSurcharge.deleteMany({
      where: {
        supplier_id: supplierId,
        surcharge_id: surchargeId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing supplier from surcharge:', error);
    return NextResponse.json({ error: 'Failed to remove supplier from surcharge' }, { status: 500 });
  }
}
