import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        product_group: {
          include: {
            department: true,
          },
        },
      },
      orderBy: {
        code: 'asc',
      },
    });

    const enrichedProducts = products.map(p => ({
      ...p,
      purchase_price: p.purchase_price.toNumber(),
      last_sync: p.last_sync ? p.last_sync.toISOString() : null,
      created_at: p.created_at.toISOString(),
      product_group: p.product_group ? {
        ...p.product_group,
        created_at: p.product_group.created_at.toISOString(),
        department: p.product_group.department ? {
          ...p.product_group.department,
          created_at: p.product_group.department.created_at.toISOString(),
        } : null,
      } : null,
    }));

    return NextResponse.json(enrichedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      ...updated,
      purchase_price: updated.purchase_price.toNumber(),
      last_sync: updated.last_sync ? updated.last_sync.toISOString() : null,
      created_at: updated.created_at.toISOString(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
