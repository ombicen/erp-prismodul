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
    const resolvedParams = await params;
    const surchargeId = resolvedParams.id;

    const productSurcharges = await prisma.productSurcharge.findMany({
      where: { surcharge_id: surchargeId },
      include: {
        product: {
          include: {
            product_group: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });

    const serialized = productSurcharges.map(ps => ({
      id: ps.id,
      product_id: ps.product_id,
      surcharge_id: ps.surcharge_id,
      is_active: ps.is_active,
      created_at: ps.created_at.toISOString(),
      product: {
        id: ps.product.id,
        code: ps.product.code,
        name: ps.product.name,
        purchase_price: ps.product.purchase_price.toNumber(),
        product_group: {
          name: ps.product.product_group.name,
          department: {
            name: ps.product.product_group.department.name,
          },
        },
      },
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching surcharge products:', error);
    return NextResponse.json({ error: 'Failed to fetch surcharge products' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const resolvedParams = await params;
    const surchargeId = resolvedParams.id;
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Check if relationship already exists
    const existing = await prisma.productSurcharge.findUnique({
      where: {
        product_id_surcharge_id: {
          product_id: productId,
          surcharge_id: surchargeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product is already linked to this surcharge' },
        { status: 409 }
      );
    }

    const productSurcharge = await prisma.productSurcharge.create({
      data: {
        product_id: productId,
        surcharge_id: surchargeId,
        is_active: true,
      },
      include: {
        product: {
          include: {
            product_group: {
              include: {
                department: true,
              },
            },
          },
        },
      },
    });

    const serialized = {
      id: productSurcharge.id,
      product_id: productSurcharge.product_id,
      surcharge_id: productSurcharge.surcharge_id,
      is_active: productSurcharge.is_active,
      created_at: productSurcharge.created_at.toISOString(),
      product: {
        id: productSurcharge.product.id,
        code: productSurcharge.product.code,
        name: productSurcharge.product.name,
        purchase_price: productSurcharge.product.purchase_price.toNumber(),
        product_group: {
          name: productSurcharge.product.product_group.name,
          department: {
            name: productSurcharge.product.product_group.department.name,
          },
        },
      },
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error adding product to surcharge:', error);
    return NextResponse.json({ error: 'Failed to add product to surcharge' }, { status: 500 });
  }
}
