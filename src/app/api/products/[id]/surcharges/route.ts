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
    const { id: productId } = await params;

    const productSurcharges = await prisma.productSurcharge.findMany({
      where: {
        product_id: productId,
      },
      include: {
        surcharge: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const serialized = productSurcharges.map(ps => ({
      id: ps.id,
      surcharge_id: ps.surcharge_id,
      product_id: ps.product_id,
      is_active: ps.is_active,
      created_at: ps.created_at.toISOString(),
      surcharge: {
        id: ps.surcharge.id,
        name: ps.surcharge.name,
        description: ps.surcharge.description,
        cost_type: ps.surcharge.cost_type,
        cost_value: ps.surcharge.cost_value.toNumber(),
        scope_type: ps.surcharge.scope_type,
        is_active: ps.surcharge.is_active,
      },
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching product surcharges:', error);
    return NextResponse.json({ error: 'Failed to fetch product surcharges' }, { status: 500 });
  }
}
