import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const surchargeId = resolvedParams.id;

    const surchargeSuppliers = await prisma.supplierSurcharge.findMany({
      where: { surcharge_id: surchargeId },
      include: {
        supplier: true,
      },
    });

    const serialized = surchargeSuppliers.map(ss => ({
      id: ss.id,
      supplier_id: ss.supplier_id,
      surcharge_id: ss.surcharge_id,
      is_active: ss.is_active,
      created_at: ss.created_at.toISOString(),
      supplier: ss.supplier,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching surcharge suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch surcharge suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const surchargeId = resolvedParams.id;
    const { supplierId } = await request.json();

    if (!supplierId) {
      return NextResponse.json({ error: 'supplierId is required' }, { status: 400 });
    }

    // Check if relationship already exists
    const existing = await prisma.supplierSurcharge.findUnique({
      where: {
        supplier_id_surcharge_id: {
          supplier_id: supplierId,
          surcharge_id: surchargeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Supplier is already linked to this surcharge' },
        { status: 409 }
      );
    }

    const supplierSurcharge = await prisma.supplierSurcharge.create({
      data: {
        supplier_id: supplierId,
        surcharge_id: surchargeId,
        is_active: true,
      },
      include: {
        supplier: true,
      },
    });

    const serialized = {
      id: supplierSurcharge.id,
      supplier_id: supplierSurcharge.supplier_id,
      surcharge_id: supplierSurcharge.surcharge_id,
      is_active: supplierSurcharge.is_active,
      created_at: supplierSurcharge.created_at.toISOString(),
      supplier: supplierSurcharge.supplier,
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error adding supplier to surcharge:', error);
    return NextResponse.json({ error: 'Failed to add supplier to surcharge' }, { status: 500 });
  }
}
