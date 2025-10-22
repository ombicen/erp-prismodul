import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    id: string;
    productId: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: priceGroupId, productId } = await params;
    const body = await request.json();

    // Build update data
    const updateData: any = {};

    if (body.price_group_price !== undefined) updateData.base_price = body.price_group_price;
    if (body.discount_type !== undefined) updateData.discount_type = body.discount_type;
    if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
    if (body.margin_percentage !== undefined) updateData.margin_percentage = body.margin_percentage;
    if (body.net_price !== undefined) updateData.final_price = body.net_price;
    if (body.valid_from !== undefined) updateData.valid_from = body.valid_from ? new Date(body.valid_from) : null;
    if (body.valid_to !== undefined) updateData.valid_to = body.valid_to ? new Date(body.valid_to) : null;

    const pricingRule = await prisma.pricingRule.updateMany({
      where: {
        context_type: 'customer_price_group',
        context_id: priceGroupId,
        product_id: productId,
      },
      data: updateData,
    });

    return NextResponse.json(pricingRule);
  } catch (error) {
    console.error('Error updating price group product:', error);
    return NextResponse.json(
      { error: 'Failed to update price group product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: priceGroupId, productId } = await params;

    await prisma.pricingRule.deleteMany({
      where: {
        context_type: 'customer_price_group',
        context_id: priceGroupId,
        product_id: productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting price group product:', error);
    return NextResponse.json(
      { error: 'Failed to delete price group product' },
      { status: 500 }
    );
  }
}
