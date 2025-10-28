import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contextType = searchParams.get('context_type');
    const contextId = searchParams.get('context_id');

    if (!contextType || !contextId) {
      return NextResponse.json({ error: 'Missing context_type or context_id' }, { status: 400 });
    }

    const rules = await prisma.pricingRule.findMany({
      where: {
        context_type: contextType,
        context_id: contextId,
      },
    });

    const serialized = rules.map(r => ({
      ...r,
      discount_value: r.discount_value?.toNumber() || 0,
      created_at: r.created_at.toISOString(),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing rules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const rule = await prisma.pricingRule.create({
      data,
    });

    const serialized = {
      ...rule,
      discount_value: rule.discount_value?.toNumber() || 0,
      created_at: rule.created_at.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json({ error: 'Failed to create pricing rule' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();

    const updated = await prisma.pricingRule.update({
      where: { id },
      data,
    });

    const serialized = {
      ...updated,
      discount_value: updated.discount_value?.toNumber() || 0,
      created_at: updated.created_at.toISOString(),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json({ error: 'Failed to update pricing rule' }, { status: 500 });
  }
}
