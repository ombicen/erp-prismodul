import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const surchargeId = resolvedParams.id;

    // Delete all supplier relationships for this surcharge
    const result = await prisma.supplierSurcharge.deleteMany({
      where: { surcharge_id: surchargeId },
    });

    return NextResponse.json({
      success: true,
      deleted_count: result.count
    });
  } catch (error) {
    console.error('Error cascade deleting supplier relationships:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier relationships' },
      { status: 500 }
    );
  }
}
