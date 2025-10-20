import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const productSuppliers = await prisma.productSupplier.findMany({
      where: {
        product_id: productId,
      },
      include: {
        supplier: true,
      },
      orderBy: [
        { is_primary: 'desc' },
        { created_at: 'asc' },
      ],
    });

    const enriched = productSuppliers.map(ps => ({
      id: ps.id,
      supplier_id: ps.supplier_id,
      supplier_name: ps.supplier.name,
      base_price: ps.base_price.toNumber(),
      freight_cost: ps.freight_cost.toNumber(),
      discount_type: ps.discount_type,
      discount_value: ps.discount_value.toNumber(),
      is_primary: ps.is_primary,
      created_at: ps.created_at.toISOString(),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching product suppliers:', error);
    return NextResponse.json({ error: 'Failed to fetch product suppliers' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updated = await prisma.productSupplier.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...updated,
      base_price: updated.base_price.toNumber(),
      freight_cost: updated.freight_cost.toNumber(),
      discount_value: updated.discount_value.toNumber(),
      created_at: updated.created_at.toISOString(),
    });
  } catch (error) {
    console.error('Error updating product supplier:', error);
    return NextResponse.json({ error: 'Failed to update product supplier' }, { status: 500 });
  }
}
