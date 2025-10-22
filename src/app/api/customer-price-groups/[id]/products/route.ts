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
    const { id: priceGroupId } = await params;
    console.log('Fetching products for price group:', priceGroupId);

    // Get all pricing rules for this customer price group
    const pricingRules = await prisma.pricingRule.findMany({
      where: {
        context_type: 'customer_price_group',
        context_id: priceGroupId,
      },
      include: {
        product: true,
        product_group: true,
        department: true,
      },
    });

    console.log('Found pricing rules:', pricingRules.length);

    // Transform to the format expected by the frontend
    const products = pricingRules.map(rule => {
      const productType = rule.product_type || 'single';

      return {
        id: rule.id,
        product_id: rule.product_id,
        product_code:
          productType === 'single' ? (rule.product?.code || '') :
          productType === 'product_group' ? (rule.product_group?.code || '') :
          productType === 'department' ? (rule.department?.code || '') :
          'ALLA',
        product_name:
          productType === 'single' ? (rule.product?.name || '') :
          productType === 'product_group' ? (rule.product_group?.name || '') :
          productType === 'department' ? (rule.department?.name || '') :
          'Hela sortimentet',
        product_type: productType,
        product_group_name: productType === 'product_group' ? rule.product_group?.name : undefined,
        department_name: productType === 'department' ? rule.department?.name : undefined,
        purchase_price: rule.product?.purchase_price?.toNumber(),
        price_group_price: rule.base_price?.toNumber(),
        discount_type: rule.discount_type || '%',
        discount_value: rule.discount_value?.toNumber() || 0,
        margin_percentage: rule.margin_percentage?.toNumber(),
        net_price: rule.final_price?.toNumber(),
        valid_from: rule.valid_from?.toISOString().split('T')[0],
        valid_to: rule.valid_to?.toISOString().split('T')[0],
      };
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching price group products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price group products' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: priceGroupId } = await params;
    const body = await request.json();

    const productType = body.product_type || 'single';

    const data: any = {
      context_type: 'customer_price_group',
      context_id: priceGroupId,
      product_type: productType,
      discount_type: body.discount_type || '%',
      discount_value: body.discount_value || 0,
      valid_from: body.valid_from ? new Date(body.valid_from) : null,
      valid_to: body.valid_to ? new Date(body.valid_to) : null,
    };

    // Set the appropriate ID field based on product_type
    if (productType === 'single') {
      data.product_id = body.product_id;
      data.base_price = body.price_group_price;
      data.margin_percentage = body.margin_percentage;
      data.final_price = body.net_price;
    } else if (productType === 'product_group') {
      data.product_group_id = body.product_group_id;
    } else if (productType === 'department') {
      data.department_id = body.department_id;
    }
    // 'all' type doesn't need any specific ID

    const pricingRule = await prisma.pricingRule.create({
      data,
      include: {
        product: true,
        product_group: true,
        department: true,
      },
    });

    return NextResponse.json(pricingRule);
  } catch (error) {
    console.error('Error creating price group product:', error);
    return NextResponse.json(
      { error: 'Failed to create price group product' },
      { status: 500 }
    );
  }
}
