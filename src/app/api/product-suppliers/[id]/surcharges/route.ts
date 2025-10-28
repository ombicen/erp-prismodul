import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: supplierProductId } = await params;

    // Get the ProductSupplier to find the supplier_id
    const productSupplier = await prisma.productSupplier.findUnique({
      where: { id: supplierProductId },
    });

    if (!productSupplier) {
      return NextResponse.json({ error: 'Product supplier not found' }, { status: 404 });
    }

    // Get surcharges via SupplierSurcharge junction table
    const supplierSurcharges = await prisma.supplierSurcharge.findMany({
      where: {
        supplier_id: productSupplier.supplier_id,
      },
      include: {
        surcharge: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const serialized = supplierSurcharges.map(ss => ({
      id: ss.id,
      surcharge_id: ss.surcharge_id,
      supplier_id: ss.supplier_id,
      is_active: ss.is_active,
      created_at: ss.created_at.toISOString(),
      surcharge: {
        id: ss.surcharge.id,
        name: ss.surcharge.name,
        description: ss.surcharge.description,
        cost_type: ss.surcharge.cost_type,
        cost_value: ss.surcharge.cost_value.toNumber(),
        type: ss.surcharge.type,
        is_active: ss.surcharge.is_active,
      },
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching supplier surcharges:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier surcharges' }, { status: 500 });
  }
}
