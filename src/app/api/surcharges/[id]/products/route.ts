import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const surchargeId = params.id;

    const productSurcharges = await prisma.productSurcharge.findMany({
      where: {
        surcharge_id: surchargeId,
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
      orderBy: {
        created_at: 'desc',
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
        purchase_price: ps.product.purchase_price,
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
    const surchargeId = params.id;
    const { productId } = await request.json();

    // Check if assignment already exists
    const existing = await prisma.productSurcharge.findUnique({
      where: {
        surcharge_id_product_id: {
          surcharge_id: surchargeId,
          product_id: productId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product already assigned to this surcharge' },
        { status: 400 }
      );
    }

    const productSurcharge = await prisma.productSurcharge.create({
      data: {
        surcharge_id: surchargeId,
        product_id: productId,
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
        purchase_price: productSurcharge.product.purchase_price,
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
